import { afterEach, describe, expect, it, vi } from 'vitest';
import { MONDAY, MemoryStorage, SUNDAY } from '../test/fixture';
import { STORAGE_KEY, browserStorage, defaultProgress, loadProgress, localDateKey, saveProgress } from './progress';

afterEach(() => vi.restoreAllMocks());

describe('progress', () => {
  it('formats the local date, not the UTC date', () => {
    expect(localDateKey(new Date(2026, 9, 11, 23, 30))).toBe('2026-10-11');
    expect(localDateKey(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05');
  });

  it('round-trips a save on the same day', () => {
    const storage = new MemoryStorage();
    const saved = { seq: 305, setId: 'dolorosos', traditional: true, wpm: 130, date: localDateKey(SUNDAY) };
    saveProgress(storage, saved);
    expect(loadProgress(storage, SUNDAY)).toEqual(saved);
  });

  it('resets the step and set on a new day but keeps the settings', () => {
    const storage = new MemoryStorage();
    saveProgress(storage, { seq: 305, setId: 'dolorosos', traditional: true, wpm: 130, date: localDateKey(SUNDAY) });
    expect(loadProgress(storage, MONDAY)).toEqual({
      seq: null,
      setId: null,
      traditional: true,
      wpm: 130,
      date: localDateKey(MONDAY),
    });
  });

  it('gives defaults when nothing is saved', () => {
    expect(loadProgress(new MemoryStorage(), SUNDAY)).toEqual(defaultProgress(SUNDAY));
    expect(loadProgress(null, SUNDAY)).toEqual(defaultProgress(SUNDAY));
  });

  it('falls back to defaults on corrupt JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadProgress(storage, SUNDAY)).toEqual(defaultProgress(SUNDAY));
    storage.setItem(STORAGE_KEY, '42');
    expect(loadProgress(storage, SUNDAY)).toEqual(defaultProgress(SUNDAY));
  });

  it('ignores fields of the wrong type and clamps the speed', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ seq: 'x', setId: 3, traditional: 'yes', wpm: 500, date: localDateKey(SUNDAY) }),
    );
    expect(loadProgress(storage, SUNDAY)).toEqual({ ...defaultProgress(SUNDAY), wpm: 160 });
  });

  it('does not crash when localStorage throws', () => {
    const throwing = new MemoryStorage();
    vi.spyOn(throwing, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(throwing, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(loadProgress(throwing, SUNDAY)).toEqual(defaultProgress(SUNDAY));
    expect(() => saveProgress(throwing, defaultProgress(SUNDAY))).not.toThrow();
    expect(() => saveProgress(null, defaultProgress(SUNDAY))).not.toThrow();
  });

  it('returns null when window.localStorage itself throws', () => {
    expect(browserStorage()).toBe(window.localStorage);
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(browserStorage()).toBeNull();
  });
});
