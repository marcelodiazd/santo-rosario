import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RosaryData, Step } from '../data/types';
import { decadeOrdinal, setForWeekday } from '../lib/mysteries';
import { clampWpm, stepSeconds } from '../lib/pacing';
import { browserStorage, loadProgress, localDateKey, saveProgress } from '../lib/progress';
import { buildSequence, indexForPosition, positionStatus, resolveIndex } from '../lib/sequence';
import {
  DEFAULT_LANG,
  buildSegments,
  pickVoice,
  rateForWpm,
  runSegments,
  spanishVoices,
  type LineRef,
  type SpeechEngine,
  type VoiceInfo,
} from '../lib/speech';
import { browserSpeech } from '../lib/speechEngine';
import type { PositionId } from '../lib/geometry';
import { PrayerPanel } from './PrayerPanel';
import { RosaryView } from './RosaryView';

interface Props {
  data: RosaryData;
  /** Today's date. Passed in by tests so results do not depend on the real day. */
  today?: Date;
  /** Where progress is saved. Defaults to window.localStorage. */
  storage?: Storage | null;
  /** Speech engine for read-aloud. Defaults to the browser's; null hides read-aloud. */
  speech?: SpeechEngine | null;
}

/** "3.ª Avemaría, tercer misterio": a bead's accessible name. */
function beadLabel(step: Step): string {
  if (step.decade != null && !/misterio/i.test(step.title)) {
    return `${step.title}, ${decadeOrdinal(step.decade).toLowerCase()} misterio`;
  }
  return step.title;
}

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, select, textarea, button, [role="button"], [role="radio"], [contenteditable="true"]') !== null
  );
}

export function RosaryApp({ data, today: todayProp, storage: storageProp, speech: speechProp }: Props) {
  const [today] = useState(() => todayProp ?? new Date());
  const [storage] = useState(() => (storageProp === undefined ? browserStorage() : storageProp));
  const [speech] = useState(() => (speechProp === undefined ? browserSpeech() : speechProp));
  const [initial] = useState(() => loadProgress(storage, today));

  const [seq, setSeq] = useState<number | null>(initial.seq);
  const [setId, setSetId] = useState<string | null>(initial.setId);
  const [traditional, setTraditional] = useState(initial.traditional);
  const [wpm, setWpm] = useState(initial.wpm);
  const [voiceOn, setVoiceOn] = useState(initial.voice);
  const [voiceURI, setVoiceURI] = useState<string | null>(initial.voiceURI);
  const [voices, setVoices] = useState<VoiceInfo[]>(() => speech?.getVoices() ?? []);
  const [playing, setPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState<LineRef | null>(null);

  const todaySet = useMemo(() => setForWeekday(data.mysterySets, today.getDay()), [data.mysterySets, today]);
  const activeSet = data.mysterySets.find((s) => s.id === setId) ?? todaySet;

  const sequence = useMemo(() => buildSequence(data.steps, traditional), [data.steps, traditional]);
  const index = resolveIndex(sequence, seq);
  const step = sequence[index];
  const lastIndex = sequence.length - 1;

  const statuses = useMemo(() => positionStatus(sequence, index), [sequence, index]);
  const labels = useMemo(() => {
    const out: Record<PositionId, string> = {};
    for (const s of sequence) out[s.position] ??= beadLabel(s);
    return out;
  }, [sequence]);
  const stepPrayers = useMemo(() => step.prayerIds.map((id) => data.prayers[id]), [step, data.prayers]);
  const seconds = useMemo(() => stepSeconds(stepPrayers, wpm), [stepPrayers, wpm]);

  const spanish = useMemo(() => spanishVoices(voices), [voices]);
  const voice = useMemo(() => pickVoice(voices, voiceURI), [voices, voiceURI]);
  const engine = voiceOn ? speech : null;

  // Every manual action pauses auto-advance and stops the voice.
  const goTo = useCallback(
    (i: number) => {
      setPlaying(false);
      const target = sequence[Math.min(Math.max(i, 0), lastIndex)];
      setSeq(target.seq);
    },
    [sequence, lastIndex],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);
  const selectPosition = useCallback(
    (position: PositionId) => goTo(indexForPosition(sequence, index, position)),
    [goTo, sequence, index],
  );

  const togglePlay = () => {
    // iPhones only allow speech that starts from a tap, so wake the engine here.
    if (!playing && engine) engine.prime();
    setPlaying((p) => !p);
  };

  // Most browsers load their voices in the background.
  useEffect(() => {
    if (!speech) return;
    setVoices(speech.getVoices());
    return speech.onVoicesChanged(() => setVoices(speech.getVoices()));
  }, [speech]);

  // Save progress whenever it changes.
  useEffect(() => {
    saveProgress(storage, {
      seq: step.seq,
      setId,
      traditional,
      wpm,
      voice: voiceOn,
      voiceURI,
      date: localDateKey(today),
    });
  }, [storage, step.seq, setId, traditional, wpm, voiceOn, voiceURI, today]);

  // Auto-advance. With read-aloud on, the voice reads the step (pausing for the
  // responses) and the app moves on when it finishes. Otherwise it waits for
  // the step's timed duration.
  useEffect(() => {
    if (!playing) return;

    if (engine) {
      const segments = buildSegments(step, stepPrayers, activeSet);
      const stop = runSegments(
        engine,
        segments,
        { voiceURI: voice?.uri ?? null, lang: voice?.lang ?? DEFAULT_LANG, rate: rateForWpm(wpm), wpm },
        {
          onSegment: (i) => setActiveLine(segments[i].ref),
          onDone: () => {
            setActiveLine(null);
            if (index < lastIndex) setSeq(sequence[index + 1].seq);
            else setPlaying(false);
          },
        },
      );
      return () => {
        stop();
        setActiveLine(null);
      };
    }

    if (index >= lastIndex) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setSeq(sequence[index + 1].seq), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, engine, step, stepPrayers, activeSet, voice, wpm, index, lastIndex, sequence, seconds]);

  // Keyboard: Right arrow or Space = next, Left arrow = previous.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isFormControl(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previous();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, previous]);

  return (
    <div className="app">
      <aside className="rosary-column">
        <RosaryView statuses={statuses} labels={labels} onSelect={selectPosition} />
      </aside>
      <main className="panel-column">
        <PrayerPanel
          sets={data.mysterySets}
          activeSet={activeSet}
          todaySetId={todaySet.id}
          onSelectSet={(id) => {
            setPlaying(false);
            setSetId(id);
          }}
          sequence={sequence}
          index={index}
          prayers={data.prayers}
          onGoTo={goTo}
          onPrevious={previous}
          onNext={next}
          playing={playing}
          onTogglePlay={togglePlay}
          wpm={wpm}
          onWpmChange={(value) => setWpm(clampWpm(value))}
          stepSeconds={seconds}
          traditional={traditional}
          onTraditionalChange={(on) => {
            setPlaying(false);
            setTraditional(on);
          }}
          speech={
            speech
              ? {
                  on: voiceOn,
                  onToggle: (on) => {
                    setPlaying(false);
                    setVoiceOn(on);
                  },
                  voices: spanish,
                  chosenUri: voice?.uri === voiceURI ? voiceURI : null,
                  onChooseVoice: (uri) => {
                    setPlaying(false);
                    setVoiceURI(uri);
                  },
                  activeLine,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
