// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '@/db';
import { createTestDb } from '@/test/test-db';

let testDb: Database;
vi.mock('server-only', () => ({}));
vi.mock('@/db', async (original) => ({
  ...(await original<typeof import('@/db')>()),
  db: () => testDb,
}));

const { seedDemoData } = await import('@/db/demo-data');
const { dbRepository: catalog } = await import('@/lib/catalog/db-repository');
const { dbSellerRepository: sellers } = await import('./db-repository');

const rosa = { email: 'rosa@example.com', name: 'Rosa', sid: 'browser-rosa' };
const lucia = {
  email: 'ceramica-da-lucia@demo.moringa.dev',
  name: 'Dona Lúcia',
  sid: 'browser-lucia',
};
const piece = {
  name: 'Renda de bilro',
  material: 'lace' as const,
  description: 'Toalhinha de renda de bilro feita em três semanas.',
  priceCents: 18000,
  shippingCents: 1500,
  stock: 1,
};

beforeAll(async () => {
  testDb = await createTestDb();
  await seedDemoData(testDb);
  await sellers.createShop(rosa, {
    name: 'Rendas da Rosa',
    craft: 'Rendeira',
    city: 'Aquiraz',
    state: 'CE',
    story: 'Aprendi renda de bilro com as rendeiras da praia, sentada na almofada da minha tia.',
    quote: undefined,
    craftEn: undefined,
    storyEn: undefined,
  });
  await sellers.createPiece(rosa, piece);
}, 60_000);

describe('manage pieces (US-15) as a real maker', () => {
  it('publishes to the catalog right away', async () => {
    expect((await catalog.getPiece('renda-de-bilro'))?.priceCents).toBe(18000);
  });

  it('takes a paused piece out of the catalog and the favorites check, and brings it back', async () => {
    const paused = await sellers.setPieceStatus(rosa, 'renda-de-bilro', 'paused');
    expect(paused.ok && paused.piece.status).toBe('paused');
    expect(await catalog.getPiece('renda-de-bilro')).toBeNull();
    expect(await catalog.getPiecesBySlugs(['renda-de-bilro'])).toEqual([]);

    await sellers.setPieceStatus(rosa, 'renda-de-bilro', 'published');
    expect(await catalog.getPiece('renda-de-bilro')).not.toBeNull();
  });

  it('changes price and restocks', async () => {
    const result = await sellers.updatePiece(rosa, 'renda-de-bilro', {
      ...piece,
      priceCents: 21000,
      stock: 4,
    });
    expect(result.ok && result.piece).toMatchObject({ priceCents: 21000, stock: 4 });
    expect((await catalog.getPiece('renda-de-bilro'))?.priceCents).toBe(21000);
  });
});

describe('the demo maker', () => {
  it('cannot pause or edit the public example pieces', async () => {
    expect(await sellers.setPieceStatus(lucia, 'moringa-de-barro-com-tampa', 'paused')).toEqual({
      ok: false,
      reason: 'read_only',
    });
    expect(
      await sellers.updatePiece(lucia, 'tigela-de-ceramica', { ...piece, priceCents: 1 }),
    ).toEqual({
      ok: false,
      reason: 'read_only',
    });
    expect(await catalog.getPiece('moringa-de-barro-com-tampa')).not.toBeNull();
  });

  it('can change the pieces created in her own browser', async () => {
    const created = await sellers.createPiece(lucia, { ...piece, name: 'Prato fundo' });
    const slug = created.ok ? created.piece.slug : '';
    expect((await sellers.setPieceStatus(lucia, slug, 'paused')).ok).toBe(true);
    expect(
      await sellers.setPieceStatus({ ...lucia, sid: 'another-browser' }, slug, 'published'),
    ).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });

  it('cannot touch another maker’s piece', async () => {
    expect(await sellers.setPieceStatus(lucia, 'renda-de-bilro', 'paused')).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });
});
