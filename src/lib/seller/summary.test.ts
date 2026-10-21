import { describe, expect, it } from 'vitest';
import type { ShopOrder } from './orders-types';
import { summarize, toShip } from './summary';

const now = new Date('2026-10-21T12:00:00-03:00').getTime();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

function order(status: ShopOrder['status'], days: number, subtotalCents = 10000): ShopOrder {
  return {
    code: `MOR-${status.slice(0, 3).toUpperCase()}${days}`.padEnd(10, 'X'),
    status,
    createdAt: daysAgo(days),
    paidAt: status === 'pending' || status === 'canceled' ? null : daysAgo(days),
    shippedAt: null,
    deliveredAt: null,
    buyerName: 'Carla',
    address: {
      cep: '01310100',
      street: 'Rua',
      number: '1',
      neighborhood: 'B',
      city: 'C',
      state: 'SP',
    },
    items: [],
    subtotalCents,
    shippingCents: 2000,
    totalCents: subtotalCents + 2000,
    trackingCode: null,
  };
}

describe('summarize (US-13)', () => {
  it('counts 3 orders to ship when there are 3 paid and 1 shipped', () => {
    const orders = [order('paid', 1), order('paid', 2), order('paid', 3), order('shipped', 4)];
    expect(summarize(orders, now).toShip).toBe(3);
  });

  it('counts orders being prepared as still to ship', () => {
    expect(toShip([order('paid', 1), order('preparing', 2), order('delivered', 3)])).toHaveLength(
      2,
    );
  });

  it('adds up revenue and sales of the last 30 days, without shipping, pending or canceled', () => {
    const summary = summarize(
      [
        order('paid', 1, 10000),
        order('delivered', 20, 5000),
        order('pending', 2, 99900),
        order('canceled', 3, 99900),
        order('delivered', 45, 70000),
      ],
      now,
    );
    expect(summary.sales).toBe(2);
    expect(summary.revenueCents).toBe(15000);
    expect(summary.averageCents).toBe(7500);
  });

  it('groups revenue into the last 8 weeks, oldest first, for the chart', () => {
    const summary = summarize(
      [order('paid', 0, 10000), order('delivered', 8, 4000), order('shipped', 9, 6000)],
      now,
    );
    expect(summary.weeks).toHaveLength(8);
    expect(summary.weeks.at(-1)).toMatchObject({ revenueCents: 10000, sales: 1 });
    expect(summary.weeks.at(-2)).toMatchObject({ revenueCents: 10000, sales: 2 });
    expect(summary.weeks.slice(0, 6).every((w) => w.revenueCents === 0)).toBe(true);
  });

  it('is all zeros for a shop without orders', () => {
    const summary = summarize([], now);
    expect(summary).toMatchObject({ toShip: 0, sales: 0, revenueCents: 0, averageCents: 0 });
  });
});
