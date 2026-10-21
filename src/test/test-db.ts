import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { Database } from '@/db';
import * as schema from '@/db/schema';

/**
 * A real Postgres (PGlite, in memory), built by running the same migrations the deploy runs.
 * So every integration test also checks that the migrations create a working database.
 * Neon's `batch` runs in one transaction; in tests the statements run in order.
 */
export async function createTestDb(): Promise<Database> {
  const client = new PGlite();
  const database = drizzle(client, { schema, casing: 'snake_case' });
  await migrate(database, { migrationsFolder: 'drizzle' });
  Object.assign(database, {
    $client: client,
    batch: async (queries: PromiseLike<unknown>[]) => {
      const results = [];
      for (const q of queries) results.push(await q);
      return results;
    },
  });
  return database as unknown as Database;
}
