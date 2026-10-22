'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import { currentViewer } from '@/auth';
import { catalog, catalogTag } from '@/lib/catalog';
import { priceCart, type PricingProblem } from '@/lib/checkout/pricing';
import { checkoutSchema } from '@/lib/checkout/schema';
import { limitAction } from '@/lib/security/action-limit';
import { buildSessionParams } from '@/lib/checkout/stripe-session';
import {
  attachSession,
  cancelOrders,
  createPendingOrders,
  markPaidBySession,
  ordersEnabled,
} from '@/lib/orders/repository';
import { isDemoEmail } from '@/lib/orders/demo-orders';
import { siteUrl } from '@/lib/seo';
import { stripe, stripeEnabled } from '@/lib/stripe';

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: 'invalid' | 'payment' | 'rate_limited' }
  | { ok: false; error: 'stock'; problems: PricingProblem[] };

/**
 * Validates the address again, re-prices the bag from the database, creates one
 * pending order per maker and opens a Stripe Checkout session in test mode.
 */
export async function startCheckout(raw: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  if (!(await limitAction('checkout')).ok) return { ok: false, error: 'rate_limited' };
  const input = parsed.data;

  const pieces = await catalog().getPiecesBySlugs(input.items.map((i) => i.slug));
  const priced = priceCart(input.items, pieces);
  if (!priced.ok) return { ok: false, error: 'stock', problems: priced.problems };

  // Signed in: the order belongs to the account, whatever email was typed.
  const viewer = await currentViewer();
  const buyerEmail = viewer?.email ?? input.address.email;
  // The demo account is shared: its orders stay with the sign-in that placed them.
  const demoSid = isDemoEmail(buyerEmail)
    ? (viewer?.sid ?? `anon_${crypto.randomUUID()}`)
    : undefined;

  if (!stripeEnabled()) {
    // No Stripe key: the payment is simulated, but with a database the orders are real.
    if (!ordersEnabled()) return { ok: true, url: `/${input.locale}/pedido/confirmado?demo=1` };
    const demoSession = `demo_${crypto.randomUUID()}`;
    const orders = await createPendingOrders(priced.groups, input.address, buyerEmail, demoSid);
    await attachSession(
      orders.map((o) => o.id),
      demoSession,
    );
    await markPaidBySession(demoSession);
    updateTag(catalogTag);
    return { ok: true, url: `/${input.locale}/pedido/confirmado?demo=1&session_id=${demoSession}` };
  }

  const orders = ordersEnabled()
    ? await createPendingOrders(priced.groups, input.address, buyerEmail, demoSid)
    : [];
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
