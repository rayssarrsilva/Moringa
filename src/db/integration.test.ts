// @vitest-environment node
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '@/db';
import { createTestDb } from '@/test/test-db';

let testDb: Database;
vi.mock('server-only', () => ({}));
vi.mock('@/db', async (original) => ({
  ...(await original<typeof import('@/db')>()),
  db: () => testDb,
}));

const { schema } = await import('@/db');
const { seedDemoData } = await import('./demo-data');
const { dbRepository } = await import('@/lib/catalog/db-repository');
const { sampleRepository } = await import('@/lib/catalog/sample-repository');
const { parseCatalogQuery } = await import('@/lib/catalog/query');
const { priceCart } = await import('@/lib/checkout/pricing');
const orders = await import('@/lib/orders/repository');
const { dbBuyerRepository } = await import('@/lib/orders/db-buyer-repository');
const { provisionDemoOrders, demoLifetimeMs } = await import('@/lib/orders/demo-orders');
const { demoAddress, demoBuyer } = await import('@/lib/orders/sample-orders');
const { guestViewer } = await import('@/lib/orders/lookup');

const address = {
  name: 'Bia Teste',
  email: 'bia@example.com',
  cep: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP' as const,
};

async function stockOf(slug: string) {
  const [row] = await testDb
    .select({ stock: schema.pieces.stock })
    .from(schema.pieces)
    .where(eq(schema.pieces.slug, slug));
  return row!.stock;
}

beforeAll(async () => {
  testDb = await createTestDb();
  await seedDemoData(testDb);
}, 60_000);

describe('catalog SQL matches the in-memory catalog', () => {
  const queries = [
    {},
    { regiao: 'nordeste' },
    { estado: 'SP', material: 'ceramica' },
    { preco_min: '65', preco_max: '120' },
    { q: 'lúcia' },
    { q: 'spoon' },
    { q: '50%' },
    { ordem: 'menor-preco' },
    { ordem: 'maior-preco', regiao: 'sudeste' },
  ];

  for (const params of queries) {
    it(`returns the same pieces for ${JSON.stringify(params)}`, async () => {
      const query = parseCatalogQuery(params);
      const fromDb = (await dbRepository.listPieces(query)).map((p) => p.slug);
      const fromMemory = (await sampleRepository.listPieces(query)).map((p) => p.slug);
      expect(fromDb).toEqual(fromMemory);
    });
  }

  it('finds shops and counts their published pieces', async () => {
    expect((await dbRepository.listShops()).map((s) => [s.slug, s.pieceCount]).sort()).toEqual(
      (await sampleRepository.listShops()).map((s) => [s.slug, s.pieceCount]).sort(),
    );
    expect((await dbRepository.getShop('ceramica-da-lucia'))?.pieces).toHaveLength(2);
    expect(await dbRepository.getPiece('nao-existe')).toBeNull();
  });
});

describe('orders from checkout to payment (US-07)', () => {
  it('creates one pending order per maker and takes stock only once when paid', async () => {
    const pieces = await dbRepository.getPiecesBySlugs(['tigela-de-ceramica', 'cesto-de-palha']);
    const priced = priceCart(
      [
        { slug: 'tigela-de-ceramica', quantity: 2 },
        { slug: 'cesto-de-palha', quantity: 1 },
      ],
      pieces,
    );
    if (!priced.ok) throw new Error('cart should price');
    const before = {
      tigela: await stockOf('tigela-de-ceramica'),
      cesto: await stockOf('cesto-de-palha'),
    };

    const created = await orders.createPendingOrders(priced.groups, address);
    expect(created).toHaveLength(2);
    await orders.attachSession(
      created.map((o) => o.id),
      'cs_test_1',
    );

    expect(await orders.markPaidBySession('cs_test_1')).toBe(2);
    expect(await stockOf('tigela-de-ceramica')).toBe(before.tigela - 2);
    expect(await stockOf('cesto-de-palha')).toBe(before.cesto - 1);

    // Stripe can deliver the same webhook twice.
    expect(await orders.markPaidBySession('cs_test_1')).toBe(0);
    expect(await stockOf('tigela-de-ceramica')).toBe(before.tigela - 2);

    // A late "expired" event never cancels a paid order.
    expect(await orders.cancelBySession('cs_test_1')).toBe(0);
    const saved = await orders.ordersBySession('cs_test_1');
    expect(saved.map((o) => o.status)).toEqual(['paid', 'paid']);
    expect(saved.reduce((s, o) => s + o.totalCents, 0)).toBe(priced.totals.totalCents);
  });

  it('cancels pending orders when the Pix expires', async () => {
    const pieces = await dbRepository.getPiecesBySlugs(['pano-de-prato-bordado']);
    const priced = priceCart([{ slug: 'pano-de-prato-bordado', quantity: 1 }], pieces);
    if (!priced.ok) throw new Error('cart should price');
    const [order] = await orders.createPendingOrders(priced.groups, address);
    await orders.attachSession([order!.id], 'cs_test_pix');
    expect(await orders.cancelBySession('cs_test_pix')).toBe(1);
    expect((await orders.ordersBySession('cs_test_pix'))[0]!.status).toBe('canceled');
  });
});

