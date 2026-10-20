import type { AddressSnapshot } from '../../db/schema';
import type { Localized, Material } from '../catalog/types';
import type { OrderStatus } from '../order-status';

/** Dates travel as ISO strings, so the same object works in Server Components, JSON and the query cache. */
export interface OrderSummary {
  code: string;
  status: OrderStatus;
  createdAt: string;
  totalCents: number;
  shop: { slug: string; name: string };
  itemCount: number;
  cover: { name: Localized; material: Material };
}

export interface OrderItem {
  slug: string;
  name: Localized;
  material: Material;
  unitPriceCents: number;
  quantity: number;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  trackingCode: string | null;
  address: AddressSnapshot;
  paidAt: string | null;
  preparingAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

/** Who is asking. `sid` is unique per sign-in; the sample repository uses it to keep demo changes per session. */
export interface Viewer {
  email: string;
  sid: string;
}

export type ConfirmResult =
  { ok: true; order: OrderDetail } | { ok: false; reason: 'not_found' | 'not_allowed' };

export interface BuyerOrdersRepository {
  listForBuyer(viewer: Viewer): Promise<OrderSummary[]>;
  getForBuyer(viewer: Viewer, code: string): Promise<OrderDetail | null>;
  confirmDelivery(viewer: Viewer, code: string): Promise<ConfirmResult>;
}
