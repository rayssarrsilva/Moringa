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
const { provisionDemoOrders } = await import('@/lib/orders/demo-orders');
const { dbBuyerRepository: buyers } = await import('@/lib/orders/db-buyer-repository');
const { demoBuyer } = await import('@/lib/orders/sample-orders');
const { dbReviewsRepository: reviews } = await import('./db-repository');

const browser = 'browser-reviews';
const marina = (sid = browser) => ({ email: demoBuyer.email, sid });
const lucia = (sid = browser) => ({ email: 'ceramica-da-lucia@demo.moringa.dev', sid });

beforeAll(async () => {
  testDb = await createTestDb();
  await seedDemoData(testDb);
  await provisionDemoOrders(browser);
}, 60_000);

describe('public reviews', () => {
  it('shows the seeded reviews on the piece page, newest first, with first name and initial', async () => {
    const list = await reviews.forPiece('moringa-de-barro-com-tampa');
    expect(list.map((r) => [r.author, r.rating])).toEqual([
      ['Helena D.', 5],
      ['Rafael C.', 5],
    ]);
  });
});

describe('reviewing a delivered piece (US-09)', () => {
  it('saves 5 stars and a comment once, and refuses a second review of the same purchase', async () => {
    const delivered = (await buyers.listForBuyer(marina())).find((o) => o.status === 'delivered')!;
    const order = (await buyers.getForBuyer(marina(), delivered.code))!;
    const piece = order.items[0]!.slug;

    const result = await reviews.create(marina(), delivered.code, {
      piece,
      rating: 5,
      comment: 'Lindo demais!',
    });
    expect(result.ok && result.review).toMatchObject({
      author: 'Marina',
      rating: 5,
      visibility: 'onlyYou',
    });
    expect(await reviews.create(marina(), delivered.code, { piece, rating: 1 })).toEqual({
      ok: false,
      reason: 'already_reviewed',
    });
    expect((await buyers.getForBuyer(marina(), delivered.code))!.items[0]!.review).toMatchObject({
      rating: 5,
      comment: 'Lindo demais!',
    });
  });

  it('waits until the order is delivered', async () => {
    const shipped = (await buyers.listForBuyer(marina())).find((o) => o.status === 'shipped')!;
    const order = (await buyers.getForBuyer(marina(), shipped.code))!;
    expect(
      await reviews.create(marina(), shipped.code, { piece: order.items[0]!.slug, rating: 5 }),
    ).toEqual({
      ok: false,
      reason: 'not_delivered',
    });
  });

  it('keeps a demo review out of the public piece page', async () => {
    const all = await reviews.forPiece('pano-de-prato-bordado');
    expect(all.every((r) => r.visibility === 'public')).toBe(true);
    expect(all.map((r) => r.author)).not.toContain('Marina');
  });
});

describe('the maker’s reviews (US-16)', () => {
  it('shows Dona Lúcia her public reviews, and demo reviews only from her browser', async () => {
    const mine = await reviews.forShop(lucia());
    expect(mine.length).toBeGreaterThanOrEqual(3);
    expect(mine.every((r) => r.visibility === 'public')).toBe(true);
    expect(await reviews.forShop(lucia('another-browser'))).toHaveLength(mine.length);
  });
});