const marina = (sid: string) => ({ email: demoBuyer.email, sid });

describe('the shared demo account', () => {
  it('gives each sign-in its own copy of the demo orders', async () => {
    await provisionDemoOrders('session-a');
    await provisionDemoOrders('session-b');
    const a = await dbBuyerRepository.listForBuyer(marina('session-a'));
    const b = await dbBuyerRepository.listForBuyer(marina('session-b'));
    expect(a.map((o) => o.status).sort()).toEqual(['delivered', 'paid', 'shipped']);
    expect(b).toHaveLength(3);
    expect(a.map((o) => o.code)).not.toEqual(b.map((o) => o.code));
  });

  it('keeps one visitor’s actions away from the next visitor (US-08)', async () => {
    const shippedA = (await dbBuyerRepository.listForBuyer(marina('session-a'))).find(
      (o) => o.status === 'shipped',
    )!;
    const result = await dbBuyerRepository.confirmDelivery(marina('session-a'), shippedA.code);
    expect(result.ok && result.order.status).toBe('delivered');
    expect(await dbBuyerRepository.getForBuyer(marina('session-b'), shippedA.code)).toBeNull();
    const shippedB = (await dbBuyerRepository.listForBuyer(marina('session-b'))).filter(
      (o) => o.status === 'shipped',
    );
    expect(shippedB).toHaveLength(1);
  });

  it('never shows an order placed with the demo email by someone who was not signed in', async () => {
    const pieces = await dbRepository.getPiecesBySlugs(['jogo-de-colheres-de-madeira']);
    const priced = priceCart([{ slug: 'jogo-de-colheres-de-madeira', quantity: 1 }], pieces);
    if (!priced.ok) throw new Error('cart should price');
    await orders.createPendingOrders(
      priced.groups,
      { ...address, email: demoBuyer.email },
      demoBuyer.email,
      'anon_someone',
    );
    expect(await dbBuyerRepository.listForBuyer(marina('session-a'))).toHaveLength(3);
  });

  it('uses Marina’s made-up address on demo orders', async () => {
    const [first] = await dbBuyerRepository.listForBuyer(marina('session-a'));
    const order = await dbBuyerRepository.getForBuyer(marina('session-a'), first!.code);
    expect(order?.address).toEqual(demoAddress);
  });

  it('cleans up demo orders after they expire', async () => {
    await provisionDemoOrders('session-c', Date.now() + demoLifetimeMs + 60_000);
    expect(await dbBuyerRepository.listForBuyer(marina('session-a'))).toEqual([]);
    expect(await dbBuyerRepository.listForBuyer(marina('session-c'))).toHaveLength(3);
  });
});

describe('tracking an order without an account', () => {
  it('finds a guest order with the code and checkout email, and only then', async () => {
    const pieces = await dbRepository.getPiecesBySlugs(['cesto-de-palha']);
    const priced = priceCart([{ slug: 'cesto-de-palha', quantity: 1 }], pieces);
    if (!priced.ok) throw new Error('cart should price');
    const [order] = await orders.createPendingOrders(priced.groups, {
      ...address,
      email: 'Guest@Example.com',
    });
    const [row] = await testDb
      .select({ code: schema.orders.code })
      .from(schema.orders)
      .where(eq(schema.orders.id, order!.id));
    const code = row!.code;

    const found = await dbBuyerRepository.getForBuyer(
      guestViewer({ code, email: 'guest@example.com' }),
      code,
    );
    expect(found?.code).toBe(code);
    expect(
      await dbBuyerRepository.getForBuyer(guestViewer({ code, email: 'other@example.com' }), code),
    ).toBeNull();
  });

  it('never opens the shared demo account’s orders as a guest', async () => {
    await provisionDemoOrders('session-guest-test');
    const [mine] = await dbBuyerRepository.listForBuyer(marina('session-guest-test'));
    expect(mine).toBeDefined();
    expect(
      await dbBuyerRepository.getForBuyer(
        guestViewer({ code: mine!.code, email: demoBuyer.email }),
        mine!.code,
      ),
    ).toBeNull();
  });
});
