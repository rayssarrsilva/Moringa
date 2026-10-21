import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../../db';
import { orderCode } from '../orders/code';
import { demoLifetimeMs } from '../orders/demo-orders';
import { daysAgo } from '../orders/sample-orders';
import { sampleShop, sampleShopOrders } from './sample-shop-orders';

const { orders, orderItems, pieces, shops, users } = schema;

/**
 * Gives one browser its own copy of the orders Dona Lúcia received, once.
 * Shown only to that browser's demo session, so no real buyer's name or address ever appears.
 */
export async function provisionDemoShopOrders(sid: string, now = Date.now()) {
  const database = db();
  const [shop] = await database
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.slug, sampleShop))
    .limit(1);
  if (!shop) return 0;

  const emails = [...new Set(sampleShopOrders.map((o) => o.buyer.email))];
  const already = await database
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(
      and(eq(orders.shopId, shop.id), eq(orders.demoSessionId, sid), inArray(users.email, emails)),
    )
    .limit(1);
  if (already.length > 0) return 0;

  const buyers = new Map<string, string>();
  for (const email of emails) {
    const b = sampleShopOrders.find((o) => o.buyer.email === email)!.buyer;
    const [row] = await database
      .insert(users)
      .values({ name: b.name, email, role: 'buyer', isDemo: true })
      .onConflictDoUpdate({ target: users.email, set: { name: b.name } })
      .returning({ id: users.id });
    buyers.set(email, row!.id);
  }

  const slugs = [...new Set(sampleShopOrders.flatMap((o) => o.items.map((i) => i.piece)))];
  const rows = await database
    .select({
      id: pieces.id,
      slug: pieces.slug,
      namePt: pieces.namePt,
      priceCents: pieces.priceCents,
      shippingCents: pieces.shippingCents,
    })
    .from(pieces)
    .where(inArray(pieces.slug, slugs));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  if (bySlug.size !== slugs.length) return 0;

  const expires = new Date(now + demoLifetimeMs);
  const created = sampleShopOrders.map((o) => {
    const items = o.items.map((i) => ({ ...bySlug.get(i.piece)!, quantity: i.quantity }));
    const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
    const shippingCents = Math.max(...items.map((i) => i.shippingCents));
    return {
      order: {
        id: crypto.randomUUID(),
        code: orderCode(),
        buyerId: buyers.get(o.buyer.email)!,
        shopId: shop.id,
        status: o.status,
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        address: o.buyer.address,
        trackingCode: o.trackingCode ?? null,
        createdAt: daysAgo(o.days.created, now)!,
        paidAt: daysAgo(o.days.paid, now),
        preparingAt: daysAgo(o.days.preparing, now),
        shippedAt: daysAgo(o.days.shipped, now),
        deliveredAt: daysAgo(o.days.delivered, now),
        demoSessionId: sid,
        demoExpiresAt: expires,
      },
      items,
    };
  });

  await database.batch([
    database.insert(orders).values(created.map((c) => c.order)),
    database.insert(orderItems).values(
      created.flatMap((c) =>
        c.items.map((i) => ({
          orderId: c.order.id,
          pieceId: i.id,
          name: i.namePt,
          unitPriceCents: i.priceCents,
          quantity: i.quantity,
        })),
      ),
    ),
  ]);
  return created.length;
}
