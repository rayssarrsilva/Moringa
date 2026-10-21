import { z } from 'zod';
import type { OrderDetail } from '../orders/types';

export const reviewSchema = z.object({
  piece: z.string().min(1).max(120),
  rating: z.number().int().min(1, 'rating').max(5, 'rating'),
  comment: z
    .string()
    .trim()
    .max(500, 'tooLong')
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export interface ReviewInput {
  piece: string;
  rating: number;
  comment?: string;
}

export type ReviewRefusal = 'not_delivered' | 'not_in_order' | 'already_reviewed';

/** US-09: only after delivery, only pieces from that order, once per piece. */
export function canReview(
  order: Pick<OrderDetail, 'status' | 'items'>,
  piece: string,
): ReviewRefusal | null {
  if (order.status !== 'delivered') return 'not_delivered';
  const item = order.items.find((i) => i.slug === piece);
  if (!item) return 'not_in_order';
  if (item.review) return 'already_reviewed';
  return null;
}

/** "Carla Mendes" → "Carla M.": enough to feel human, not enough to find the person. */
export function publicName(fullName: string): string {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first;
}

export function ratingSummary(ratings: number[]) {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { average: Math.round(average * 10) / 10, count: ratings.length };
}
