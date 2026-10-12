import { describe, expect, it } from 'vitest';
import { MIN_SECONDS, WPM_DEFAULT, WPM_MAX, WPM_MIN, clampWpm, secondsFor, stepSeconds, wordCount } from './pacing';

const sixty = Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(' ');

describe('pacing', () => {
  it('ignores R/ and | markers when counting words', () => {
    expect(wordCount('Ave María Purísima.\nR/ Sin pecado concebida.')).toBe(6);
    expect(wordCount('Santa María, | ruega por nosotros.')).toBe(5);
    expect(wordCount('   ')).toBe(0);
  });

  it('applies the 4-second floor to short prayers', () => {
    expect(secondsFor('Amén.', WPM_DEFAULT)).toBe(MIN_SECONDS);
  });

  it('gives a shorter time at a faster speed', () => {
    expect(secondsFor(sixty, 120)).toBeCloseTo(30);
    expect(secondsFor(sixty, 80)).toBeCloseTo(45);
  });

  it('sums the prayers in a step', () => {
    const prayers = [
      { id: 'a', title: 'A', body: sixty, responseLine: null },
      { id: 'b', title: 'B', body: 'Amén.', responseLine: null },
    ];
    expect(stepSeconds(prayers, 120)).toBeCloseTo(34);
  });

  it('clamps speed to the slider range', () => {
    expect(clampWpm(10)).toBe(WPM_MIN);
    expect(clampWpm(999)).toBe(WPM_MAX);
    expect(clampWpm(112.4)).toBe(112);
    expect(clampWpm(Number.NaN)).toBe(WPM_DEFAULT);
  });
});
