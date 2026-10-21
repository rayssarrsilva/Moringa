import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';
import { db, schema } from '../../db';
import type { CatalogQuery, CatalogRepository, Piece, Shop } from './types';

const { pieces, shops } = schema;

/** Escapes LIKE wildcards so a search for "50%" means the text "50%". */
const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const pieceColumns = {
  slug: pieces.slug,
  namePt: pieces.namePt,
  nameEn: pieces.nameEn,
  descriptionPt: pieces.descriptionPt,
  descriptionEn: pieces.descriptionEn,
  material: pieces.material,
  priceCents: pieces.priceCents,
  shippingCents: pieces.shippingCents,
  stock: pieces.stock,
  shopSlug: shops.slug,
  shopName: shops.name,
  city: shops.city,
  state: shops.state,
  region: shops.region,
};

type PieceRow = {
  [K in keyof typeof pieceColumns]: (typeof pieceColumns)[K]['_']['data'];
};

const toPiece = (r: PieceRow): Piece => ({
  slug: r.slug,
  name: { pt: r.namePt, en: r.nameEn },
  description: { pt: r.descriptionPt, en: r.descriptionEn },
  material: r.material,
  priceCents: r.priceCents,
  shippingCents: r.shippingCents,
  stock: r.stock,
  shop: { slug: r.shopSlug, name: r.shopName, city: r.city, state: r.state, region: r.region },
});

const toShop = (r: typeof shops.$inferSelect): Shop => ({
  slug: r.slug,
  name: r.name,
  city: r.city,
  state: r.state,
  region: r.region,
  craft: { pt: r.craftPt, en: r.craftEn },
  story: { pt: r.storyPt, en: r.storyEn },
  quote: r.quotePt && r.quoteEn ? { pt: r.quotePt, en: r.quoteEn } : null,
});

/** Public catalog: published pieces only, never anything a demo session created. */
const published = and(
  eq(pieces.status, 'published'),
  isNull(pieces.demoSessionId),
  isNull(shops.demoSessionId),
);

function selectPieces(where: SQL | undefined) {
  return db()
    .select(pieceColumns)
    .from(pieces)
    .innerJoin(shops, eq(pieces.shopId, shops.id))
    .where(and(published, where));
}

function conditions(query: CatalogQuery): SQL | undefined {
  const term = query.q ? likeTerm(query.q) : undefined;
  return and(
    term
      ? or(
          ilike(pieces.namePt, term),
          ilike(pieces.nameEn, term),
          ilike(pieces.descriptionPt, term),
          ilike(pieces.descriptionEn, term),
          ilike(shops.name, term),
        )
      : undefined,
    query.region ? eq(shops.region, query.region) : undefined,
    query.state ? eq(shops.state, query.state) : undefined,
    query.material ? eq(pieces.material, query.material) : undefined,
    query.minPriceCents !== undefined ? gte(pieces.priceCents, query.minPriceCents) : undefined,
    query.maxPriceCents !== undefined ? lte(pieces.priceCents, query.maxPriceCents) : undefined,
  );
}

const orderBy = {
  new: [desc(pieces.createdAt), asc(pieces.slug)],
  'price-asc': [asc(pieces.priceCents), asc(pieces.slug)],
  'price-desc': [desc(pieces.priceCents), asc(pieces.slug)],
} as const;

export const dbRepository: CatalogRepository = {
  async listPieces(query) {
    const rows = await selectPieces(conditions(query)).orderBy(...orderBy[query.sort]);
    return rows.map(toPiece);
  },

  async getPiece(slug) {
    const [row] = await selectPieces(eq(pieces.slug, slug)).limit(1);
    return row ? toPiece(row) : null;
  },

  async getPiecesBySlugs(slugs) {
    if (slugs.length === 0) return [];
    const rows = await selectPieces(inArray(pieces.slug, slugs));
    return rows.map(toPiece);
  },

  async listShops() {
    const rows = await db()
      .select({ shop: shops, pieceCount: count(pieces.id) })
      .from(shops)
      .leftJoin(
        pieces,
        and(
          eq(pieces.shopId, shops.id),
          eq(pieces.status, 'published'),
          isNull(pieces.demoSessionId),
        ),
      )
      .where(isNull(shops.demoSessionId))
      .groupBy(shops.id)
      .orderBy(asc(shops.name));
    return rows.map((r) => ({ ...toShop(r.shop), pieceCount: r.pieceCount }));
  },

  async getShop(slug) {
    const [row] = await db()
      .select()
      .from(shops)
      .where(and(eq(shops.slug, slug), isNull(shops.demoSessionId)))
      .limit(1);
    if (!row) return null;
    const rows = await selectPieces(eq(pieces.shopId, row.id)).orderBy(...orderBy.new);
    return { ...toShop(row), pieces: rows.map(toPiece) };
  },
};
