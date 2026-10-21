import type { AddressSnapshot } from '../../db/schema';
import type { OrderStatus } from '../order-status';
import type { OrderItem } from '../orders/types';

/** An order as the maker sees it: who bought, where it goes, what to pack. */
export interface ShopOrder {
  code: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  buyerName: string;
  address: AddressSnapshot;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  trackingCode: string | null;
}

export type ShopOrderResult =
  | { ok: true; order: ShopOrder }
  | { ok: false; reason: 'not_found' | 'not_allowed' | 'invalid_tracking' };

export interface ShopOrdersRepository {
  list(viewer: { email: string; sid: string }): Promise<ShopOrder[]>;
  /** paid → preparing */
  startPreparing(viewer: { email: string; sid: string }, code: string): Promise<ShopOrderResult>;
  /** preparing → shipped, with a Correios tracking code (US-14). */
  markShipped(
    viewer: { email: string; sid: string },
    code: string,
    trackingCode: string,
  ): Promise<ShopOrderResult>;
}
