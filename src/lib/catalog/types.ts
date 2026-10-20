import type { Region } from '../regions';

export const materials = ['ceramics', 'straw', 'wood', 'fabric', 'lace'] as const;
export type Material = (typeof materials)[number];

export interface Localized {
  pt: string;
  en: string;
}

export interface ShopSummary {
  slug: string;
  name: string;
  city: string;
  state: string;
  region: Region;
}

export interface Shop extends ShopSummary {
  craft: Localized;
  story: Localized;
  quote: Localized | null;
}

export interface Piece {
  slug: string;
  name: Localized;
  description: Localized;
  material: Material;
  priceCents: number;
  shippingCents: number;
  stock: number;
  shop: ShopSummary;
}

export type SortOrder = 'new' | 'price-asc' | 'price-desc';

/** What the buyer asked for in the catalog. Prices are in cents. */
export interface CatalogQuery {
  q?: string;
  region?: Region;
  state?: string;
  material?: Material;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort: SortOrder;
}

/**
 * Where catalog data comes from. Pages only talk to this interface, so the
 * same code runs against Neon in production and the sample catalog in tests.
 */
export interface CatalogRepository {
  listPieces(query: CatalogQuery): Promise<Piece[]>;
  getPiece(slug: string): Promise<Piece | null>;
  getPiecesBySlugs(slugs: string[]): Promise<Piece[]>;
  listShops(): Promise<(Shop & { pieceCount: number })[]>;
  getShop(slug: string): Promise<(Shop & { pieces: Piece[] }) | null>;
}
