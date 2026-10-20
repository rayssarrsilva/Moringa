import { and, desc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../../db';
import { canTransition } from '../order-status';
import { demoScope, isDemoEmail } from './demo-orders';
import type { BuyerOrdersRepository, OrderDetail, Viewer } from './types';

const { orders, orderItems, pieces, shops, users } = schema;
const iso = (d: Date | null) => d?.toISOString() ?? null;

async function load(viewer: Viewer, code?: string): Promise<OrderDetail[]> {
  const database = db();
  const rows = await database
    .select({ order: orders, shopSlug: shops.slug, shopName: shops.name })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(
      and(
        eq(users.email, viewer.email.toLowerCase()),
        isDemoEmail(viewer.email) ? demoScope(viewer.sid) : undefined,
        code ? eq(orders.code, code) : undefined,
      ),
    )
    .orderBy(desc(orders.createdAt));
  if (rows.length === 0) return [];

  const items = await database
    .select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      slug: pieces.slug,
      namePt: pieces.namePt,
      nameEn: pieces.nameEn,
      material: pieces.material,
    })
    .from(orderItems)
    .innerJoin(pieces, eq(orderItems.pieceId, pieces.id))
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.order.id),
      ),
    );

  return rows.map(({ order: o, shopSlug, shopName }) => {
    const own = items
      .filter((i) => i.orderId === o.id)
      .map((i) => ({
        slug: i.slug,
        name: { pt: i.namePt, en: i.nameEn },
        material: i.material,
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
      }));
    return {
      code: o.code,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      totalCents: o.totalCents,
      subtotalCents: o.subtotalCents,
      shippingCents: o.shippingCents,
      shop: { slug: shopSlug, name: shopName },
      itemCount: own.reduce((n, i) => n + i.quantity, 0),
      cover: { name: own[0]?.name ?? { pt: '', en: '' }, material: own[0]?.material ?? 'ceramics' },
      items: own,
      trackingCode: o.trackingCode,
      address: o.address,
      paidAt: iso(o.paidAt),
      preparingAt: iso(o.preparingAt),
      shippedAt: iso(o.shippedAt),
      deliveredAt: iso(o.deliveredAt),
    };
  });
}

export const dbBuyerRepository: BuyerOrdersRepository = {
  async listForBuyer(viewer) {
    return (await load(viewer)).map((o) => ({
      code: o.code,
      status: o.status,
      createdAt: o.createdAt,
      totalCents: o.totalCents,
      shop: o.shop,
      itemCount: o.itemCount,
      cover: o.cover,
    }));
  },
  async getForBuyer(viewer, code) {
    return (await load(viewer, code))[0] ?? null;
  },
  async confirmDelivery(viewer, code) {
    const order = (await load(viewer, code))[0];
    if (!order) return { ok: false, reason: 'not_found' };
    if (!canTransition(order.status, 'delivered', 'buyer'))
      return { ok: false, reason: 'not_allowed' };
    // The status check in WHERE makes the change atomic: a second click changes nothing.
    await db()
      .update(orders)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(and(eq(orders.code, code), eq(orders.status, 'shipped')));
    return { ok: true, order: (await load(viewer, code))[0]! };
  },
};
