import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { readRosaryData } from '../data/repository';
import type { RosaryData } from '../data/types';

const root = resolve(__dirname, '../..');

/** A fresh in-memory database built from the real db/schema.sql and db/seed.sql. */
export async function buildSeedDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.exec(readFileSync(resolve(root, 'db/schema.sql'), 'utf8'));
  db.exec(readFileSync(resolve(root, 'db/seed.sql'), 'utf8'));
  return db;
}

export async function loadSeedData(): Promise<RosaryData> {
  const db = await buildSeedDb();
  try {
    return readRosaryData(db);
  } finally {
    db.close();
  }
}
