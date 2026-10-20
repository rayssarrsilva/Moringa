import { sampleRepository } from '../catalog/sample-repository';
import { groupByShop, toBagPiece } from '../bag/bag';
import { canTransition, type OrderStatus } from '../order-status';
import { daysAgo, demoAddress, demoBuyer, sampleOrders } from './sample-orders';
import type { BuyerOrdersRepository, OrderDetail, Viewer } from './types';

/**
 * Orders without a database. Changes (like "I received it") are kept per sign-in session,
 * so parallel tests and different visitors never see each other's demo changes.
 */
type Change = { status: OrderStatus; deliveredAt: string };
// Next.js bundles route handlers and pages separately, so a module-level Map would exist twice.
// Keeping it on globalThis gives the whole server process one store.
const store = globalThis as typeof globalThis & { __moringaDemoChanges?: Map<string, Change> };
const changes = (store.__moringaDemoChanges ??= new Map<string, Change>());
const key = (viewer: Viewer, code: string) => `${viewer.sid}:${code}`;
const iso = (d: Date | null) => d?.toISOString() ?? null;

async function build(viewer: Viewer): Promise<OrderDetail[]> {
  if (viewer.email !== demoBuyer.email) return [];
  const pieces = await sampleRepository.listPieces({ sort: 'new' });

  return sampleOrders.map((o) => {
    const items = o.items.map((i) => {
      const piece = pieces.find((p) => p.slug === i.piece)!;
      return { ...toBagPiece(piece), quantity: i.quantity };
    });
    const [group] = groupByShop(items);
    const change = changes.get(key(viewer, o.code));
    return {
      code: o.code,
      status: change?.status ?? o.status,
      createdAt: iso(daysAgo(o.days.created))!,
      totalCents: group!.subtotalCents + group!.shippingCents,
      subtotalCents: group!.subtotalCents,
      shippingCents: group!.shippingCents,
      shop: group!.shop,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      cover: { name: items[0]!.name, material: items[0]!.material },
      items: items.map((i) => ({
        slug: i.slug,
        name: i.name,
        material: i.material,
        unitPriceCents: i.priceCents,
        quantity: i.quantity,
      })),
      trackingCode: o.trackingCode ?? null,
      address: demoAddress,
      paidAt: iso(daysAgo(o.days.paid)),
      preparingAt: iso(daysAgo(o.days.preparing)),
      shippedAt: iso(daysAgo(o.days.shipped)),
      deliveredAt: change?.deliveredAt ?? iso(daysAgo(o.days.delivered)),
    };
  });
}

const summary = ({ code, status, createdAt, totalCents, shop, itemCount, cover }: OrderDetail) => ({
  code,
  status,
  createdAt,
  totalCents,
  shop,
  itemCount,
  cover,
});

export const sampleBuyerRepository: BuyerOrdersRepository = {
  async listForBuyer(viewer) {
    return (await build(viewer)).map(summary);
  },
  async getForBuyer(viewer, code) {
    return (await build(viewer)).find((o) => o.code === code) ?? null;
  },
  async confirmDelivery(viewer, code) {
    const order = (await build(viewer)).find((o) => o.code === code);
    if (!order) return { ok: false, reason: 'not_found' };
    if (!canTransition(order.status, 'delivered', 'buyer'))
      return { ok: false, reason: 'not_allowed' };
    changes.set(key(viewer, code), { status: 'delivered', deliveredAt: new Date().toISOString() });
    return { ok: true, order: (await this.getForBuyer(viewer, code))! };
  },
};
