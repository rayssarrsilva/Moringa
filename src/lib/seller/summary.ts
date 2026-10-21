import type { ShopOrder } from './orders-types';

const DAY = 86_400_000;
const sold = (o: ShopOrder) => o.status !== 'pending' && o.status !== 'canceled';
const soldAt = (o: ShopOrder) => new Date(o.paidAt ?? o.createdAt).getTime();

/** Paid orders not shipped yet: what the maker has to pack today. */
export const toShip = (orders: ShopOrder[]) =>
  orders.filter((o) => o.status === 'paid' || o.status === 'preparing');

export interface WeekSummary {
  /** First day of the week, ISO. */
  start: string;
  revenueCents: number;
  sales: number;
}

export interface ShopSummary {
  toShip: number;
  sales: number;
  revenueCents: number;
  averageCents: number;
  weeks: WeekSummary[];
}

/**
 * The maker's overview (US-13). Revenue counts the pieces only: shipping goes to the carrier.
 * Sales and revenue cover the last 30 days; the chart shows the last 8 weeks, oldest first.
 */
export function summarize(orders: ShopOrder[], now = Date.now()): ShopSummary {
  const recent = orders.filter((o) => sold(o) && soldAt(o) > now - 30 * DAY);
  const revenueCents = recent.reduce((sum, o) => sum + o.subtotalCents, 0);

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    const inWeek = orders.filter((o) => sold(o) && soldAt(o) > start && soldAt(o) <= end);
    return {
      start: new Date(start + 1).toISOString(),
      revenueCents: inWeek.reduce((sum, o) => sum + o.subtotalCents, 0),
      sales: inWeek.length,
    };
  });

  return {
    toShip: toShip(orders).length,
    sales: recent.length,
    revenueCents,
    averageCents: recent.length ? Math.round(revenueCents / recent.length) : 0,
    weeks,
  };
}
