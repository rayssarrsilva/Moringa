import { describe, expect, it } from 'vitest';
import {
  addItem,
  bagTotals,
  type BagItem,
  groupByShop,
  removeItem,
  setQuantity,
  toBagPiece,
} from './bag';
import { sampleRepository } from '../catalog/sample-repository';

const piece = async (slug: string) => toBagPiece((await sampleRepository.getPiece(slug))!);

describe('addItem', () => {
  it('adds a new piece with quantity 1 by default', async () => {
    const result = addItem([], await piece('cesto-de-palha'));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ slug: 'cesto-de-palha', quantity: 1 });
    expect(result.limited).toBe(false);
  });

  it('adds to the quantity of a piece already in the bag', async () => {
    const cesto = await piece('cesto-de-palha'); // 3 in stock
    const once = addItem([], cesto);
    const twice = addItem(once.items, cesto);
    expect(twice.items).toHaveLength(1);
    expect(twice.items[0]!.quantity).toBe(2);
  });

  it('keeps the stock and says so when asked for more (US-05)', async () => {
    const moringa = await piece('moringa-de-barro-com-tampa'); // 2 in stock
    const result = addItem([], moringa, 3);
    expect(result.items[0]!.quantity).toBe(2);
    expect(result.limited).toBe(true);
    expect(result.available).toBe(2);
  });

  it('does not add a sold-out piece', async () => {
    const soldOut = { ...(await piece('cesto-de-palha')), stock: 0 };
    const result = addItem([], soldOut);
    expect(result.items).toEqual([]);
    expect(result.limited).toBe(true);
  });

  it('refreshes price and stock from the latest piece data', async () => {
    const cesto = await piece('cesto-de-palha');
    const { items } = addItem([], cesto);
    const updated = addItem(items, { ...cesto, priceCents: 13000, stock: 1 });
    expect(updated.items[0]).toMatchObject({ priceCents: 13000, stock: 1, quantity: 1 });
    expect(updated.limited).toBe(true);
  });

  it('does not change the bag it was given', async () => {
    const before: BagItem[] = [];
    addItem(before, await piece('cesto-de-palha'));
    expect(before).toEqual([]);
  });
});

describe('setQuantity and removeItem', () => {
  it('changes the quantity within 1 and the stock', async () => {
    const { items } = addItem([], await piece('pano-de-prato-bordado')); // 8 in stock
    expect(setQuantity(items, 'pano-de-prato-bordado', 5)[0]!.quantity).toBe(5);
    expect(setQuantity(items, 'pano-de-prato-bordado', 50)[0]!.quantity).toBe(8);
    expect(setQuantity(items, 'pano-de-prato-bordado', 1.7)[0]!.quantity).toBe(1);
  });

  it('removes the piece when the quantity goes to zero', async () => {
    const { items } = addItem([], await piece('pano-de-prato-bordado'));
    expect(setQuantity(items, 'pano-de-prato-bordado', 0)).toEqual([]);
    expect(removeItem(items, 'pano-de-prato-bordado')).toEqual([]);
  });

  it('ignores pieces that are not in the bag', async () => {
    const { items } = addItem([], await piece('pano-de-prato-bordado'));
    expect(setQuantity(items, 'outra', 2)).toEqual(items);
  });
});

describe('groupByShop and bagTotals', () => {
  async function fullBag() {
    let items: BagItem[] = [];
    items = addItem(items, await piece('moringa-de-barro-com-tampa')).items; // Lúcia, 140 + 20 shipping
    items = addItem(items, await piece('tigela-de-ceramica'), 2).items; // Lúcia, 89 + 20 shipping
    items = addItem(items, await piece('cesto-de-palha')).items; // Raimundo, 120 + 20 shipping
    return items;
  }

  it('groups pieces by maker, because each maker ships their own package', async () => {
    const groups = groupByShop(await fullBag());
    expect(groups.map((g) => g.shop.slug)).toEqual(['ceramica-da-lucia', 'cestaria-do-raimundo']);
    expect(groups[0]!.items).toHaveLength(2);
  });

  it('charges one shipping per maker: the highest shipping in that package', async () => {
    const [lucia, raimundo] = groupByShop(await fullBag());
    expect(lucia).toMatchObject({ subtotalCents: 14000 + 2 * 8900, shippingCents: 2000 });
    expect(raimundo).toMatchObject({ subtotalCents: 12000, shippingCents: 2000 });
  });

  it('adds everything up', async () => {
    expect(bagTotals(await fullBag())).toEqual({
      count: 4,
      subtotalCents: 14000 + 17800 + 12000,
      shippingCents: 4000,
      totalCents: 43800 + 4000,
    });
  });

  it('is all zeros for an empty bag', () => {
    expect(bagTotals([])).toEqual({ count: 0, subtotalCents: 0, shippingCents: 0, totalCents: 0 });
  });
});
