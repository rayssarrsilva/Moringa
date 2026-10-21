// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ensureBaseline, type Query } from './baseline';

const queryOf =
  (client: PGlite): Query =>
  (text, params) =>
    client.query<Record<string, unknown>>(text, params).then((r) => r.rows);

describe('migrations on a database created with "push"', () => {
  it('records the baseline once, then migrate leaves the existing tables alone', async () => {
    const client = new PGlite();
    // A database made by `drizzle-kit push`: tables exist, no migration history.
    for (const statement of readFileSync('drizzle/0000_baseline.sql', 'utf8').split(
      '--> statement-breakpoint',
    )) {
      await client.exec(statement);
    }
    await client.exec(`insert into users (name, email) values ('Marina', 'marina@example.com')`);

    expect(await ensureBaseline(queryOf(client))).toBe(true);
    expect(await ensureBaseline(queryOf(client))).toBe(false);
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });

    const users = await client.query<{ count: number }>('select count(*)::int as count from users');
    expect(users.rows[0]!.count).toBe(1);
  });

  it('does nothing on an empty database, where migrate creates everything', async () => {
    const client = new PGlite();
    expect(await ensureBaseline(queryOf(client))).toBe(false);
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
    const tables = await client.query<{ name: string }>(
      `select tablename as name from pg_tables where schemaname = 'public' order by 1`,
    );
    expect(tables.rows.map((r) => r.name)).toContain('orders');
  });
});
