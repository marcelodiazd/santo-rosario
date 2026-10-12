import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('sql.js', () => ({
  default: vi.fn(async () => ({
    Database: class {
      constructor(public bytes: Uint8Array) {}
    },
  })),
}));

import initSqlJs from 'sql.js';
import { loadDb } from './loadDb';

afterEach(() => vi.clearAllMocks());

describe('loadDb', () => {
  it('fetches rosario.sqlite relative to the base URL and opens it', async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    const db = (await loadDb(fetchFn as unknown as typeof fetch)) as unknown as { bytes: Uint8Array };

    expect(fetchFn).toHaveBeenCalledWith(import.meta.env.BASE_URL + 'rosario.sqlite');
    expect(Array.from(db.bytes)).toEqual([1, 2, 3]);

    const config = vi.mocked(initSqlJs).mock.calls[0][0]!;
    expect(config.locateFile!('sql-wasm.wasm', '')).toMatch(/sql-wasm\.wasm/);
  });

  it('throws when the database file cannot be fetched', async () => {
    const fetchFn = vi.fn(async () => new Response('missing', { status: 404 }));
    await expect(loadDb(fetchFn as unknown as typeof fetch)).rejects.toThrow(/HTTP 404/);
  });
});
