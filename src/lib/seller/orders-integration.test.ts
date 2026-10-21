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
const { priceCart } = await import('@/lib/checkout/pricing');
const orders = await import('@/lib/orders/repository');
const { dbBuyerRepository: buyers } = await import('@/lib/orders/db-buyer-repository');
const { demoBuyer } = await import('@/lib/orders/sample-orders');
const { provisionDemoShopOrders } = await import('./demo-shop-orders');
const { dbShopOrdersRepository: shopOrders } = await import('./db-orders-repository');
const { summarize } = await import('./summary');

const browser = 'browser-1';
const lucia = (sid = browser) => ({ email: 'ceramica-da-lucia@demo.moringa.dev', sid });
const marina = (sid = browser) => ({ email: demoBuyer.email, sid });

beforeAll(async () => {
  testDb = await createTestDb();
  await seedDemoData(testDb);
}, 60_000);

describe('Dona Lúcia’s demo panel (US-13)', () => {
  it('gets her demo orders once per browser, with 3 to ship', async () => {
    expect(await provisionDemoShopOrders(browser)).toBe(8);
    expect(await provisionDemoShopOrders(browser)).toBe(0);
    const list = await shopOrders.list(lucia());
    expect(list).toHaveLength(8);
    expect(summarize(list).toShip).toBe(3);
  });

  it('never shows one browser’s orders to another', async () => {
    expect(await shopOrders.list(lucia('browser-2'))).toEqual([]);
  });
});

describe('the whole order loop in one browser (US-07 → US-14 → US-08)', () => {
  it('Marina buys, Dona Lúcia prepares and ships, Marina sees the tracking code', async () => {
    const pieces = await catalog.getPiecesBySlugs(['tigela-de-ceramica']);
    const priced = priceCart([{ slug: 'tigela-de-ceramica', quantity: 1 }], pieces);
    if (!priced.ok) throw new Error('cart should price');
    const [created] = await orders.createPendingOrders(
      priced.groups,
      {
        name: 'Marina',
        email: demoBuyer.email,
        cep: '01310-100',
        street: 'Avenida Paulista',
        number: '1578',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      },
      demoBuyer.email,
      browser,
    );
    await orders.attachSession([created!.id], 'cs_test_loop');
    await orders.markPaidBySession('cs_test_loop');

    const code = (await buyers.listForBuyer(marina()))[0]!.code;
    const forLucia = (await shopOrders.list(lucia())).find((o) => o.code === code);
    expect(forLucia).toMatchObject({ status: 'paid', buyerName: 'Marina' });

    expect(await shopOrders.markShipped(lucia(), code, 'BR123456789BR')).toEqual({
      ok: false,
      reason: 'not_allowed',
    });
    expect((await shopOrders.startPreparing(lucia(), code)).ok).toBe(true);
    expect(await shopOrders.markShipped(lucia(), code, 'br 1234')).toEqual({
      ok: false,
      reason: 'invalid_tracking',
    });
    const shipped = await shopOrders.markShipped(lucia(), code, 'br123456789br');
    expect(shipped.ok && shipped.order).toMatchObject({
      status: 'shipped',
      trackingCode: 'BR123456789BR',
    });

    const seen = await buyers.getForBuyer(marina(), code);
    expect(seen).toMatchObject({ status: 'shipped', trackingCode: 'BR123456789BR' });
    expect(seen?.shippedAt).not.toBeNull();
  });

  it('does not let another browser touch the order', async () => {
    const code = (await shopOrders.list(lucia())).find((o) => o.status === 'paid')!.code;
    expect(await shopOrders.startPreparing(lucia('browser-2'), code)).toEqual({
      ok: false,
      reason: 'not_found',
    });
  });
});
