// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '@/db';
import { createTestDb } from '@/test/test-db';

let testDb: Database;
vi.mock('@/db', async (original) => ({
  ...(await original<typeof import('@/db')>()),
  db: () => testDb,
}));

const { dbStore, rateLimit } = await import('./rate-limit');

beforeAll(async () => {
  testDb = await createTestDb();
});

describe('rate limits on Postgres (shared by every server instance)', () => {
  it('counts hits in one row per action and client, and blocks the 11th lookup', async () => {
    const now = Date.UTC(2026, 9, 21, 12);
    const results = [];
    for (let i = 0; i < 11; i++)
      results.push(await rateLimit('lookup', 'pg-a', { store: dbStore, now }));
    expect(results.slice(0, 10).every((r) => r.ok)).toBe(true);
    expect(results[10]).toEqual({ ok: false, retryAfterSec: 600 });
  });

  it('starts a new window once the old one ends', async () => {
    const now = Date.UTC(2026, 9, 21, 13);
    for (let i = 0; i < 11; i++) await rateLimit('lookup', 'pg-b', { store: dbStore, now });
    expect((await rateLimit('lookup', 'pg-b', { store: dbStore, now: now + 600_000 })).ok).toBe(
      true,
    );
    expect(await dbStore.hit('lookup:pg-b', 600, now + 600_001)).toMatchObject({ count: 2 });
  });
});
