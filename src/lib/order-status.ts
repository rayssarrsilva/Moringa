/**
 * Order lifecycle, mirroring the state diagram in FigJam
 * (docs/design/README.md → "Order lifecycle").
 */
export const orderStatuses = [
  'pending',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'canceled',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type Actor = 'system' | 'buyer' | 'seller';

const transitions: Record<OrderStatus, Partial<Record<OrderStatus, Actor[]>>> = {
  pending: { paid: ['system'], canceled: ['system'] },
  paid: { preparing: ['seller'], canceled: ['seller'] },
  preparing: { shipped: ['seller'] },
  shipped: { delivered: ['buyer', 'system'] },
  delivered: {},
  canceled: {},
};

export function canTransition(from: OrderStatus, to: OrderStatus, actor: Actor): boolean {
  return transitions[from][to]?.includes(actor) ?? false;
}

/** Tracking codes from Correios look like BR123456789BR (2 letters, 9 digits, 2 letters). */
export const trackingCodePattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

export function normalizeTrackingCode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

export function isFinal(status: OrderStatus): boolean {
  return Object.keys(transitions[status]).length === 0;
}
