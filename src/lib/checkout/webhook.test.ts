import Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCheckoutEvent, type OrderUpdates } from './webhook';

const stripe = new Stripe('sk_test_offline');
const secret = 'whsec_test_secret';

function event(type: string, object: Record<string, unknown>) {
  return {
    id: 'evt_1',
    type,
    data: { object: { id: 'cs_test_1', ...object } },
  } as unknown as Stripe.Event;
}

describe('handleCheckoutEvent (US-07)', () => {
  let orders: OrderUpdates;
  beforeEach(() => {
    orders = { markPaid: vi.fn().mockResolvedValue(1), cancel: vi.fn().mockResolvedValue(1) };
  });

  it('marks the orders paid when a card payment completes', async () => {
    const outcome = await handleCheckoutEvent(
      event('checkout.session.completed', { payment_status: 'paid' }),
      orders,
    );
    expect(outcome).toBe('paid');
    expect(orders.markPaid).toHaveBeenCalledWith('cs_test_1');
  });

  it('waits when the buyer chose Pix and has not paid yet', async () => {
    const outcome = await handleCheckoutEvent(
      event('checkout.session.completed', { payment_status: 'unpaid' }),
      orders,
    );
    expect(outcome).toBe('awaiting_payment');
    expect(orders.markPaid).not.toHaveBeenCalled();
  });

  it('marks the orders paid when the Pix arrives', async () => {
    expect(
      await handleCheckoutEvent(event('checkout.session.async_payment_succeeded', {}), orders),
    ).toBe('paid');
    expect(orders.markPaid).toHaveBeenCalledOnce();
  });

  it('cancels the orders when the Pix fails or the session expires', async () => {
    await handleCheckoutEvent(event('checkout.session.async_payment_failed', {}), orders);
    await handleCheckoutEvent(event('checkout.session.expired', {}), orders);
    expect(orders.cancel).toHaveBeenCalledTimes(2);
  });

  it('ignores events it does not handle', async () => {
    expect(await handleCheckoutEvent(event('customer.created', {}), orders)).toBe('ignored');
  });
});

describe('webhook signature', () => {
  const payload = JSON.stringify({
    id: 'evt_1',
    object: 'event',
    type: 'checkout.session.completed',
  });

  it('accepts an event signed with our secret', () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe('evt_1');
  });

  it('rejects a forged event', () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_wrong' });
    expect(() => stripe.webhooks.constructEvent(payload, header, secret)).toThrow();
  });
});
