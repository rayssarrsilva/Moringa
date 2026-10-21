import type { OrderDetail, OrderSummary } from './types';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (code: string) => [...orderKeys.all, 'detail', code] as const,
  guest: (code: string, email: string) => [...orderKeys.all, 'guest', code, email] as const,
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

/** Guest tracking: the code and checkout email stand in for a session. */
export type GuestAccess = { email: string };

const post = (url: string, body: unknown) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const fetchGuestOrder = (code: string, { email }: GuestAccess) =>
  post('/api/orders/lookup', { code, email }).then(json<OrderDetail>);
export const confirmGuestDelivery = (code: string, { email }: GuestAccess) =>
  post('/api/orders/lookup/delivered', { code, email }).then(json<OrderDetail>);

export interface PostedReview {
  rating: number;
  comment: string | null;
  createdAt: string;
}

export const postReview = (
  code: string,
  body: { piece: string; rating: number; comment?: string },
) =>
  fetch(`/api/me/orders/${encodeURIComponent(code)}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(json<PostedReview>);
