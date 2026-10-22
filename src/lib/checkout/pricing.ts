import { bagTotals, type BagItem, groupByShop, type ShopGroup, toBagPiece } from '../bag/bag';
import type { Piece } from '../catalog/types';
import type { CartLine } from './schema';

export type PricingProblem =
  | { slug: string; reason: 'missing' }
  | { slug: string; reason: 'stock'; available: number }
  | { slug: string; reason: 'price'; priceCents: number; shippingCents: number };

export type PricedCart =
  | { ok: true; groups: ShopGroup[]; totals: ReturnType<typeof bagTotals> }
  | { ok: false; problems: PricingProblem[] };

/**
 * Rebuilds the cart from the database. The browser only sends slugs and quantities:
 * prices, shipping and stock always come from the server, so they cannot be tampered with.
 */
export function priceCart(lines: CartLine[], pieces: Piece[]): PricedCart {
  const problems: PricingProblem[] = [];
  const items: BagItem[] = [];

  for (const line of lines) {
    const piece = pieces.find((p) => p.slug === line.slug);
    if (!piece) problems.push({ slug: line.slug, reason: 'missing' });
    else if (piece.stock < line.quantity)
      problems.push({ slug: line.slug, reason: 'stock', available: piece.stock });
    // The price shown on the pay button must be the price charged (CDC, art. 30 and 31).
    else if (
      (line.priceCents !== undefined && line.priceCents !== piece.priceCents) ||
      (line.shippingCents !== undefined && line.shippingCents !== piece.shippingCents)
    )
      problems.push({
        slug: line.slug,
        reason: 'price',
        priceCents: piece.priceCents,
        shippingCents: piece.shippingCents,
      });
    else items.push({ ...toBagPiece(piece), quantity: line.quantity });
  }

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, groups: groupByShop(items), totals: bagTotals(items) };
}
