import 'server-only';
import Stripe from 'stripe';

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | undefined;

/** Test-mode keys only (sk_test_…). Without a key, checkout runs as a demo with no payment. */
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_'))
    throw new Error('Moringa is a portfolio project: use a test-mode key (sk_test_…).');
  client ??= new Stripe(key, {
    appInfo: { name: 'Moringa', url: 'https://github.com/rayssarrsilva/Moringa' },
  });
  return client;
}
