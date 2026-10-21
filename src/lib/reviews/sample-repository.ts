import { sampleRepository as catalog } from '../catalog/sample-repository';
import { daysAgo } from '../orders/sample-orders';
import { sampleBuyerRepository } from '../orders/sample-buyer-repository';
import { makers } from '../sample-catalog';
import { canReview, publicName } from './rules';
import { sampleReviews } from './sample-reviews';
import { demoReviews } from './sample-store';
import type { PublicReview, ReviewsRepository } from './types';

const loadedAt = Date.now();

const withoutShop = (r: PublicReview & { shop: string }): PublicReview => ({
  author: r.author,
  rating: r.rating,
  comment: r.comment,
  createdAt: r.createdAt,
  piece: r.piece,
  visibility: r.visibility,
});

async function publicReviews(): Promise<(PublicReview & { shop: string })[]> {
  const pieces = await catalog.listPieces({ sort: 'new' });
  return sampleReviews
    .map((r) => {
      const piece = pieces.find((p) => p.slug === r.piece)!;
      return {
        author: publicName(r.buyer.name),
        rating: r.rating,
        comment: r.comment,
        createdAt: daysAgo(r.daysAgo, loadedAt)!.toISOString(),
        piece: { slug: piece.slug, name: piece.name },
        shop: piece.shop.slug,
        visibility: 'public' as const,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const shopOf = (email: string) =>
  makers.find((m) => `${m.slug}@demo.moringa.dev` === email.toLowerCase())?.slug;

export const sampleReviewsRepository: ReviewsRepository = {
  async forPiece(slug) {
    return (await publicReviews()).filter((r) => r.piece.slug === slug).map(withoutShop);
  },

  async forShop(viewer) {
    const shop = shopOf(viewer.email);
    if (!shop) return [];
    const mine = demoReviews
      .filter((r) => r.sid === viewer.sid && r.shop === shop)
      .map((r) => ({
        author: r.author,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        piece: { slug: r.piece, name: r.pieceName },
        visibility: 'onlyYou' as const,
      }));
    const all = [
      ...mine,
      ...(await publicReviews()).filter((r) => r.shop === shop).map(withoutShop),
    ];
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(viewer, code, input) {
    const order = await sampleBuyerRepository.getForBuyer(viewer, code);
    if (!order) return { ok: false, reason: 'not_found' };
    const refusal = canReview(order, input.piece);
    if (refusal) return { ok: false, reason: refusal };
    const item = order.items.find((i) => i.slug === input.piece)!;
    const stored = {
      sid: viewer.sid,
      code,
      piece: item.slug,
      pieceName: item.name,
      shop: order.shop.slug,
      author: 'Marina',
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: new Date().toISOString(),
    };
    demoReviews.push(stored);
    return {
      ok: true,
      review: {
        author: stored.author,
        rating: stored.rating,
        comment: stored.comment,
        createdAt: stored.createdAt,
        piece: { slug: item.slug, name: item.name },
        visibility: 'onlyYou',
      },
    };
  },
};
