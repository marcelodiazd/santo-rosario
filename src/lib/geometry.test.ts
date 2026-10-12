// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { loadSeedData } from '../test/seedDb';
import { POSITION_IDS, ROSARY_LAYOUT, VIEWBOX, layoutRosary, loopOrder } from './geometry';

const nodes = Object.values(ROSARY_LAYOUT);
const count = (kind: string) => nodes.filter((n) => n.kind === kind).length;

describe('layoutRosary', () => {
  it('has 59 beads, 6 chain markers, 1 medal and 1 crucifix', () => {
    expect(count('small') + count('large')).toBe(59);
    expect(count('small')).toBe(53);
    expect(count('large')).toBe(6);
    expect(count('chain')).toBe(6);
    expect(count('medal')).toBe(1);
    expect(count('cross')).toBe(1);
    expect(POSITION_IDS).toHaveLength(nodes.length);
  });

  it('has a node for every step position in the seed', async () => {
    const data = await loadSeedData();
    for (const step of data.steps) expect(ROSARY_LAYOUT[step.position], step.position).toBeDefined();
  });

  it('does not overlap any two loop items or the medal', () => {
    const loop = [...loopOrder().map((item) => ROSARY_LAYOUT[item.id]), ROSARY_LAYOUT.medal];
    for (let a = 0; a < loop.length; a++) {
      for (let b = a + 1; b < loop.length; b++) {
        const distance = Math.hypot(loop[a].x - loop[b].x, loop[a].y - loop[b].y);
        expect(distance, `${loop[a].id} / ${loop[b].id}`).toBeGreaterThanOrEqual(loop[a].r + loop[b].r);
      }
    }
  });

  it('keeps every node inside the 300 x 520 viewBox', () => {
    for (const n of nodes) {
      expect(n.x - n.r, n.id).toBeGreaterThanOrEqual(0);
      expect(n.x + n.r, n.id).toBeLessThanOrEqual(VIEWBOX.width);
      expect(n.y - n.r, n.id).toBeGreaterThanOrEqual(0);
      expect(n.y + n.r, n.id).toBeLessThanOrEqual(VIEWBOX.height);
    }
  });

  it('puts the medal at (150, 352) and the pendant on x = 150', () => {
    expect(ROSARY_LAYOUT.medal).toMatchObject({ x: 150, y: 352 });
    for (const id of ['pl2', 'pchain', 'ps3', 'ps2', 'ps1', 'pl1', 'cross']) expect(ROSARY_LAYOUT[id].x).toBe(150);
  });

  it('walks right from the medal, then up', () => {
    const first = ROSARY_LAYOUT.d1b1;
    const last = ROSARY_LAYOUT.d5c;
    expect(first.x).toBeGreaterThan(150);
    expect(first.y).toBeLessThan(352);
    expect(last.x).toBeLessThan(150);
    expect(ROSARY_LAYOUT.d3b5.y).toBeLessThan(100); // the middle of the loop is near the top
  });

  it('spaces neighbouring small beads evenly by arc length', () => {
    const gaps = [];
    for (let n = 1; n <= 5; n++) {
      for (let i = 1; i < 10; i++) {
        const a = ROSARY_LAYOUT[`d${n}b${i}`];
        const b = ROSARY_LAYOUT[`d${n}b${i + 1}`];
        gaps.push(Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.2);
  });

  it('is a pure function', () => {
    expect(layoutRosary()).toEqual(ROSARY_LAYOUT);
  });
});
