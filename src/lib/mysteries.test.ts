import { describe, expect, it } from 'vitest';
import { makeFixture } from '../test/fixture';
import { decadeOrdinal, mysteryAdjective, mysteryLine, setForWeekday } from './mysteries';

const { mysterySets, steps } = makeFixture();
const setOn = (day: number) => setForWeekday(mysterySets, day).id;

describe('setForWeekday', () => {
  it('gives gloriosos on Sunday and Wednesday', () => {
    expect(setOn(0)).toBe('gloriosos');
    expect(setOn(3)).toBe('gloriosos');
  });

  it('gives gozosos on Monday and Saturday', () => {
    expect(setOn(1)).toBe('gozosos');
    expect(setOn(6)).toBe('gozosos');
  });

  it('gives dolorosos on Tuesday and Friday', () => {
    expect(setOn(2)).toBe('dolorosos');
    expect(setOn(5)).toBe('dolorosos');
  });

  it('gives luminosos on Thursday', () => {
    expect(setOn(4)).toBe('luminosos');
  });

  it('throws when no set covers the day', () => {
    expect(() => setForWeekday([], 1)).toThrow(/weekday 1/);
  });
});

describe('mystery line', () => {
  const gloriosos = mysterySets.find((s) => s.id === 'gloriosos')!;

  it('builds the line for a decade step', () => {
    const step = steps.find((s) => s.seq === 305)!;
    expect(mysteryLine(step, gloriosos)).toBe('Tercer misterio glorioso: Misterio glorioso número 3');
  });

  it('is empty outside the decades', () => {
    expect(mysteryLine(steps[0], gloriosos)).toBeNull();
  });

  it('derives ordinals and adjectives', () => {
    expect([1, 2, 3, 4, 5].map(decadeOrdinal)).toEqual(['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto']);
    expect(decadeOrdinal(6)).toBe('6.º');
    expect(mysterySets.map(mysteryAdjective)).toEqual(['gozoso', 'doloroso', 'glorioso', 'luminoso']);
  });
});
