import type { Step } from '../data/types';
import { POSITION_IDS, type PositionId } from './geometry';

export type PositionStatus = 'current' | 'done' | 'upcoming' | 'unused';

/** The steps to pray, in order. Optional (traditional opening) steps are dropped unless turned on. */
export function buildSequence(steps: readonly Step[], traditional: boolean): Step[] {
  return steps.filter((step) => traditional || !step.optional);
}

/**
 * Index of the first step whose seq is at or after the saved seq.
 * Keeps the position sensible when the traditional opening is toggled.
 */
export function resolveIndex(sequence: readonly Step[], seq: number | null | undefined): number {
  if (seq == null || sequence.length === 0) return 0;
  const index = sequence.findIndex((step) => step.seq >= seq);
  return index === -1 ? sequence.length - 1 : index;
}

/**
 * Where to go when a bead is tapped. If you are already on that bead and it has
 * a later step, go there; otherwise go to the bead's first step. Tapping a bead
 * no step uses keeps the current step.
 */
export function indexForPosition(
  sequence: readonly Step[],
  currentIndex: number,
  position: PositionId,
): number {
  const indexes: number[] = [];
  sequence.forEach((step, i) => {
    if (step.position === position) indexes.push(i);
  });
  if (indexes.length === 0) return currentIndex;
  if (sequence[currentIndex]?.position === position) {
    const later = indexes.find((i) => i > currentIndex);
    if (later !== undefined) return later;
  }
  return indexes[0];
}

/** Status of every position id in the drawing, for the step at `index`. */
export function positionStatus(
  sequence: readonly Step[],
  index: number,
): Record<PositionId, PositionStatus> {
  const lastIndexOf = new Map<PositionId, number>();
  sequence.forEach((step, i) => lastIndexOf.set(step.position, i));
  const current = sequence[index]?.position;

  const status: Record<PositionId, PositionStatus> = {};
  for (const id of POSITION_IDS) {
    const last = lastIndexOf.get(id);
    if (last === undefined) status[id] = 'unused';
    else if (id === current) status[id] = 'current';
    else if (last < index) status[id] = 'done';
    else status[id] = 'upcoming';
  }
  return status;
}
