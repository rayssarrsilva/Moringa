import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { execFileSync } from 'node:child_process';
import type { Database } from '@/db';
import * as schema from '@/db/schema';

let ddl: string | undefined;

/**
 * A real Postgres (PGlite, in memory) with the schema generated from src/db/schema.ts.
 * The app talks to Neon over HTTP; here the same Drizzle queries run against this database.
 * Neon's `batch` runs in one transaction; in tests the statements run in order.
 */
export async function createTestDb(): Promise<Database> {
  ddl ??= execFileSync(
    'npx',
    ['drizzle-kit', 'export', '--dialect', 'postgresql', '--schema', 'src/db/schema.ts'],
    { encoding: 'utf8' },
  );
  const client = new PGlite();
  await client.exec(ddl);
  const database = drizzle(client, { schema, casing: 'snake_case' });
  Object.assign(database, {
    batch: async (queries: PromiseLike<unknown>[]) => {
      const results = [];
      for (const q of queries) results.push(await q);
      return results;
    },
  });
  return database as unknown as Database;
}
