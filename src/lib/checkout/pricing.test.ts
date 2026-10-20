import { describe, expect, it } from 'vitest';
import { sampleRepository } from '../catalog/sample-repository';
import { priceCart } from './pricing';

const all = () => sampleRepository.listPieces({ sort: 'new' });

describe('priceCart', () => {
  it('prices the cart with the server data, one shipping per maker', async () => {
    const result = priceCart(
      [
        { slug: 'moringa-de-barro-com-tampa', quantity: 1 },
        { slug: 'tigela-de-ceramica', quantity: 1 },
        { slug: 'cesto-de-palha', quantity: 1 },
      ],
      await all(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.groups).toHaveLength(2);
    expect(result.totals).toEqual({
      count: 3,
      subtotalCents: 14000 + 8900 + 12000,
      shippingCents: 4000,
      totalCents: 38900,
    });
  });

  it('reports pieces that no longer exist or no longer have enough stock', async () => {
    const result = priceCart(
      [
        { slug: 'moringa-de-barro-com-tampa', quantity: 5 },
        { slug: 'sumiu', quantity: 1 },
      ],
      await all(),
    );
    expect(result).toEqual({
      ok: false,
      problems: [
        { slug: 'moringa-de-barro-com-tampa', reason: 'stock', available: 2 },
        { slug: 'sumiu', reason: 'missing' },
      ],
    });
  });
});
