import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

let instance: Database | undefined;

function createDb(url: string) {
  return drizzle(neon(url), { schema, casing: 'snake_case' });
}

/** Lazily connects so builds and tests that never touch the database don't need DATABASE_URL. */
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local.');
  instance ??= createDb(url);
  return instance;
}

export { schema };
