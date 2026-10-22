import { type Bucket, clientId, rateLimit, tooManyRequests } from './rate-limit';

/**
 * CSRF defence in depth for cookie-authenticated route handlers (OWASP CSRF Cheat Sheet,
 * "verifying origin with standard headers"). The session cookie is already SameSite=Lax;
 * this also refuses a write a browser sends from another site. Server Actions get the same
 * check from Next.js itself. Requests with neither header come from outside a browser, so
 * they cannot carry a visitor's cookies.
 */
export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin';
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Runs first in every POST route handler: same origin first, then the rate limit.
 * Returns the error response to send, or null to go on.
 */
export async function guardPost(request: Request, bucket: Bucket = 'write') {
  if (!isSameOrigin(request)) {
    return Response.json(
      { error: 'forbidden' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const limit = await rateLimit(bucket, await clientId(request.headers));
  return limit.ok ? null : tooManyRequests(limit.retryAfterSec);
}
