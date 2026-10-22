import { lt, sql } from 'drizzle-orm';
import { db, schema } from '../../db';

/**
 * Rate limits (OWASP ASVS 2.2.1 and 11.1.4): slow down guessing, scripted sign-ins, order
 * code enumeration and floods of writes. Fixed windows: simple to reason about and to test.
 */
export const rules = {
  /** One-click demo sign-in. */
  signIn: { limit: 10, windowSec: 60 },
  /** Auth.js credentials endpoint, reachable without the page. */
  authorize: { limit: 20, windowSec: 60 },
  /** Each attempt creates pending orders and a Stripe session. */
  checkout: { limit: 10, windowSec: 600 },
  /** Guest order tracking by code + email: the one place someone could try to guess. */
  lookup: { limit: 10, windowSec: 600 },
  /** Signed-in writes: reviews, delivery, shipping, pieces. Generous for people, not for scripts. */
  write: { limit: 60, windowSec: 60 },
} as const;

export type Bucket = keyof typeof rules;

export interface RateLimitStore {
  /** Counts one hit and returns the total in the current window. */
  hit(key: string, windowSec: number, now: number): Promise<{ count: number; resetAt: number }>;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/** Shared by every server instance, so the limit holds on serverless too. */
export const dbStore: RateLimitStore = {
  async hit(key, windowSec, now) {
    const { rateLimits } = schema;
    const nowTs = new Date(now);
    const resetTs = new Date(now + windowSec * 1000);
    const [row] = await db()
      .insert(rateLimits)
      .values({ key, count: 1, resetAt: resetTs })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} <= ${nowTs} then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} <= ${nowTs} then ${resetTs} else ${rateLimits.resetAt} end`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });
    // Now and then, drop windows that ended, so the table stays small.
    if (Math.random() < 0.01) {
      await db().delete(rateLimits).where(lt(rateLimits.resetAt, nowTs));
    }
    return { count: row!.count, resetAt: row!.resetAt.getTime() };
  },
};

const memory = ((
  globalThis as { __moringaRateLimits?: Map<string, { count: number; resetAt: number }> }
).__moringaRateLimits ??= new Map());

/** Without a database (local demo, CI): one process, so memory is enough. */
export const memoryStore: RateLimitStore = {
  async hit(key, windowSec, now) {
    const current = memory.get(key);
    const next =
      !current || current.resetAt <= now
        ? { count: 1, resetAt: now + windowSec * 1000 }
        : { count: current.count + 1, resetAt: current.resetAt };
    memory.set(key, next);
    return next;
  },
};

const defaultStore = () => (process.env.DATABASE_URL ? dbStore : memoryStore);

/**
 * The browser tests sign in dozens of times from one address, so they raise the limits with
 * RATE_LIMIT_SCALE. Production ignores it. The limits themselves are tested in rate-limit.test.ts.
 */
function scale() {
  if (process.env.VERCEL_ENV === 'production') return 1;
  const value = Number(process.env.RATE_LIMIT_SCALE);
  return Number.isFinite(value) && value >= 1 ? value : 1;
}

/**
 * Counts this attempt and says whether it may go on.
 * If the store fails, the request goes through: a database hiccup must not lock everyone out.
 */
export async function rateLimit(
  bucket: Bucket,
  client: string,
  { store = defaultStore(), now = Date.now() }: { store?: RateLimitStore; now?: number } = {},
): Promise<RateLimitResult> {
  const rule = rules[bucket];
  try {
    const { count, resetAt } = await store.hit(`${bucket}:${client}`, rule.windowSec, now);
    if (count <= rule.limit * scale()) return { ok: true };
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
  } catch (error) {
    console.error('rate limit store failed', error instanceof Error ? error.message : error);
    return { ok: true };
  }
}

/**
 * Who is asking, without storing who they are: a salted SHA-256 of the IP (LGPD, data minimisation).
 * On Vercel, x-real-ip and x-forwarded-for are set by the platform and cannot be spoofed.
 */
export async function clientId(headers: Headers): Promise<string> {
  const ip =
    headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const salt = process.env.AUTH_SECRET ?? 'moringa-local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return Buffer.from(digest).toString('base64url').slice(0, 22);
}

/** The standard answer for route handlers: 429 with Retry-After (RFC 6585). */
export function tooManyRequests(retryAfterSec: number) {
  return Response.json(
    { error: 'rate_limited' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec), 'Cache-Control': 'no-store' },
    },
  );
}
