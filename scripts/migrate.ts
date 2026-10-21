/**
 * Brings the database up to date with the migrations in ./drizzle.
 * Runs before every Vercel build (`vercel-build`), so the schema always matches the code.
 * Migrations are additive only (expand first, remove later), so the live site keeps working
 * while a deploy is in progress.
 */
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

const { neon } = await import('@neondatabase/serverless');
const { drizzle } = await import('drizzle-orm/neon-http');
const { migrate } = await import('drizzle-orm/neon-http/migrator');
const { ensureBaseline } = await import('../src/db/baseline');

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('No DATABASE_URL: skipping migrations (the app runs on the sample catalog).');
  process.exit(0);
}

const sql = neon(url);
if (
  await ensureBaseline(
    (text, params) => sql.query(text, params) as Promise<Record<string, unknown>[]>,
  )
) {
  console.log('Existing database recorded at the baseline migration.');
}
await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
console.log('Database migrations are up to date.');
