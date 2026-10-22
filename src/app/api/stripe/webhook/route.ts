import { revalidateTag } from 'next/cache';
import { catalogTag } from '@/lib/catalog';
import { handleCheckoutEvent } from '@/lib/checkout/webhook';
import { cancelBySession, markPaidBySession, ordersEnabled } from '@/lib/orders/repository';
import { stripe, stripeEnabled } from '@/lib/stripe';

/**
 * Stripe calls this after payment events. The signature check uses the raw body,
 * so it must be read as text before anything parses it.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeEnabled() || !secret) {
    return Response.json({ error: 'stripe_not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return Response.json({ error: 'missing_signature' }, { status: 400 });

  let event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (!ordersEnabled()) return Response.json({ received: true, outcome: 'ignored' });

  const outcome = await handleCheckoutEvent(event, {
    markPaid: markPaidBySession,
    cancel: cancelBySession,
  });
  // A paid order takes stock: refresh the cached catalog in the background.
  if (outcome === 'paid') revalidateTag(catalogTag, 'max');
  return Response.json({ received: true, outcome });
}
