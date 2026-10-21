import { sampleRepository as catalog } from '../catalog/sample-repository';
import { makers } from '../sample-catalog';
import { regionForState, slugify } from './schema';
import type { SellerPiece, SellerRepository, SellerShop, SellerViewer } from './types';

/** Without a database, what a demo session creates lives in memory, per session. */
type SessionData = { shop?: SellerShop; pieces: SellerPiece[] };
const store = globalThis as typeof globalThis & { __moringaSellerDemo?: Map<string, SessionData> };
const sessions = (store.__moringaSellerDemo ??= new Map<string, SessionData>());
const session = (sid: string) => sessions.get(sid) ?? sessions.set(sid, { pieces: [] }).get(sid)!;

/** Demo sellers whose shop already exists in the sample catalog, by email. */
const existingShopOf = (email: string) =>
  makers.find((m) => `${m.slug}@demo.moringa.dev` === email.toLowerCase())?.slug;

async function baseShop(viewer: SellerViewer): Promise<SellerShop | null> {
  const slug = existingShopOf(viewer.email);
  if (!slug) return null;
  const shop = await catalog.getShop(slug);
  if (!shop) return null;
  return {
    slug: shop.slug,
    name: shop.name,
    city: shop.city,
    state: shop.state,
    region: shop.region,
    craft: shop.craft,
    story: shop.story,
    quote: shop.quote,
    visibility: 'public',
  };
}

export const sampleSellerRepository: SellerRepository = {
  async getShop(viewer) {
    return (await baseShop(viewer)) ?? session(viewer.sid).shop ?? null;
  },

  async createShop(viewer, input) {
    if (await this.getShop(viewer)) return { ok: false, reason: 'exists' };
    const shop: SellerShop = {
      slug: `${slugify(input.name)}-${viewer.sid.slice(0, 6)}`,
      name: input.name,
      city: input.city,
      state: input.state,
      region: regionForState(input.state),
      craft: { pt: input.craft, en: input.craftEn ?? input.craft },
      story: { pt: input.story, en: input.storyEn ?? input.story },
      quote: input.quote ? { pt: input.quote, en: input.quote } : null,
      visibility: 'onlyYou',
    };
    session(viewer.sid).shop = shop;
    return { ok: true, shop };
  },

  async listPieces(viewer) {
    const shop = await this.getShop(viewer);
    if (!shop) return [];
    const own = session(viewer.sid).pieces;
    const published =
      shop.visibility === 'public'
        ? (await catalog.getShop(shop.slug))!.pieces.map((p) => ({
            ...p,
            visibility: 'public' as const,
          }))
        : [];
    return [...own, ...published];
  },

  async getPiece(viewer, slug) {
    return (await this.listPieces(viewer)).find((p) => p.slug === slug) ?? null;
  },

  async createPiece(viewer, input) {
    const shop = await this.getShop(viewer);
    if (!shop) return { ok: false, reason: 'no_shop' };
    const piece: SellerPiece = {
      slug: `${slugify(input.name)}-${crypto.randomUUID().slice(0, 6)}`,
      name: { pt: input.name, en: input.name },
      description: { pt: input.description, en: input.description },
      material: input.material,
      priceCents: input.priceCents,
      shippingCents: input.shippingCents,
      stock: input.stock,
      shop: {
        slug: shop.slug,
        name: shop.name,
        city: shop.city,
        state: shop.state,
        region: shop.region,
      },
      visibility: 'onlyYou',
    };
    session(viewer.sid).pieces.unshift(piece);
    return { ok: true, piece };
  },
};
