import type { OrderStatus } from '../order-status';
import type { OrderDetail } from './types';

export const timelineSteps = ['paid', 'preparing', 'shipped', 'delivered'] as const;
export type TimelineStep = (typeof timelineSteps)[number];

export interface TimelineEntry {
  step: TimelineStep;
  state: 'done' | 'current' | 'upcoming';
  at: string | null;
}

const reached: Record<OrderStatus, number> = {
  pending: -1,
  paid: 0,
  preparing: 1,
  shipped: 2,
  delivered: 3,
  canceled: -1,
};

/**
 * The buyer's view of the order lifecycle. The latest reached step is "current"
 * (or "done" once delivered, the last step).
 */
export function buildTimeline(
  order: Pick<OrderDetail, 'status' | 'paidAt' | 'preparingAt' | 'shippedAt' | 'deliveredAt'>,
): TimelineEntry[] {
  const index = reached[order.status];
  const at: Record<TimelineStep, string | null> = {
    paid: order.paidAt,
    preparing: order.preparingAt,
    shipped: order.shippedAt,
    delivered: order.deliveredAt,
  };
  return timelineSteps.map((step, i) => ({
    step,
    at: i <= index ? at[step] : null,
    state:
      i < index || (i === index && order.status === 'delivered')
        ? 'done'
        : i === index
          ? 'current'
          : 'upcoming',
  }));
}

/** Orders that can still change are polled so the timeline updates without a refresh (US-08). */
export const isOpen = (status: OrderStatus) => status !== 'delivered' && status !== 'canceled';

export const correiosTrackingUrl = 'https://rastreamento.correios.com.br/app/index.php';
