import type { Localized, Material, Piece } from '../catalog/types';

/**
 * Pure bag logic, written test-first. The Zustand store only calls these functions,
 * so every rule (stock limits, one shipping per maker) is tested without React.
 */
export interface BagPiece {
  slug: string;
  name: Localized;
  material: Material;
  priceCents: number;
  shippingCents: number;
  stock: number;
  shop: { slug: string; name: string };
}

export interface BagItem extends BagPiece {
  quantity: number;
}

export interface AddResult {
  items: BagItem[];
  /** True when the bag could not take everything asked for, because of stock. */
  limited: boolean;
  available: number;
}

export const toBagPiece = (p: Piece): BagPiece => ({
  slug: p.slug,
  name: p.name,
  material: p.material,
  priceCents: p.priceCents,
  shippingCents: p.shippingCents,
  stock: p.stock,
  shop: { slug: p.shop.slug, name: p.shop.name },
});

const clamp = (quantity: number, stock: number) =>
  Math.max(0, Math.min(Math.floor(quantity), stock));

export function addItem(items: BagItem[], piece: BagPiece, quantity = 1): AddResult {
  const current = items.find((i) => i.slug === piece.slug)?.quantity ?? 0;
  const wanted = current + quantity;
  const next = clamp(wanted, piece.stock);
  const result: AddResult = { items, limited: next < wanted, available: piece.stock };

  if (next === 0) {
    result.items = items.filter((i) => i.slug !== piece.slug);
  } else if (current === 0) {
    result.items = [...items, { ...piece, quantity: next }];
  } else {
    result.items = items.map((i) => (i.slug === piece.slug ? { ...piece, quantity: next } : i));
  }
  return result;
}

export function setQuantity(items: BagItem[], slug: string, quantity: number): BagItem[] {
  return items.flatMap((i) => {
    if (i.slug !== slug) return [i];
    const next = clamp(quantity, i.stock);
    return next === 0 ? [] : [{ ...i, quantity: next }];
  });
}

export const removeItem = (items: BagItem[], slug: string) => items.filter((i) => i.slug !== slug);

export interface ShopGroup {
  shop: BagItem['shop'];
  items: BagItem[];
  subtotalCents: number;
  /** Pieces from one maker travel in one package, so we charge the highest shipping among them. */
  shippingCents: number;
}

export function groupByShop(items: BagItem[]): ShopGroup[] {
  const groups = new Map<string, ShopGroup>();
  for (const item of items) {
    const group = groups.get(item.shop.slug) ?? {
      shop: item.shop,
      items: [],
      subtotalCents: 0,
      shippingCents: 0,
    };
    group.items.push(item);
    group.subtotalCents += item.priceCents * item.quantity;
    group.shippingCents = Math.max(group.shippingCents, item.shippingCents);
    groups.set(item.shop.slug, group);
  }
  return [...groups.values()];
}

export function bagTotals(items: BagItem[]) {
  const groups = groupByShop(items);
  const subtotalCents = groups.reduce((sum, g) => sum + g.subtotalCents, 0);
  const shippingCents = groups.reduce((sum, g) => sum + g.shippingCents, 0);
  return {
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

export type BagChange =
  | {
      slug: string;
      name: Localized;
      kind: 'price' | 'shipping' | 'stock';
      from: number;
      to: number;
    }
  | { slug: string; name: Localized; kind: 'removed' };

/**
 * Brings the saved bag up to date with the catalog: current price, shipping and stock, and
 * pieces no longer on sale removed. Returns what changed, so the buyer is told before paying.
 * `current` holds only the pieces on sale; anything missing from it was paused or sold out.
 */
export function syncItems(
  items: BagItem[],
  current: BagPiece[],
): { items: BagItem[]; changes: BagChange[] } {
  const changes: BagChange[] = [];
  const next = items.flatMap((item): BagItem[] => {
    const piece = current.find((p) => p.slug === item.slug);
    const { slug, name } = item;
    if (!piece || piece.stock === 0) {
      changes.push({ slug, name, kind: 'removed' });
      return [];
    }
    if (piece.priceCents !== item.priceCents)
      changes.push({ slug, name, kind: 'price', from: item.priceCents, to: piece.priceCents });
    if (piece.shippingCents !== item.shippingCents)
      changes.push({
        slug,
        name,
        kind: 'shipping',
        from: item.shippingCents,
        to: piece.shippingCents,
      });
    const quantity = clamp(item.quantity, piece.stock);
    if (quantity !== item.quantity)
      changes.push({ slug, name, kind: 'stock', from: item.quantity, to: quantity });
    return [{ ...piece, quantity }];
  });
  return changes.length === 0 ? { items, changes } : { items: next, changes };
}
