import type { MysterySet, Prayer, Step } from '../data/types';
import { mysteryLine } from './mysteries';
import { wordCount } from './pacing';
import { parsePrayer } from './prayerText';

/**
 * Read-aloud: turns a step into a list of segments the voice speaks, with
 * silent pauses where the people answer (the R/ lines, litany responses and
 * the second half of prayers said in two halves).
 */

/** Which line of the step a segment belongs to, so the panel can highlight it. */
export interface LineRef {
  /** Index of the prayer within the step. */
  prayer: number;
  paragraph: number;
  line: number;
}

export type Segment =
  | { kind: 'speak'; text: string; ref: LineRef | null }
  | { kind: 'pause'; text: string; ref: LineRef };

/** A voice the device offers. */
export interface VoiceInfo {
  uri: string;
  name: string;
  lang: string;
  local: boolean;
}

export interface SpeakOptions {
  voiceURI: string | null;
  lang: string;
  rate: number;
}

/** The parts of the browser's speech engine the app uses (see speechEngine.ts). */
export interface SpeechEngine {
  getVoices(): VoiceInfo[];
  /** Calls back when the device's voice list changes. Returns an unsubscribe function. */
  onVoicesChanged(callback: () => void): () => void;
  /** Speaks text; calls onEnd once when it finishes or fails. */
  speak(text: string, options: SpeakOptions, onEnd: () => void): void;
  cancel(): void;
  /** Starts the engine from a tap. iPhones only allow speech that starts from a user action. */
  prime(): void;
}

export const DEFAULT_LANG = 'es-ES';

/** Longest piece sent to the engine at once. Some browsers stop long utterances early. */
const MAX_CHUNK = 180;

/** Splits long text at sentence breaks, then commas, so each piece is at most `max` characters. */
export function splitForSpeech(text: string, max = MAX_CHUNK): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean ? [clean] : [];

  const pieces = clean.match(/[^.;:!?]+[.;:!?]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let current = '';
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const piece of pieces) {
    if (piece.length > max) {
      push();
      for (const part of piece.match(/[^,]+,?\s*/g) ?? [piece]) {
        if ((current + part).trim().length > max) push();
        current += part;
      }
      push();
    } else {
      if ((current + piece).trim().length > max) push();
      current += piece;
    }
  }
  push();
  return chunks;
}

/** True for the step that opens a decade ("Primer misterio", ...): it announces the mystery. */
function opensDecade(step: Step): boolean {
  return step.decade != null && step.aveNumber == null && /misterio/i.test(step.title);
}

export function buildSegments(step: Step, prayers: readonly Prayer[], set: MysterySet): Segment[] {
  const segments: Segment[] = [];
  const speak = (text: string, ref: LineRef | null) => {
    for (const chunk of splitForSpeech(text)) segments.push({ kind: 'speak', text: chunk, ref });
  };

  const announcement = opensDecade(step) ? mysteryLine(step, set) : null;
  if (announcement) speak(`${announcement}.`, null);
  if (step.note) speak(`${step.note}.`, null);

  prayers.forEach((prayer, prayerIndex) => {
    let lineNumber = 0;
    parsePrayer(prayer.body).forEach((paragraph, p) => {
      paragraph.forEach((line, l) => {
        lineNumber += 1;
        const ref = { prayer: prayerIndex, paragraph: p, line: l };
        if (line.kind === 'response') {
          segments.push({ kind: 'pause', text: line.text, ref });
        } else if (line.kind === 'litany') {
          speak(line.invocation, ref);
          segments.push({ kind: 'pause', text: line.response, ref });
        } else if (prayer.responseLine != null && lineNumber >= prayer.responseLine) {
          segments.push({ kind: 'pause', text: line.text, ref });
        } else {
          speak(line.text, ref);
        }
      });
    });
  });

  return segments;
}

/** Seconds of silence left for the people to say a response, at the chosen speed. */
export function pauseSeconds(text: string, wpm: number): number {
  return Math.max(1.2, (wordCount(text) / wpm) * 60);
}

/** Speech rate for the speed slider: 110 words per minute gives a calm 0.85. */
export function rateForWpm(wpm: number): number {
  return Math.round(Math.min(1.25, Math.max(0.6, wpm / 130)) * 100) / 100;
}

/** The device's Spanish voices, Spain first, then by language and name. */
export function spanishVoices(voices: readonly VoiceInfo[]): VoiceInfo[] {
  const rank = (v: VoiceInfo) => (/^es[-_]ES$/i.test(v.lang) ? 0 : 1);
  return voices
    .filter((v) => /^es([-_]|$)/i.test(v.lang))
    .sort((a, b) => rank(a) - rank(b) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
}

/** The chosen voice if the device still has it; otherwise the best Spanish voice, preferring on-device ones. */
export function pickVoice(voices: readonly VoiceInfo[], preferredUri: string | null): VoiceInfo | null {
  const spanish = spanishVoices(voices);
  const preferred = preferredUri ? spanish.find((v) => v.uri === preferredUri) : undefined;
  if (preferred) return preferred;
  return spanish.find((v) => v.local) ?? spanish[0] ?? null;
}

export interface RunOptions extends SpeakOptions {
  wpm: number;
}

export interface RunHooks {
  onSegment(index: number): void;
  onDone(): void;
}

/**
 * Plays segments in order: speaks the "speak" ones and waits in silence on the
 * "pause" ones. Returns a function that stops playback. If the engine never
 * reports the end of an utterance, a watchdog moves on so the prayer never hangs.
 */
export function runSegments(
  engine: SpeechEngine,
  segments: readonly Segment[],
  options: RunOptions,
  hooks: RunHooks,
): () => void {
  let index = -1;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const next = () => {
    if (stopped) return;
    clearTimeout(timer);
    index += 1;
    if (index >= segments.length) {
      hooks.onDone();
      return;
    }
    const segment = segments[index];
    hooks.onSegment(index);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      next();
    };

    if (segment.kind === 'pause') {
      timer = setTimeout(finish, pauseSeconds(segment.text, options.wpm) * 1000);
    } else {
      const expectedMs = (wordCount(segment.text) / (150 * options.rate)) * 60_000;
      timer = setTimeout(finish, expectedMs * 2 + 4000);
      engine.speak(segment.text, { voiceURI: options.voiceURI, lang: options.lang, rate: options.rate }, finish);
    }
  };

  next();

  return () => {
    stopped = true;
    clearTimeout(timer);
    engine.cancel();
  };
}
