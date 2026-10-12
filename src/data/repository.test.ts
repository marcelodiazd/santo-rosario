// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildSeedDb, loadSeedData } from '../test/seedDb';
import { readRosaryData } from './repository';

describe('readRosaryData with the real seed', () => {
  it('loads 14 prayers', async () => {
    const data = await loadSeedData();
    expect(Object.keys(data.prayers)).toHaveLength(14);
    expect(data.prayers.avemaria.title).toBe('Avemaría');
  });

  it('marks where the people\'s half starts in prayers said in two halves', async () => {
    const data = await loadSeedData();
    for (const id of ['padrenuestro', 'avemaria', 'gloria']) {
      expect(data.prayers[id].responseLine, id).toBe(2);
      expect(data.prayers[id].body.split('\n'), id).toHaveLength(2);
    }
    expect(data.prayers.senal.responseLine).toBeNull();
  });

  it('loads 4 mystery sets with 5 mysteries each, in sort order', async () => {
    const data = await loadSeedData();
    expect(data.mysterySets.map((s) => s.id)).toEqual(['gozosos', 'dolorosos', 'gloriosos', 'luminosos']);
    for (const set of data.mysterySets) expect(set.mysteries).toHaveLength(5);
    expect(data.mysterySets[2].mysteries[2]).toBe('La Venida del Espíritu Santo sobre los Apóstoles');
  });

  it('loads 75 steps, 69 of them not optional', async () => {
    const data = await loadSeedData();
    expect(data.steps).toHaveLength(75);
    expect(data.steps.filter((s) => !s.optional)).toHaveLength(69);
  });

  it('maps step columns to typed fields', async () => {
    const data = await loadSeedData();
    const glory = data.steps.find((s) => s.seq === 311)!;
    expect(glory).toMatchObject({
      position: 'd3c',
      prayerIds: ['gloria', 'maria_madre', 'oh_jesus'],
      decade: 3,
      aveNumber: null,
      optional: false,
      note: null,
    });
    expect(data.steps.find((s) => s.seq === 305)).toMatchObject({ position: 'd3b5', aveNumber: 5 });
    expect(data.steps.find((s) => s.seq === 42)).toMatchObject({ optional: true, note: 'Por la virtud de la fe' });
  });

  it('has a prayer for every prayer id used by a step', async () => {
    const data = await loadSeedData();
    for (const step of data.steps) {
      for (const id of step.prayerIds) expect(data.prayers[id], `${step.seq} uses ${id}`).toBeDefined();
    }
  });

  it('has unique, ascending seq values', async () => {
    const seqs = (await loadSeedData()).steps.map((s) => s.seq);
    expect(new Set(seqs).size).toBe(seqs.length);
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs);
  });

  it('maps every weekday 0-6 to exactly one set', async () => {
    const data = await loadSeedData();
    for (let day = 0; day <= 6; day++) {
      expect(data.mysterySets.filter((s) => s.weekdays.includes(day)), `weekday ${day}`).toHaveLength(1);
    }
  });
});

describe('readRosaryData with bad data', () => {
  it('throws a clear error when a step uses a missing prayer', async () => {
    const db = await buildSeedDb();
    db.run("UPDATE steps SET prayer_ids = 'senal,no_existe' WHERE seq = 10");
    expect(() => readRosaryData(db)).toThrow(/Step 10 .*"no_existe"/);
    db.close();
  });

  it('throws when a mystery set does not have 5 mysteries', async () => {
    const db = await buildSeedDb();
    db.run("DELETE FROM mysteries WHERE set_id = 'luminosos' AND number = 5");
    expect(() => readRosaryData(db)).toThrow(/luminosos.*4 mysteries/);
    db.close();
  });
});
