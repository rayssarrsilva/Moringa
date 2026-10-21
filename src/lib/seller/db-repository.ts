import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db, schema } from '../../db';
import { demoLifetimeMs } from '../orders/demo-orders';
import { regionForState, slugify } from './schema';
import {
  englishOr,
  isDemoAccount,
  type SellerPiece,
  type SellerRepository,
  type SellerShop,
  type SellerViewer,
} from './types';

const { pieces, shops, users } = schema;

/** Rows created by a demo session are scoped to it; public rows have no session. */
const visibleTo = (column: typeof shops.demoSessionId | typeof pieces.demoSessionId, sid: string) =>
  or(isNull(column), eq(column, sid));

const demoStamp = (viewer: SellerViewer, now = Date.now()) =>
  isDemoAccount(viewer.email)
    ? { demoSessionId: viewer.sid, demoExpiresAt: new Date(now + demoLifetimeMs) }
    : { demoSessionId: null, demoExpiresAt: null };

const toShop = (r: typeof shops.$inferSelect): SellerShop => ({
  slug: r.slug,
  name: r.name,
  city: r.city,
  state: r.state,
  region: r.region,
  craft: { pt: r.craftPt, en: r.craftEn },
  story: { pt: r.storyPt, en: r.storyEn },
  quote: r.quotePt ? { pt: r.quotePt, en: r.quoteEn ?? r.quotePt } : null,
  visibility: r.demoSessionId ? 'onlyYou' : 'public',
});

export async function shopRow(viewer: Pick<SellerViewer, 'email' | 'sid'>) {
  const [row] = await db()
    .select({ shop: shops })
    .from(shops)
    .innerJoin(users, eq(shops.ownerId, users.id))
    .where(
      and(eq(users.email, viewer.email.toLowerCase()), visibleTo(shops.demoSessionId, viewer.sid)),
    )
    .limit(1);
  return row?.shop ?? null;
}

/** Adds a short suffix when the address is taken, so two "Cesto de palha" never collide. */
async function uniqueSlug(table: typeof shops | typeof pieces, base: string) {
  let slug = base || 'peca';
  while (
    (await db().select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1)).length
  ) {
    slug = `${base}-${crypto.randomUUID().slice(0, 4)}`;
  }
  return slug;
}

export const dbSellerRepository: SellerRepository = {
  async getShop(viewer) {
    const row = await shopRow(viewer);
    return row ? toShop(row) : null;
  },

  async createShop(viewer, input) {
    if (await shopRow(viewer)) return { ok: false, reason: 'exists' };
    const database = db();
    const [owner] = await database
      .insert(users)
      .values({
        name: viewer.name,
        email: viewer.email.toLowerCase(),
        role: 'seller',
        isDemo: isDemoAccount(viewer.email),
      })
      .onConflictDoUpdate({ target: users.email, set: { role: 'seller' } })
      .returning({ id: users.id });
    const [row] = await database
      .insert(shops)
      .values({
        slug: await uniqueSlug(shops, slugify(input.name)),
        ownerId: owner!.id,
        name: input.name,
        craftPt: input.craft,
        craftEn: englishOr(input.craftEn, input.craft),
        storyPt: input.story,
        storyEn: englishOr(input.storyEn, input.story),
        quotePt: input.quote ?? null,
        quoteEn: input.quote ?? null,
        city: input.city,
        state: input.state,
        region: regionForState(input.state),
        ...demoStamp(viewer),
      })
      .returning();
    return { ok: true, shop: toShop(row!) };
  },

  async listPieces(viewer) {
    const shop = await shopRow(viewer);
    if (!shop) return [];
    const rows = await db()
      .select()
      .from(pieces)
      .where(and(eq(pieces.shopId, shop.id), visibleTo(pieces.demoSessionId, viewer.sid)))
      .orderBy(desc(pieces.createdAt));
    return rows.map((p): SellerPiece => ({
      slug: p.slug,
      name: { pt: p.namePt, en: p.nameEn },
      description: { pt: p.descriptionPt, en: p.descriptionEn },
      material: p.material,
      priceCents: p.priceCents,
      shippingCents: p.shippingCents,
      stock: p.stock,
      shop: {
        slug: shop.slug,
        name: shop.name,
        city: shop.city,
        state: shop.state,
        region: shop.region,
      },
      visibility: p.demoSessionId || shop.demoSessionId ? 'onlyYou' : 'public',
      status: p.status,
      editable: !isDemoAccount(viewer.email) || p.demoSessionId === viewer.sid,
    }));
  },

  async getPiece(viewer, slug) {
    return (await this.listPieces(viewer)).find((p) => p.slug === slug) ?? null;
  },

  async createPiece(viewer, input) {
    const shop = await shopRow(viewer);
    if (!shop) return { ok: false, reason: 'no_shop' };
    const slug = await uniqueSlug(pieces, slugify(input.name));
    await db()
      .insert(pieces)
      .values({
        slug,
        shopId: shop.id,
        namePt: input.name,
        nameEn: input.name,
        descriptionPt: input.description,
        descriptionEn: input.description,
        material: input.material,
        priceCents: input.priceCents,
        shippingCents: input.shippingCents,
        stock: input.stock,
        status: 'published',
        ...demoStamp(viewer),
      });
    return { ok: true, piece: (await this.getPiece(viewer, slug))! };
  },

  async updatePiece(viewer, slug, input) {
    const piece = await this.getPiece(viewer, slug);
    if (!piece) return { ok: false, reason: 'not_found' };
    if (!piece.editable) return { ok: false, reason: 'read_only' };
    const shop = (await shopRow(viewer))!;
    await db()
      .update(pieces)
      .set({
        namePt: input.name,
        nameEn: input.name,
        descriptionPt: input.description,
        descriptionEn: input.description,
        material: input.material,
        priceCents: input.priceCents,
        shippingCents: input.shippingCents,
        stock: input.stock,
      })
      .where(and(eq(pieces.slug, slug), eq(pieces.shopId, shop.id)));
    return { ok: true, piece: (await this.getPiece(viewer, slug))! };
  },

  async setPieceStatus(viewer, slug, status) {
    const piece = await this.getPiece(viewer, slug);
    if (!piece) return { ok: false, reason: 'not_found' };
    if (!piece.editable) return { ok: false, reason: 'read_only' };
    const shop = (await shopRow(viewer))!;
    await db()
      .update(pieces)
      .set({ status })
      .where(and(eq(pieces.slug, slug), eq(pieces.shopId, shop.id)));
    return { ok: true, piece: (await this.getPiece(viewer, slug))! };
  },
};
