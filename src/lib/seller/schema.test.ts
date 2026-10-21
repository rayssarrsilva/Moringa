import { describe, expect, it } from 'vitest';
import { parseReais, pieceSchema, pieceSteps, shopSchema, slugify, toPieceInput } from './schema';

const errors = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => Object.fromEntries(result.error?.issues.map((i) => [i.path.join('.'), i.message]) ?? []);

describe('parseReais', () => {
  it('reads the ways people write prices in Brazil', () => {
    expect(parseReais('140')).toBe(14000);
    expect(parseReais('140,5')).toBe(14050);
    expect(parseReais('89,90')).toBe(8990);
    expect(parseReais('R$ 1.250,00')).toBe(125000);
    expect(parseReais('49.9')).toBe(4990);
  });

  it('rejects what is not money', () => {
    for (const text of ['', 'abc', '12,345', '1.2.3', '-5', '10,'])
      expect(parseReais(text)).toBeNull();
  });
});

describe('wizard step "price and stock" (US-12)', () => {
  it('says "Informe o preço" when the price is empty', () => {
    const result = pieceSteps.pricing.safeParse({ price: '', shipping: '20', stock: '2' });
    expect(errors(result)).toEqual({ price: 'priceRequired' });
  });

  it('refuses a zero price but accepts free shipping', () => {
    expect(errors(pieceSteps.pricing.safeParse({ price: '0', shipping: '0', stock: '1' }))).toEqual(
      {
        price: 'pricePositive',
      },
    );
    expect(pieceSteps.pricing.safeParse({ price: '45', shipping: '0', stock: '0' }).success).toBe(
      true,
    );
  });

  it('checks stock is a whole number', () => {
    expect(
      errors(pieceSteps.pricing.safeParse({ price: '45', shipping: '0', stock: '1,5' })),
    ).toEqual({
      stock: 'stock',
    });
  });
});

describe('toPieceInput', () => {
  it('turns the form into cents and numbers', () => {
    const form = pieceSchema.parse({
      name: ' Moringa pequena ',
      material: 'ceramics',
      description: 'Moringa de barro queimada em forno a lenha.',
      price: '89,90',
      shipping: '20',
      stock: '3',
    });
    expect(toPieceInput(form)).toEqual({
      name: 'Moringa pequena',
      material: 'ceramics',
      description: 'Moringa de barro queimada em forno a lenha.',
      priceCents: 8990,
      shippingCents: 2000,
      stock: 3,
    });
  });
});

describe('shopSchema (US-11)', () => {
  const valid = {
    name: 'Ateliê da Rosa',
    craft: 'Rendeira',
    city: 'Divina Pastora',
    state: 'SE',
    story: 'Faço renda irlandesa desde os doze anos, como minha mãe e minha avó faziam.',
  };

  it('accepts a shop and leaves empty optional fields out', () => {
    const shop = shopSchema.parse({ ...valid, quote: '  ', storyEn: '' });
    expect(shop.quote).toBeUndefined();
    expect(shop.storyEn).toBeUndefined();
  });

  it('asks for a story long enough to introduce the maker', () => {
    expect(errors(shopSchema.safeParse({ ...valid, story: 'Faço renda.' }))).toEqual({
      story: 'story',
    });
  });
});

describe('slugify', () => {
  it('makes readable addresses from names', () => {
    expect(slugify('Moringa de barro com tampa')).toBe('moringa-de-barro-com-tampa');
    expect(slugify('  Cesto (grande) — palha!  ')).toBe('cesto-grande-palha');
    expect(slugify('Ateliê São João')).toBe('atelie-sao-joao');
  });
});
