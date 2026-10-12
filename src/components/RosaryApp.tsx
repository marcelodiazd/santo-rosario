import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RosaryData, Step } from '../data/types';
import { decadeOrdinal, setForWeekday } from '../lib/mysteries';
import { clampWpm, stepSeconds } from '../lib/pacing';
import { browserStorage, loadProgress, localDateKey, saveProgress } from '../lib/progress';
import { buildSequence, indexForPosition, positionStatus, resolveIndex } from '../lib/sequence';
import type { PositionId } from '../lib/geometry';
import { PrayerPanel } from './PrayerPanel';
import { RosaryView } from './RosaryView';

interface Props {
  data: RosaryData;
  /** Today's date. Passed in by tests so results do not depend on the real day. */
  today?: Date;
  /** Where progress is saved. Defaults to window.localStorage. */
  storage?: Storage | null;
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

export function RosaryApp({ data, today: todayProp, storage: storageProp }: Props) {
  const [today] = useState(() => todayProp ?? new Date());
  const [storage] = useState(() => (storageProp === undefined ? browserStorage() : storageProp));
  const [initial] = useState(() => loadProgress(storage, today));

  const [seq, setSeq] = useState<number | null>(initial.seq);
  const [setId, setSetId] = useState<string | null>(initial.setId);
  const [traditional, setTraditional] = useState(initial.traditional);
  const [wpm, setWpm] = useState(initial.wpm);
  const [playing, setPlaying] = useState(false);

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
  const seconds = useMemo(
    () => stepSeconds(step.prayerIds.map((id) => data.prayers[id]), wpm),
    [step, data.prayers, wpm],
  );

  // Every manual action pauses auto-advance.
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

  // Save progress whenever it changes.
  useEffect(() => {
    saveProgress(storage, { seq: step.seq, setId, traditional, wpm, date: localDateKey(today) });
  }, [storage, step.seq, setId, traditional, wpm, today]);

  // Auto-advance: wait for the step's duration, then move on; stop on the last step.
  useEffect(() => {
    if (!playing) return;
    if (index >= lastIndex) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setSeq(sequence[index + 1].seq), seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, index, lastIndex, sequence, seconds]);

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
          onTogglePlay={() => setPlaying((p) => !p)}
          wpm={wpm}
          onWpmChange={(value) => setWpm(clampWpm(value))}
          stepSeconds={seconds}
          traditional={traditional}
          onTraditionalChange={(on) => {
            setPlaying(false);
            setTraditional(on);
          }}
        />
      </main>
    </div>
  );
}
