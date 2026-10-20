import { describe, expect, it } from 'vitest';
import { sampleRepository } from '../catalog/sample-repository';
import { priceCart } from './pricing';
import type { CheckoutInput } from './schema';
import { buildSessionParams } from './stripe-session';

const input: CheckoutInput = {
  locale: 'en',
  items: [
    { slug: 'tigela-de-ceramica', quantity: 2 },
    { slug: 'cesto-de-palha', quantity: 1 },
  ],
  address: {
    name: 'Marina',
    email: 'marina@example.com',
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1578',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
};

describe('buildSessionParams', async () => {
  const priced = priceCart(input.items, await sampleRepository.listPieces({ sort: 'new' }));
  if (!priced.ok) throw new Error('sample cart should price');
  const params = buildSessionParams({
    input,
    groups: priced.groups,
    orderIds: ['a', 'b'],
    siteUrl: 'https://moringa.test',
  });

  it('charges in reais, one line per piece plus one shipping line per maker', () => {
    expect(params.line_items).toHaveLength(4);
    expect(params.line_items!.every((l) => l.price_data?.currency === 'brl')).toBe(true);
    const total = params.line_items!.reduce(
      (sum, l) => sum + l.price_data!.unit_amount! * l.quantity!,
      0,
    );
    expect(total).toBe(priced.totals.totalCents);
  });

  it('uses the buyer language and comes back to the right pages', () => {
    expect(params.locale).toBe('en');
    expect(params.line_items![0]!.price_data!.product_data!.name).toBe('Ceramic bowl');
    expect(params.success_url).toBe(
      'https://moringa.test/en/pedido/confirmado?session_id={CHECKOUT_SESSION_ID}',
    );
    expect(params.cancel_url).toBe('https://moringa.test/en/sacola');
  });

  it('links the session to the pending orders', () => {
    expect(params.metadata).toEqual({ order_ids: 'a,b', locale: 'en' });
    expect(params.customer_email).toBe('marina@example.com');
  });
});
