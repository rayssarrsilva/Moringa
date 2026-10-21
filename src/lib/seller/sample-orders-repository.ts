import { sampleRepository as catalog } from '../catalog/sample-repository';
import {
  canTransition,
  normalizeTrackingCode,
  type OrderStatus,
  trackingCodePattern,
} from '../order-status';
import { daysAgo } from '../orders/sample-orders';
import { makers } from '../sample-catalog';
import type { ShopOrder, ShopOrdersRepository } from './orders-types';
import { sampleShop, sampleShopOrders } from './sample-shop-orders';

type Change = { status: OrderStatus; at: string; trackingCode?: string };
const store = globalThis as typeof globalThis & { __moringaShopOrderChanges?: Map<string, Change> };
const changes = (store.__moringaShopOrderChanges ??= new Map<string, Change>());
const loadedAt = Date.now();
const iso = (days?: number) => daysAgo(days, loadedAt)?.toISOString() ?? null;

/** Fixed demo codes, so tests and docs can refer to them. */
const codes = [
  'MOR-LC2P9A',
  'MOR-LC7JQ4',
  'MOR-LCR8M3',
  'MOR-LCX5T2',
  'MOR-LC4NW6',
  'MOR-LCH3K8',
  'MOR-LCZ6D5',
  'MOR-LC9VB7',
];

const ownsSampleShop = (email: string) =>
  makers.some((m) => m.slug === sampleShop && `${m.slug}@demo.moringa.dev` === email.toLowerCase());

async function build(sid: string): Promise<ShopOrder[]> {
  const pieces = await catalog.getPiecesBySlugs(
    sampleShopOrders.flatMap((o) => o.items.map((i) => i.piece)),
  );
  return sampleShopOrders.map((o, index) => {
    const code = codes[index]!;
    const change = changes.get(`${sid}:${code}`);
    const items = o.items.map((i) => {
      const p = pieces.find((x) => x.slug === i.piece)!;
      return {
        slug: p.slug,
        name: p.name,
        material: p.material,
        unitPriceCents: p.priceCents,
        quantity: i.quantity,
      };
    });
    const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
    const shippingCents = Math.max(
      ...o.items.map((i) => pieces.find((x) => x.slug === i.piece)!.shippingCents),
    );
    return {
      code,
      status: change?.status ?? o.status,
      createdAt: iso(o.days.created)!,
      paidAt: iso(o.days.paid),
      shippedAt: change?.status === 'shipped' ? change.at : iso(o.days.shipped),
      deliveredAt: iso(o.days.delivered),
      buyerName: o.buyer.name,
      address: o.buyer.address,
      items,
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      trackingCode: change?.trackingCode ?? o.trackingCode ?? null,
    };
  });
}

/** Without a database: Dona Lúcia's demo orders in memory, changes kept per browser. */
export const sampleShopOrdersRepository: ShopOrdersRepository = {
  async list(viewer) {
    return ownsSampleShop(viewer.email) ? build(viewer.sid) : [];
  },

  async startPreparing(viewer, code) {
    const order = (await this.list(viewer)).find((o) => o.code === code);
    if (!order) return { ok: false, reason: 'not_found' };
    if (!canTransition(order.status, 'preparing', 'seller'))
      return { ok: false, reason: 'not_allowed' };
    changes.set(`${viewer.sid}:${code}`, { status: 'preparing', at: new Date().toISOString() });
    return { ok: true, order: (await this.list(viewer)).find((o) => o.code === code)! };
  },

  async markShipped(viewer, code, trackingCode) {
    const tracking = normalizeTrackingCode(trackingCode);
    if (!trackingCodePattern.test(tracking)) return { ok: false, reason: 'invalid_tracking' };
    const order = (await this.list(viewer)).find((o) => o.code === code);
    if (!order) return { ok: false, reason: 'not_found' };
    if (!canTransition(order.status, 'shipped', 'seller'))
      return { ok: false, reason: 'not_allowed' };
    changes.set(`${viewer.sid}:${code}`, {
      status: 'shipped',
      at: new Date().toISOString(),
      trackingCode: tracking,
    });
    return { ok: true, order: (await this.list(viewer)).find((o) => o.code === code)! };
  },
};
