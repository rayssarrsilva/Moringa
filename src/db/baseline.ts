import { readMigrationFiles } from 'drizzle-orm/migrator';

export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

/**
 * The first databases were created with `drizzle-kit push`, before migrations existed.
 * If the tables are there but Drizzle has no migration history, record the baseline
 * migration as already applied, so `migrate` only runs what came after it.
 * Returns true when it recorded the baseline.
 */
export async function ensureBaseline(query: Query, migrationsFolder = './drizzle') {
  const [state] = await query(
    `select to_regclass('public.shops') is not null as has_tables,
            to_regclass('drizzle.__drizzle_migrations') is not null as has_history`,
  );
  if (!state?.has_tables || state.has_history) return false;

  const [baseline] = readMigrationFiles({ migrationsFolder });
  if (!baseline) return false;
  await query('create schema if not exists drizzle');
  await query(
    'create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)',
  );
  await query('insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)', [
    baseline.hash,
    baseline.folderMillis,
  ]);
  return true;
}
