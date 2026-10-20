import { and, eq, inArray, isNotNull, lt } from 'drizzle-orm';
import { db, schema } from '../../db';
import { orderCode } from './code';
import { daysAgo, demoAddress, demoBuyer, sampleOrders } from './sample-orders';

const { orders, orderItems, pieces, shops, users } = schema;

/** How long a demo sign-in keeps its orders before they are cleaned up. */
export const demoLifetimeMs = 7 * 86_400_000;

export const isDemoEmail = (email: string) => email.toLowerCase() === demoBuyer.email;

/**
 * Gives one demo sign-in its own copy of Marina's orders (paid, shipped, delivered).
 * Visitors can confirm a delivery or buy something without changing what the next visitor sees,
 * and nobody ever sees an address someone else typed. Expired copies are removed on the way.
 */
export async function provisionDemoOrders(sid: string, now = Date.now()) {
  const database = db();

  await database
    .delete(orders)
    .where(and(isNotNull(orders.demoExpiresAt), lt(orders.demoExpiresAt, new Date(now))));

  const [buyer] = await database
    .insert(users)
    .values({ name: demoBuyer.name, email: demoBuyer.email, role: 'buyer', isDemo: true })
    .onConflictDoUpdate({ target: users.email, set: { isDemo: true } })
    .returning({ id: users.id });

  const slugs = sampleOrders.flatMap((o) => o.items.map((i) => i.piece));
  const rows = await database
    .select({
      id: pieces.id,
      slug: pieces.slug,
      namePt: pieces.namePt,
      priceCents: pieces.priceCents,
      shippingCents: pieces.shippingCents,
      shopId: pieces.shopId,
      shopSlug: shops.slug,
    })
    .from(pieces)
    .innerJoin(shops, eq(pieces.shopId, shops.id))
    .where(inArray(pieces.slug, slugs));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const expires = new Date(now + demoLifetimeMs);
  const created = sampleOrders.flatMap((o) => {
    const items = o.items.flatMap((i) => {
      const piece = bySlug.get(i.piece);
      return piece ? [{ ...piece, quantity: i.quantity }] : [];
    });
    if (items.length !== o.items.length) return []; // catalog changed: skip this demo order
    const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
    const shippingCents = Math.max(...items.map((i) => i.shippingCents));
    return [
      {
        order: {
          id: crypto.randomUUID(),
          code: orderCode(),
          buyerId: buyer!.id,
          shopId: items[0]!.shopId,
          status: o.status,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + shippingCents,
          address: demoAddress,
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
      },
    ];
  });
  if (created.length === 0) return 0;

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

/** Orders of the demo account are scoped to the sign-in that created them. */
export const demoScope = (sid: string) => eq(orders.demoSessionId, sid);
