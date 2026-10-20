import type { OrderDetail, OrderSummary } from './types';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (code: string) => [...orderKeys.all, 'detail', code] as const,
};

export class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed with ${status}`);
  }
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new ApiError(response.status);
  return response.json() as Promise<T>;
}

export const fetchOrders = () => fetch('/api/me/orders').then(json<OrderSummary[]>);
export const fetchOrder = (code: string) =>
  fetch(`/api/me/orders/${encodeURIComponent(code)}`).then(json<OrderDetail>);
export const confirmDelivery = (code: string) =>
  fetch(`/api/me/orders/${encodeURIComponent(code)}/delivered`, { method: 'POST' }).then(
    json<OrderDetail>,
  );
