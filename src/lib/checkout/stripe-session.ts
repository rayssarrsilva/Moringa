import type Stripe from 'stripe';
import type { ShopGroup } from '../bag/bag';
import type { CheckoutInput } from './schema';

const stripeLocale = { pt: 'pt-BR', en: 'en' } as const;

/**
 * Turns a priced cart into Stripe Checkout params. One line per piece and one shipping
 * line per maker. Payment methods (card, Pix) come from the Stripe Dashboard settings.
 */
export function buildSessionParams({
  input,
  groups,
  orderIds,
  siteUrl,
}: {
  input: CheckoutInput;
  groups: ShopGroup[];
  orderIds: string[];
  siteUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  const { locale } = input;
  const shipping = locale === 'pt' ? 'Frete' : 'Shipping';

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = groups.flatMap((g) => [
    ...g.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'brl',
        unit_amount: item.priceCents,
        product_data: {
          name: item.name[locale],
          description: `${locale === 'pt' ? 'Feita por' : 'Made by'} ${g.shop.name}`,
          metadata: { slug: item.slug },
        },
      },
    })),
    {
      quantity: 1,
      price_data: {
        currency: 'brl',
        unit_amount: g.shippingCents,
        product_data: { name: `${shipping} · ${g.shop.name}` },
      },
    },
  ]);

  return {
    mode: 'payment',
    locale: stripeLocale[locale],
    customer_email: input.address.email,
    line_items: lineItems,
    success_url: `${siteUrl}/${locale}/pedido/confirmado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${locale}/sacola`,
    metadata: { order_ids: orderIds.join(','), locale },
    payment_intent_data: { description: `Moringa · ${orderIds.length} pedido(s)` },
  };
}
