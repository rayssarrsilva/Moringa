import type { ShopOrder } from './orders-types';

export const shopOrderKeys = { all: ['shop-orders'] as const };

export class ShopOrderError extends Error {
  constructor(public reason: string) {
    super(reason);
  }
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({ error: 'unknown' }))) as {
      error: string;
    };
    throw new ShopOrderError(error);
  }
  return response.json() as Promise<T>;
}

export const fetchShopOrders = () => fetch('/api/seller/orders').then(json<ShopOrder[]>);

export const startPreparing = (code: string) =>
  fetch(`/api/seller/orders/${encodeURIComponent(code)}/preparing`, { method: 'POST' }).then(
    json<ShopOrder>,
  );

export const markShipped = (code: string, trackingCode: string) =>
  fetch(`/api/seller/orders/${encodeURIComponent(code)}/shipped`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingCode }),
  }).then(json<ShopOrder>);
