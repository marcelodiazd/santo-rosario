import type { Prayer } from '../data/types';

export const MIN_SECONDS = 4;
export const WPM_MIN = 80;
export const WPM_MAX = 160;
export const WPM_DEFAULT = 110;

/** Words in a prayer body, ignoring the "R/" and "|" markers. */
export function wordCount(text: string): number {
  return text
    .replace(/R\//g, ' ')
    .replace(/\|/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/** Seconds to show one prayer at a given words-per-minute, never under MIN_SECONDS. */
export function secondsFor(text: string, wpm: number): number {
  return Math.max(MIN_SECONDS, (wordCount(text) / wpm) * 60);
}

/** Seconds to show a step: the sum over its prayers. */
export function stepSeconds(prayers: readonly Prayer[], wpm: number): number {
  return prayers.reduce((sum, prayer) => sum + secondsFor(prayer.body, wpm), 0);
}

export function clampWpm(wpm: number): number {
  if (!Number.isFinite(wpm)) return WPM_DEFAULT;
  return Math.min(WPM_MAX, Math.max(WPM_MIN, Math.round(wpm)));
}
