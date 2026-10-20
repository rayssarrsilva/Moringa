'use server';

import { headers } from 'next/headers';
import { catalog } from '@/lib/catalog';
import { priceCart, type PricingProblem } from '@/lib/checkout/pricing';
import { checkoutSchema } from '@/lib/checkout/schema';
import { buildSessionParams } from '@/lib/checkout/stripe-session';
import {
  attachSession,
  cancelOrders,
  createPendingOrders,
  ordersEnabled,
} from '@/lib/orders/repository';
import { siteUrl } from '@/lib/seo';
import { stripe, stripeEnabled } from '@/lib/stripe';

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: 'invalid' | 'payment' }
  | { ok: false; error: 'stock'; problems: PricingProblem[] };

/**
 * Validates the address again, re-prices the bag from the database, creates one
 * pending order per maker and opens a Stripe Checkout session in test mode.
 */
export async function startCheckout(raw: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const input = parsed.data;

  const pieces = await catalog().getPiecesBySlugs(input.items.map((i) => i.slug));
  const priced = priceCart(input.items, pieces);
  if (!priced.ok) return { ok: false, error: 'stock', problems: priced.problems };

  if (!stripeEnabled()) {
    return { ok: true, url: `/${input.locale}/pedido/confirmado?demo=1` };
  }

  const orders = ordersEnabled() ? await createPendingOrders(priced.groups, input.address) : [];
  const orderIds = orders.map((o) => o.id);
  try {
    const origin = (await headers()).get('origin') ?? siteUrl();
    const session = await stripe().checkout.sessions.create(
      buildSessionParams({ input, groups: priced.groups, orderIds, siteUrl: origin }),
    );
    if (orderIds.length > 0) await attachSession(orderIds, session.id);
    return { ok: true, url: session.url! };
  } catch (error) {
    console.error('Stripe checkout failed', error);
    await cancelOrders(orderIds);
    return { ok: false, error: 'payment' };
  }
}
