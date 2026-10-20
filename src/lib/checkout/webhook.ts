import type Stripe from 'stripe';

export interface OrderUpdates {
  markPaid: (sessionId: string) => Promise<number>;
  cancel: (sessionId: string) => Promise<number>;
}

export type WebhookOutcome = 'paid' | 'awaiting_payment' | 'canceled' | 'ignored';

/**
 * Card payments are confirmed right away. Pix is asynchronous: the session completes
 * when the QR code is shown, and the money arrives later in a separate event.
 */
export async function handleCheckoutEvent(
  event: Stripe.Event,
  orders: OrderUpdates,
): Promise<WebhookOutcome> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        await orders.markPaid(session.id);
        return 'paid';
      }
      return 'awaiting_payment';
    }
    case 'checkout.session.async_payment_succeeded':
      await orders.markPaid(event.data.object.id);
      return 'paid';
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      await orders.cancel(event.data.object.id);
      return 'canceled';
    default:
      return 'ignored';
  }
}
