import 'server-only';
import { unstable_cache } from 'next/cache';
import { dbRepository } from './db-repository';
import type { CatalogRepository } from './types';

/** Tag for everything a visitor sees in the public catalog. */
export const catalogTag = 'catalog';

const options = { revalidate: 300, tags: [catalogTag] };

/**
 * Pages render per request (each one gets its own CSP nonce), so the catalog data is cached
 * here instead: at most 5 minutes old, and refreshed at once when a maker edits or pauses
 * a piece, or a payment takes stock (see updateTag / revalidateTag calls).
 */
export const cachedRepository: CatalogRepository = {
  listPieces: unstable_cache((q) => dbRepository.listPieces(q), ['catalog:list'], options),
  getPiece: unstable_cache((slug) => dbRepository.getPiece(slug), ['catalog:piece'], options),
  getPiecesBySlugs: unstable_cache(
    (slugs) => dbRepository.getPiecesBySlugs(slugs),
    ['catalog:slugs'],
    options,
  ),
  listShops: unstable_cache(() => dbRepository.listShops(), ['catalog:shops'], options),
  getShop: unstable_cache((slug) => dbRepository.getShop(slug), ['catalog:shop'], options),
};
