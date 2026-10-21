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
const { cleanupExpiredDemoData, demoLifetimeMs } = await import('@/lib/orders/demo-orders');

const lucia = (sid: string) => ({
  email: 'ceramica-da-lucia@demo.moringa.dev',
  name: 'Dona Lúcia',
  sid,
});
const newMaker = (sid: string) => ({
  email: `nova-${sid}@demo.moringa.dev`,
  name: 'Nova artesã',
  sid,
});

const shopInput = {
  name: 'Ateliê da Rosa',
  craft: 'Rendeira',
  city: 'Divina Pastora',
  state: 'SE',
  story: 'Faço renda irlandesa desde os doze anos, como minha mãe e minha avó faziam.',
  quote: undefined,
  craftEn: undefined,
  storyEn: undefined,
};
const pieceInput = {
  name: 'Tigela grande',
  material: 'ceramics' as const,
  description: 'Tigela grande de servir, esmalte azul.',
  priceCents: 12000,
  shippingCents: 2000,
  stock: 2,
};

beforeAll(async () => {
  testDb = await createTestDb();
  await seedDemoData(testDb);
}, 60_000);

describe('maker onboarding (US-11)', () => {
  it('creates a shop with its region from the state, once', async () => {
    const result = await sellers.createShop(newMaker('s1'), shopInput);
    expect(result.ok && result.shop).toMatchObject({
      name: 'Ateliê da Rosa',
      region: 'nordeste',
      slug: 'atelie-da-rosa',
      visibility: 'onlyYou',
    });
    expect(await sellers.createShop(newMaker('s1'), shopInput)).toEqual({
      ok: false,
      reason: 'exists',
    });
  });

  it('keeps a demo shop out of the public catalog', async () => {
    expect(await catalog.getShop('atelie-da-rosa')).toBeNull();
    expect((await catalog.listShops()).map((s) => s.slug)).not.toContain('atelie-da-rosa');
  });

  it('gives the same shop name a different address', async () => {
    const other = await sellers.createShop(newMaker('s2'), shopInput);
    expect(other.ok && other.shop.slug).toMatch(/^atelie-da-rosa-[0-9a-f]{4}$/);
  });
});

describe('new piece (US-12)', () => {
  it('lets Dona Lúcia publish a piece only her session sees', async () => {
    const result = await sellers.createPiece(lucia('s3'), pieceInput);
    expect(result.ok && result.piece).toMatchObject({
      slug: 'tigela-grande',
      visibility: 'onlyYou',
      priceCents: 12000,
    });

    const mine = (await sellers.listPieces(lucia('s3'))).map((p) => p.slug);
    expect(mine).toContain('tigela-grande');
    expect(mine).toContain('moringa-de-barro-com-tampa');

    expect((await sellers.listPieces(lucia('another-visitor'))).map((p) => p.slug)).not.toContain(
      'tigela-grande',
    );
    expect(await catalog.getPiece('tigela-grande')).toBeNull();
    expect((await catalog.getShop('ceramica-da-lucia'))!.pieces).toHaveLength(2);
  });

  it('refuses a piece when the maker has no shop yet', async () => {
    expect(await sellers.createPiece(newMaker('no-shop'), pieceInput)).toEqual({
      ok: false,
      reason: 'no_shop',
    });
  });

  it('cleans up demo shops, pieces and one-off accounts when they expire', async () => {
    await cleanupExpiredDemoData(Date.now() + demoLifetimeMs + 60_000);
    expect(await sellers.getShop(newMaker('s1'))).toBeNull();
    expect((await sellers.listPieces(lucia('s3'))).map((p) => p.slug)).not.toContain(
      'tigela-grande',
    );
    expect(await sellers.getShop(lucia('s3'))).not.toBeNull();
  });
});
