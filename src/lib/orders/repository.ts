import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '../../db';
import type { ShopGroup } from '../bag/bag';
import type { AddressInput } from '../checkout/schema';
import { onlyDigits } from '../checkout/schema';
import { canTransition } from '../order-status';
import { orderCode } from './code';

const { orders, orderItems, pieces, shops, users } = schema;

export const ordersEnabled = () => Boolean(process.env.DATABASE_URL);

/**
 * Creates one pending order per maker, in a single transaction.
 * Without sign-in yet, the buyer is found or created by email; Auth.js will reuse that row.
 */
export async function createPendingOrders(groups: ShopGroup[], address: AddressInput) {
  const database = db();
  const slugs = groups.flatMap((g) => g.items.map((i) => i.slug));
  const [buyer] = await database
    .insert(users)
    .values({ name: address.name, email: address.email.toLowerCase(), role: 'buyer' })
    .onConflictDoUpdate({ target: users.email, set: { name: address.name } })
    .returning({ id: users.id });
  const ids = await database
    .select({ id: pieces.id, slug: pieces.slug, shopId: pieces.shopId, shopSlug: shops.slug })
    .from(pieces)
    .innerJoin(shops, eq(pieces.shopId, shops.id))
    .where(inArray(pieces.slug, slugs));
  const pieceBySlug = new Map(ids.map((r) => [r.slug, r]));

  const snapshot = {
    cep: onlyDigits(address.cep),
    street: address.street,
    number: address.number,
    complement: address.complement || undefined,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
  };

  const created = groups.map((g) => ({
    id: crypto.randomUUID(),
    code: orderCode(),
    shopId: pieceBySlug.get(g.items[0]!.slug)!.shopId,
    group: g,
  }));

  await database.batch([
    database.insert(orders).values(
      created.map((o) => ({
        id: o.id,
        code: o.code,
        buyerId: buyer!.id,
        shopId: o.shopId,
        status: 'pending' as const,
        subtotalCents: o.group.subtotalCents,
        shippingCents: o.group.shippingCents,
        totalCents: o.group.subtotalCents + o.group.shippingCents,
        address: snapshot,
      })),
    ),
    database.insert(orderItems).values(
      created.flatMap((o) =>
        o.group.items.map((i) => ({
          orderId: o.id,
          pieceId: pieceBySlug.get(i.slug)!.id,
          name: i.name.pt,
          unitPriceCents: i.priceCents,
          quantity: i.quantity,
        })),
      ),
    ),
  ]);

  return created.map(({ id, code }) => ({ id, code }));
}

export async function attachSession(orderIds: string[], sessionId: string) {
  await db().update(orders).set({ stripeSessionId: sessionId }).where(inArray(orders.id, orderIds));
}

/**
 * pending → paid, once. Stock goes down only for orders that actually changed,
 * so a webhook delivered twice never takes stock twice.
 */
export async function markPaidBySession(sessionId: string): Promise<number> {
  if (!canTransition('pending', 'paid', 'system')) return 0;
  const database = db();
  const paid = await database
    .update(orders)
    .set({ status: 'paid', paidAt: new Date() })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.status, 'pending')))
    .returning({ id: orders.id });
  if (paid.length === 0) return 0;

  await database.execute(sql`
    update ${pieces} set stock = greatest(${pieces.stock} - ${orderItems.quantity}, 0)
    from ${orderItems}
    where ${orderItems.pieceId} = ${pieces.id}
      and ${inArray(
        orderItems.orderId,
        paid.map((p) => p.id),
      )}
  `);
  return paid.length;
}

/** pending → canceled, when the Pix expires or the buyer never pays. */
export async function cancelBySession(sessionId: string): Promise<number> {
  const canceled = await db()
    .update(orders)
    .set({ status: 'canceled' })
    .where(and(eq(orders.stripeSessionId, sessionId), eq(orders.status, 'pending')))
    .returning({ id: orders.id });
  return canceled.length;
}

export async function cancelOrders(orderIds: string[]) {
  if (orderIds.length === 0) return;
  await db().update(orders).set({ status: 'canceled' }).where(inArray(orders.id, orderIds));
}

export async function ordersBySession(sessionId: string) {
  return db()
    .select({
      code: orders.code,
      status: orders.status,
      totalCents: orders.totalCents,
      shopName: shops.name,
    })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(eq(orders.stripeSessionId, sessionId));
}
