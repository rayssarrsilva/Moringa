import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '../db';

export type CheckState = 'ok' | 'off' | 'error';
export interface Check {
  id: 'database' | 'auth' | 'stripe' | 'webhook' | 'siteUrl';
  state: CheckState;
}

/**
 * What is configured, as yes/no only: no values, no secrets.
 * Lets whoever deploys check the setup without opening the Vercel dashboard.
 */
export async function systemStatus(): Promise<Check[]> {
  const env = process.env;
  let database: CheckState = 'off';
  if (env.DATABASE_URL) {
    try {
      await Promise.race([
        db().execute(sql`select 1`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
      ]);
      database = 'ok';
    } catch {
      database = 'error';
    }
  }
  const key = env.STRIPE_SECRET_KEY ?? '';
  return [
    { id: 'database', state: database },
    { id: 'auth', state: env.AUTH_SECRET || !env.VERCEL ? 'ok' : 'off' },
    {
      id: 'stripe',
      state: !key
        ? 'off'
        : key.startsWith('sk_test_') || key.startsWith('rk_test_')
          ? 'ok'
          : 'error',
    },
    {
      id: 'webhook',
      state: env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')
        ? 'ok'
        : env.STRIPE_WEBHOOK_SECRET
          ? 'error'
          : 'off',
    },
    {
      id: 'siteUrl',
      state: env.NEXT_PUBLIC_SITE_URL || env.VERCEL_PROJECT_PRODUCTION_URL ? 'ok' : 'off',
    },
  ];
}
