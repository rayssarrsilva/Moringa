import type { ShopOrderResult } from './orders-types';

const status = { not_found: 404, not_allowed: 409, invalid_tracking: 422 } as const;

/** The same JSON shape for every order action. */
export function respond(result: ShopOrderResult) {
  return result.ok
    ? Response.json(result.order)
    : Response.json({ error: result.reason }, { status: status[result.reason] });
}
