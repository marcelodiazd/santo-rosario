import type { Database, ParamsObject, SqlValue } from 'sql.js';
import type { MysterySet, Prayer, RosaryData, Step } from './types';

function queryRows(db: Database, sql: string, params?: SqlValue[]): ParamsObject[] {
  const stmt = db.prepare(sql);
  try {
    if (params) stmt.bind(params);
    const rows: ParamsObject[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

function text(value: SqlValue): string {
  return value == null ? '' : String(value);
}

function intOrNull(value: SqlValue): number | null {
  return value == null ? null : Number(value);
}

function splitList(value: SqlValue): string[] {
  return text(value)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Reads every table into a typed RosaryData object.
 * Throws if the data is inconsistent, so a bad seed fails loudly in tests and CI.
 */
export function readRosaryData(db: Database): RosaryData {
  const prayers: Record<string, Prayer> = {};
  for (const row of queryRows(db, 'SELECT id, title, body, response_line FROM prayers')) {
    const id = text(row.id);
    prayers[id] = { id, title: text(row.title), body: text(row.body), responseLine: intOrNull(row.response_line) };
  }

  const mysterySets: MysterySet[] = queryRows(
    db,
    'SELECT id, name, weekdays FROM mystery_sets ORDER BY sort_order',
  ).map((row) => {
    const id = text(row.id);
    const mysteries = queryRows(
      db,
      'SELECT number, title FROM mysteries WHERE set_id = ? ORDER BY number',
      [id],
    ).map((m) => text(m.title));
    if (mysteries.length !== 5) {
      throw new Error(`Mystery set "${id}" has ${mysteries.length} mysteries; expected 5.`);
    }
    return {
      id,
      name: text(row.name),
      weekdays: splitList(row.weekdays).map(Number),
      mysteries,
    };
  });

  const steps: Step[] = queryRows(db, 'SELECT * FROM steps ORDER BY seq').map((row) => ({
    seq: Number(row.seq),
    position: text(row.position),
    title: text(row.title),
    prayerIds: splitList(row.prayer_ids),
    decade: intOrNull(row.decade),
    aveNumber: intOrNull(row.ave_number),
    optional: Number(row.optional) === 1,
    note: row.note == null ? null : text(row.note),
  }));

  for (const step of steps) {
    for (const id of step.prayerIds) {
      if (!prayers[id]) {
        throw new Error(`Step ${step.seq} ("${step.title}") uses prayer "${id}", which does not exist.`);
      }
    }
  }

  return { prayers, mysterySets, steps };
}
