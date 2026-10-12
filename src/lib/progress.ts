import { WPM_DEFAULT, clampWpm } from './pacing';

export const STORAGE_KEY = 'santo-rosario:v1';

export interface Progress {
  /** seq of the current step; null = start at the first step. */
  seq: number | null;
  /** Chosen mystery set; null = use today's set. */
  setId: string | null;
  traditional: boolean;
  wpm: number;
  /** Read the prayers aloud. */
  voice: boolean;
  /** Chosen voice; null = pick the best Spanish voice automatically. */
  voiceURI: string | null;
  /** Local calendar date (YYYY-MM-DD) this progress belongs to. */
  date: string;
}

/**
 * Local calendar date as YYYY-MM-DD. Uses the device's time zone on purpose:
 * toISOString() is UTC and would roll the day over in the evening in the Americas.
 */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function defaultProgress(today: Date): Progress {
  return {
    seq: null,
    setId: null,
    traditional: false,
    wpm: WPM_DEFAULT,
    voice: false,
    voiceURI: null,
    date: localDateKey(today),
  };
}

/** window.localStorage, or null where reading it throws (private mode, blocked storage). */
export function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Loads saved progress. A save from an earlier day keeps the settings
 * (traditional, wpm, voice) but restarts at the first step with today's set.
 * Missing, corrupt or unreadable storage gives the defaults.
 */
export function loadProgress(storage: Storage | null, today: Date): Progress {
  const fallback = defaultProgress(today);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null) return fallback;
    const s = saved as Partial<Record<keyof Progress, unknown>>;

    const traditional = typeof s.traditional === 'boolean' ? s.traditional : fallback.traditional;
    const wpm = typeof s.wpm === 'number' ? clampWpm(s.wpm) : fallback.wpm;
    const voice = typeof s.voice === 'boolean' ? s.voice : fallback.voice;
    const voiceURI = typeof s.voiceURI === 'string' ? s.voiceURI : fallback.voiceURI;
    const settings = { traditional, wpm, voice, voiceURI };
    if (s.date !== fallback.date) return { ...fallback, ...settings };

    return {
      seq: typeof s.seq === 'number' ? s.seq : null,
      setId: typeof s.setId === 'string' ? s.setId : null,
      ...settings,
      date: fallback.date,
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(storage: Storage | null, progress: Progress): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: progress is a convenience, so carry on without it.
  }
}
