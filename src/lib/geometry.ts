/**
 * Layout of the rosary drawing in a 300 x 520 viewBox.
 *
 * The loop is an ellipse; beads are placed by arc length (not by angle) so they
 * are evenly spaced all the way round. The pendant hangs straight down from the
 * medal on the line x = 150.
 */

export type NodeKind = 'small' | 'large' | 'chain' | 'medal' | 'cross';

export type PositionId = string;

export interface Node {
  id: PositionId;
  x: number;
  y: number;
  /** Visual radius: circle radius, diamond half-width, medal/crucifix half-height. */
  r: number;
  kind: NodeKind;
}

export const VIEWBOX = { width: 300, height: 520 } as const;

export const LOOP = { cx: 150, cy: 192, rx: 122, ry: 160 } as const;

export const RADIUS: Record<NodeKind, number> = {
  small: 6,
  large: 9.5,
  chain: 3.5,
  medal: 19,
  cross: 18,
};

/** Medal ellipse radii and crucifix size, used when drawing. */
export const MEDAL = { rx: 15, ry: 19 } as const;
export const CROSS = { width: 26, height: 36 } as const;

const PENDANT: ReadonlyArray<[PositionId, number, NodeKind]> = [
  ['medal', 352, 'medal'],
  ['pl2', 384, 'large'],
  ['pchain', 403, 'chain'],
  ['ps3', 418, 'small'],
  ['ps2', 435, 'small'],
  ['ps1', 452, 'small'],
  ['pl1', 474, 'large'],
  ['cross', 500, 'cross'],
];

/** Share of the loop each kind takes. The medal takes MEDAL_GAP at each end. */
const WEIGHT: Record<'small' | 'large' | 'chain', number> = { small: 1, large: 1.6, chain: 0.9 };
const MEDAL_GAP = 1.6;
const SAMPLES = 2000;

/** Loop items in order, walking counterclockwise on screen from the medal. */
export function loopOrder(): Array<{ id: PositionId; kind: 'small' | 'large' | 'chain' }> {
  const items: Array<{ id: PositionId; kind: 'small' | 'large' | 'chain' }> = [];
  for (let n = 1; n <= 5; n++) {
    for (let i = 1; i <= 10; i++) items.push({ id: `d${n}b${i}`, kind: 'small' });
    items.push({ id: `d${n}c`, kind: 'chain' });
    if (n < 5) items.push({ id: `L${n + 1}`, kind: 'large' });
  }
  return items;
}

/**
 * Point on the loop ellipse. t = 0 is the bottom (the medal); increasing t
 * moves right, then up: counterclockwise on screen, where y grows downward.
 */
function ellipsePoint(t: number): { x: number; y: number } {
  const theta = Math.PI / 2 - 2 * Math.PI * t;
  return { x: LOOP.cx + LOOP.rx * Math.cos(theta), y: LOOP.cy + LOOP.ry * Math.sin(theta) };
}

/** Returns a function mapping a fraction of the loop's length (0..1) to a point. */
function arcLengthLookup(): (fraction: number) => { x: number; y: number } {
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => ellipsePoint(i / SAMPLES));
  const cumulative = [0];
  for (let i = 1; i <= SAMPLES; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }
  const total = cumulative[SAMPLES];

  return (fraction) => {
    const target = fraction * total;
    let lo = 0;
    let hi = SAMPLES;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid;
      else hi = mid;
    }
    const span = cumulative[hi] - cumulative[lo];
    const k = span === 0 ? 0 : (target - cumulative[lo]) / span;
    return {
      x: points[lo].x + (points[hi].x - points[lo].x) * k,
      y: points[lo].y + (points[hi].y - points[lo].y) * k,
    };
  };
}

/** Computes x, y and radius for every bead, chain marker, the medal and the crucifix. */
export function layoutRosary(): Record<PositionId, Node> {
  const nodes: Record<PositionId, Node> = {};

  for (const [id, y, kind] of PENDANT) {
    nodes[id] = { id, x: LOOP.cx, y, r: RADIUS[kind], kind };
  }

  const items = loopOrder();
  const totalWeight = 2 * MEDAL_GAP + items.reduce((sum, item) => sum + WEIGHT[item.kind], 0);
  const at = arcLengthLookup();
  let offset = MEDAL_GAP;
  for (const item of items) {
    const centre = (offset + WEIGHT[item.kind] / 2) / totalWeight;
    const { x, y } = at(centre);
    nodes[item.id] = { id: item.id, x, y, r: RADIUS[item.kind], kind: item.kind };
    offset += WEIGHT[item.kind];
  }

  return nodes;
}

/** Computed once; the layout never changes. */
export const ROSARY_LAYOUT: Readonly<Record<PositionId, Node>> = layoutRosary();

/** Every position id, in drawing order: chain markers, beads, then medal and crucifix. */
export const POSITION_IDS: readonly PositionId[] = (() => {
  const order: NodeKind[] = ['chain', 'small', 'large', 'medal', 'cross'];
  return Object.values(ROSARY_LAYOUT)
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map((node) => node.id);
})();
