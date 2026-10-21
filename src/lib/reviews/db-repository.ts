import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { db, schema } from '../../db';
import { demoLifetimeMs } from '../orders/demo-orders';
import { dbBuyerRepository } from '../orders/db-buyer-repository';
import { shopRow } from '../seller/db-repository';
import { isDemoAccount } from '../seller/types';
import { canReview, publicName } from './rules';
import type { PublicReview, ReviewsRepository } from './types';

const { orders, pieces, reviews, users } = schema;

const columns = {
  rating: reviews.rating,
  comment: reviews.comment,
  createdAt: reviews.createdAt,
  demoSessionId: reviews.demoSessionId,
  author: users.name,
  slug: pieces.slug,
  namePt: pieces.namePt,
  nameEn: pieces.nameEn,
};

interface Row {
  rating: number;
  comment: string | null;
  createdAt: Date;
  demoSessionId: string | null;
  author: string;
  slug: string;
  namePt: string;
  nameEn: string;
}

const toReview = (r: Row): PublicReview => ({
  author: publicName(r.author),
  rating: r.rating,
  comment: r.comment,
  createdAt: r.createdAt.toISOString(),
  piece: { slug: r.slug, name: { pt: r.namePt, en: r.nameEn } },
  visibility: r.demoSessionId ? 'onlyYou' : 'public',
});

const base = () =>
  db()
    .select(columns)
    .from(reviews)
    .innerJoin(pieces, eq(reviews.pieceId, pieces.id))
    .innerJoin(users, eq(reviews.buyerId, users.id));

export const dbReviewsRepository: ReviewsRepository = {
  async forPiece(slug) {
    const rows = await base()
      .where(and(eq(pieces.slug, slug), isNull(reviews.demoSessionId)))
      .orderBy(desc(reviews.createdAt));
    return rows.map(toReview);
  },

  async forShop(viewer) {
    const shop = await shopRow(viewer);
    if (!shop) return [];
    const rows = await base()
      .where(
        and(
          eq(pieces.shopId, shop.id),
          isDemoAccount(viewer.email)
            ? or(isNull(reviews.demoSessionId), eq(reviews.demoSessionId, viewer.sid))
            : isNull(reviews.demoSessionId),
        ),
      )
      .orderBy(desc(reviews.createdAt));
    return rows.map(toReview);
  },

  async create(viewer, code, input) {
    const order = await dbBuyerRepository.getForBuyer(viewer, code);
    if (!order) return { ok: false, reason: 'not_found' };
    const refusal = canReview(order, input.piece);
    if (refusal) return { ok: false, reason: refusal };

    const database = db();
    const [ids] = await database
      .select({ orderId: orders.id, buyerId: orders.buyerId, pieceId: pieces.id })
      .from(orders)
      .innerJoin(pieces, eq(pieces.slug, input.piece))
      .where(eq(orders.code, code))
      .limit(1);
    const demo = isDemoAccount(viewer.email);
    // The unique (order, piece) constraint is the last word if two requests race.
    const inserted = await database
      .insert(reviews)
      .values({
        orderId: ids!.orderId,
        pieceId: ids!.pieceId,
        buyerId: ids!.buyerId,
        rating: input.rating,
        comment: input.comment ?? null,
        demoSessionId: demo ? viewer.sid : null,
        demoExpiresAt: demo ? new Date(Date.now() + demoLifetimeMs) : null,
      })
      .onConflictDoNothing()
      .returning({ id: reviews.id });
    if (inserted.length === 0) return { ok: false, reason: 'already_reviewed' };

    const [row] = await base().where(eq(reviews.id, inserted[0]!.id));
    return { ok: true, review: toReview(row!) };
  },
};
