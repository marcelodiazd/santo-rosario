import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

/**
 * Browser loader: starts sql.js (SQLite compiled to WebAssembly), fetches
 * rosario.sqlite from next to the page, and opens it read-only in memory.
 */
export async function loadDb(fetchFn: typeof fetch = fetch): Promise<Database> {
  const [SQL, response] = await Promise.all([
    initSqlJs({ locateFile: () => wasmUrl }),
    fetchFn(import.meta.env.BASE_URL + 'rosario.sqlite'),
  ]);
  if (!response.ok) {
    throw new Error(`Could not load rosario.sqlite (HTTP ${response.status}).`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return new SQL.Database(bytes);
}
