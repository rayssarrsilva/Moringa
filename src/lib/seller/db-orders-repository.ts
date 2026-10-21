import { and, desc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../../db';
import { canTransition, normalizeTrackingCode, trackingCodePattern } from '../order-status';
import { shopRow } from './db-repository';
import type { ShopOrder, ShopOrdersRepository } from './orders-types';
import { isDemoAccount } from './types';

const { orders, orderItems, pieces, users } = schema;
const iso = (d: Date | null) => d?.toISOString() ?? null;
type Viewer = { email: string; sid: string };

async function load(viewer: Viewer, code?: string): Promise<ShopOrder[]> {
  const shop = await shopRow(viewer);
  if (!shop) return [];
  const database = db();
  const rows = await database
    .select({ order: orders, buyerName: users.name })
    .from(orders)
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(
      and(
        eq(orders.shopId, shop.id),
        // Demo makers only see orders of their own browser: never a real buyer's address.
        isDemoAccount(viewer.email) ? eq(orders.demoSessionId, viewer.sid) : undefined,
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

  return rows.map(({ order: o, buyerName }) => ({
    code: o.code,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    paidAt: iso(o.paidAt),
    shippedAt: iso(o.shippedAt),
    deliveredAt: iso(o.deliveredAt),
    buyerName,
    address: o.address,
    items: items
      .filter((i) => i.orderId === o.id)
      .map((i) => ({
        slug: i.slug,
        name: { pt: i.namePt, en: i.nameEn },
        material: i.material,
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
      })),
    subtotalCents: o.subtotalCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    trackingCode: o.trackingCode,
  }));
}

export const dbShopOrdersRepository: ShopOrdersRepository = {
  list: (viewer) => load(viewer),

  async startPreparing(viewer, code) {
    const [order] = await load(viewer, code);
    if (!order) return { ok: false, reason: 'not_found' };
    if (!canTransition(order.status, 'preparing', 'seller'))
      return { ok: false, reason: 'not_allowed' };
    // The status in WHERE makes it atomic: a double click changes nothing.
    await db()
      .update(orders)
      .set({ status: 'preparing', preparingAt: new Date() })
      .where(and(eq(orders.code, code), eq(orders.status, 'paid')));
    return { ok: true, order: (await load(viewer, code))[0]! };
  },

  async markShipped(viewer, code, trackingCode) {
    const tracking = normalizeTrackingCode(trackingCode);
    if (!trackingCodePattern.test(tracking)) return { ok: false, reason: 'invalid_tracking' };
    const [order] = await load(viewer, code);
    if (!order) return { ok: false, reason: 'not_found' };
    if (!canTransition(order.status, 'shipped', 'seller'))
      return { ok: false, reason: 'not_allowed' };
    await db()
      .update(orders)
      .set({ status: 'shipped', shippedAt: new Date(), trackingCode: tracking })
      .where(and(eq(orders.code, code), eq(orders.status, 'preparing')));
    return { ok: true, order: (await load(viewer, code))[0]! };
  },
};
