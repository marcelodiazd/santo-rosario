import { describe, expect, it } from 'vitest';
import { makeFixture } from '../test/fixture';
import { buildSequence, indexForPosition, positionStatus, resolveIndex } from './sequence';

const { steps } = makeFixture();
const plain = buildSequence(steps, false);
const traditional = buildSequence(steps, true);
const indexOfSeq = (sequence: typeof steps, seq: number) => sequence.findIndex((s) => s.seq === seq);

describe('buildSequence', () => {
  it('gives 69 steps with the opening off and 75 with it on', () => {
    expect(plain).toHaveLength(69);
    expect(traditional).toHaveLength(75);
    expect(plain.some((s) => s.optional)).toBe(false);
  });
});

describe('resolveIndex', () => {
  it('starts at the first step when nothing is saved', () => {
    expect(resolveIndex(plain, null)).toBe(0);
    expect(resolveIndex(plain, undefined)).toBe(0);
    expect(resolveIndex([], 100)).toBe(0);
  });

  it('finds the exact step when it exists', () => {
    expect(plain[resolveIndex(plain, 305)].seq).toBe(305);
  });

  it('moves forward to the next valid step after the opening is turned off', () => {
    expect(plain[resolveIndex(plain, 42)].seq).toBe(100);
  });

  it('stays on the same step when the opening is turned on', () => {
    expect(traditional[resolveIndex(traditional, 30)].seq).toBe(30);
  });

  it('clamps to the last step', () => {
    expect(resolveIndex(plain, 9999)).toBe(plain.length - 1);
  });
});

describe('indexForPosition', () => {
  it('goes to the first step on a tapped bead', () => {
    expect(plain[indexForPosition(plain, 0, 'd2b3')].seq).toBe(203);
    expect(plain[indexForPosition(plain, 0, 'L4')].seq).toBe(400);
  });

  it('walks through the closing prayers when the medal is tapped again', () => {
    let index = indexForPosition(plain, 0, 'medal');
    const visited = [plain[index].seq];
    for (let i = 0; i < 6; i++) {
      index = indexForPosition(plain, index, 'medal');
      visited.push(plain[index].seq);
    }
    expect(visited).toEqual([600, 610, 620, 630, 640, 650, 600]);
  });

  it('walks through the crucifix steps', () => {
    expect(plain[indexForPosition(plain, 0, 'cross')].seq).toBe(20);
    expect(plain[indexForPosition(plain, 2, 'cross')].seq).toBe(10);
  });

  it('keeps the current step when an unused bead is tapped', () => {
    expect(indexForPosition(plain, 5, 'pl1')).toBe(5);
  });
});

describe('positionStatus', () => {
  it('marks the start correctly', () => {
    const status = positionStatus(plain, 0);
    expect(status.cross).toBe('current');
    expect(status.pl2).toBe('upcoming');
    expect(status.d1b1).toBe('upcoming');
    expect(status.medal).toBe('upcoming');
    for (const id of ['pl1', 'ps1', 'ps2', 'ps3', 'pchain']) expect(status[id]).toBe('unused');
  });

  it('uses the pendant beads when the opening is on', () => {
    const status = positionStatus(traditional, indexOfSeq(traditional, 43));
    expect(status.ps2).toBe('current');
    expect(status.ps1).toBe('done');
    expect(status.pl1).toBe('done');
    expect(status.ps3).toBe('upcoming');
    expect(status.cross).toBe('done');
  });

  it('marks the middle of a decade correctly', () => {
    const status = positionStatus(plain, indexOfSeq(plain, 305));
    expect(status.d3b5).toBe('current');
    expect(status.d3b4).toBe('done');
    expect(status.L3).toBe('done');
    expect(status.d2c).toBe('done');
    expect(status.pl2).toBe('done');
    expect(status.d3b6).toBe('upcoming');
    expect(status.d3c).toBe('upcoming');
    expect(status.L4).toBe('upcoming');
  });

  it('keeps a multi-step bead current while any of its steps is current', () => {
    expect(positionStatus(plain, 1).cross).toBe('current');
    expect(positionStatus(plain, indexOfSeq(plain, 620)).medal).toBe('current');
  });

  it('marks everything done at the last step', () => {
    const status = positionStatus(plain, plain.length - 1);
    expect(status.medal).toBe('current');
    for (const [id, value] of Object.entries(status)) {
      if (id === 'medal') continue;
      expect(value, id).toBe(['pl1', 'ps1', 'ps2', 'ps3', 'pchain'].includes(id) ? 'unused' : 'done');
    }
  });
});
