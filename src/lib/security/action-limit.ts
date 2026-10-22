import 'server-only';
import { headers } from 'next/headers';
import { type Bucket, clientId, rateLimit } from './rate-limit';

/** Rate limit for Server Actions (Next.js already checks their origin). */
export async function limitAction(bucket: Bucket) {
  return rateLimit(bucket, await clientId(await headers()));
}
