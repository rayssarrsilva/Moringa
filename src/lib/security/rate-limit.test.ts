// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientId, rateLimit, type RateLimitStore, rules } from './rate-limit';

vi.mock('../../db', () => ({ db: () => ({}), schema: {} }));

/** A fresh in-memory store per test. */
function store(): RateLimitStore {
  const rows = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, windowSec, now) {
      const row = rows.get(key);
      const next =
        !row || row.resetAt <= now
          ? { count: 1, resetAt: now + windowSec * 1000 }
          : { count: row.count + 1, resetAt: row.resetAt };
      rows.set(key, next);
      return next;
    },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('rateLimit', () => {
  it('lets the first attempts through and blocks the one over the limit', async () => {
    const s = store();
    const now = 1_000_000;
    for (let i = 0; i < rules.lookup.limit; i++) {
      expect(await rateLimit('lookup', 'a', { store: s, now })).toEqual({ ok: true });
    }
    expect(await rateLimit('lookup', 'a', { store: s, now })).toEqual({
      ok: false,
      retryAfterSec: rules.lookup.windowSec,
    });
  });

  it('counts each client and each action apart', async () => {
    const s = store();
    for (let i = 0; i <= rules.lookup.limit; i++) await rateLimit('lookup', 'a', { store: s });
    expect((await rateLimit('lookup', 'b', { store: s })).ok).toBe(true);
    expect((await rateLimit('checkout', 'a', { store: s })).ok).toBe(true);
  });

  it('opens again when the window ends, and says how long to wait before that', async () => {
    const s = store();
    const start = 5_000_000;
    for (let i = 0; i <= rules.signIn.limit; i++)
      await rateLimit('signIn', 'a', { store: s, now: start });
    expect(await rateLimit('signIn', 'a', { store: s, now: start + 45_000 })).toEqual({
      ok: false,
      retryAfterSec: 15,
    });
    expect((await rateLimit('signIn', 'a', { store: s, now: start + 60_000 })).ok).toBe(true);
  });

  it('lets the request through if the store fails, instead of locking everyone out', async () => {
    const broken: RateLimitStore = { hit: () => Promise.reject(new Error('db down')) };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await rateLimit('checkout', 'a', { store: broken })).toEqual({ ok: true });
  });

  it('ignores the test multiplier in production', async () => {
    vi.stubEnv('RATE_LIMIT_SCALE', '1000');
    vi.stubEnv('VERCEL_ENV', 'production');
    const s = store();
    for (let i = 0; i < rules.lookup.limit; i++) await rateLimit('lookup', 'a', { store: s });
    expect((await rateLimit('lookup', 'a', { store: s })).ok).toBe(false);
  });
});

describe('clientId', () => {
  it('never contains the IP, and is stable for the same address', async () => {
    const a = await clientId(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }));
    const b = await clientId(new Headers({ 'x-real-ip': '203.0.113.7' }));
    const c = await clientId(new Headers({ 'x-real-ip': '203.0.113.8' }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain('203');
    expect(a).toMatch(/^[\w-]{22}$/);
  });
});
