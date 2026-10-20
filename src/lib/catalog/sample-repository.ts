import { makers, pieces as samplePieces } from '../sample-catalog';
import type { CatalogQuery, CatalogRepository, Piece, Shop } from './types';

/** Lowercase without accents, so "ceramica" finds "Cerâmica". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const shops: Shop[] = makers.map((m) => ({
  slug: m.slug,
  name: m.name,
  city: m.city,
  state: m.state,
  region: m.region,
  craft: m.craft,
  story: m.story,
  quote: m.quote,
}));

const summary = ({ slug, name, city, state, region }: Shop) => ({
  slug,
  name,
  city,
  state,
  region,
});

/** Sample pieces, newest first (the order they appear in the sample file). */
const pieces: Piece[] = samplePieces.map((p) => ({
  slug: p.slug,
  name: p.name,
  description: p.description,
  material: p.material,
  priceCents: p.priceCents,
  shippingCents: p.shippingCents,
  stock: p.stock,
  shop: summary(shops.find((s) => s.slug === p.maker)!),
}));

/** Applies a catalog query in memory. Mirrors what the database repository does in SQL. */
export function filterPieces(list: Piece[], query: CatalogQuery): Piece[] {
  const q = query.q ? normalize(query.q) : undefined;
  const result = list.filter(
    (p) =>
      (!q ||
        [p.name.pt, p.name.en, p.description.pt, p.description.en, p.shop.name].some((field) =>
          normalize(field).includes(q),
        )) &&
      (!query.region || p.shop.region === query.region) &&
      (!query.state || p.shop.state === query.state) &&
      (!query.material || p.material === query.material) &&
      (query.minPriceCents === undefined || p.priceCents >= query.minPriceCents) &&
      (query.maxPriceCents === undefined || p.priceCents <= query.maxPriceCents),
  );
  if (query.sort === 'price-asc') return result.toSorted((a, b) => a.priceCents - b.priceCents);
  if (query.sort === 'price-desc') return result.toSorted((a, b) => b.priceCents - a.priceCents);
  return result;
}

export const sampleRepository: CatalogRepository = {
  async listPieces(query) {
    return filterPieces(pieces, query);
  },
  async getPiece(slug) {
    return pieces.find((p) => p.slug === slug) ?? null;
  },
  async getPiecesBySlugs(slugs) {
    return pieces.filter((p) => slugs.includes(p.slug));
  },
  async listShops() {
    return shops.map((s) => ({
      ...s,
      pieceCount: pieces.filter((p) => p.shop.slug === s.slug).length,
    }));
  },
  async getShop(slug) {
    const shop = shops.find((s) => s.slug === slug);
    return shop ? { ...shop, pieces: pieces.filter((p) => p.shop.slug === slug) } : null;
  },
};
