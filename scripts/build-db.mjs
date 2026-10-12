// Builds public/rosario.sqlite from db/schema.sql and db/seed.sql.
// Runs before every dev server start, test run and production build.
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SQL = await initSqlJs();
const db = new SQL.Database();
db.exec(readFileSync('db/schema.sql', 'utf8'));
db.exec(readFileSync('db/seed.sql', 'utf8'));
mkdirSync('public', { recursive: true });
writeFileSync('public/rosario.sqlite', Buffer.from(db.export()));
db.close();
console.log('public/rosario.sqlite written');
