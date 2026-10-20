import 'server-only';
import { cache } from 'react';
import { dbRepository } from './db-repository';
import { sampleRepository } from './sample-repository';
import type { CatalogRepository } from './types';

/**
 * Neon when DATABASE_URL is set; the sample catalog otherwise, so the app,
 * the E2E tests in CI and a fresh clone all work without a database.
 */
export const catalog = cache((): CatalogRepository =>
  process.env.DATABASE_URL ? dbRepository : sampleRepository,
);

export * from './types';
