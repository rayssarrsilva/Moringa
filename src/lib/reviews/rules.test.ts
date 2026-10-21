import { describe, expect, it } from 'vitest';
import { canReview, publicName, ratingSummary, reviewSchema } from './rules';

const item = (slug: string, review?: { rating: number }) => ({
  slug,
  name: { pt: slug, en: slug },
  material: 'ceramics' as const,
  unitPriceCents: 100,
  quantity: 1,
  review: review ? { rating: review.rating, comment: null, createdAt: '2026-10-01' } : null,
});

describe('canReview (US-09)', () => {
  it('lets the buyer review a delivered piece once', () => {
    expect(canReview({ status: 'delivered', items: [item('tigela')] }, 'tigela')).toBeNull();
    expect(
      canReview({ status: 'delivered', items: [item('tigela', { rating: 5 })] }, 'tigela'),
    ).toBe('already_reviewed');
  });

  it('waits for the delivery and only accepts pieces from that order', () => {
    expect(canReview({ status: 'shipped', items: [item('tigela')] }, 'tigela')).toBe(
      'not_delivered',
    );
    expect(canReview({ status: 'delivered', items: [item('tigela')] }, 'cesto')).toBe(
      'not_in_order',
    );
  });
});

describe('reviewSchema', () => {
  it('takes 1 to 5 whole stars and an optional comment', () => {
    expect(reviewSchema.parse({ piece: 'x', rating: 5, comment: '  ' })).toEqual({
      piece: 'x',
      rating: 5,
    });
    expect(reviewSchema.safeParse({ piece: 'x', rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ piece: 'x', rating: 4.5 }).success).toBe(false);
    expect(
      reviewSchema.safeParse({ piece: 'x', rating: 5, comment: 'a'.repeat(501) }).success,
    ).toBe(false);
  });
});

describe('publicName', () => {
  it('shows the first name and the last initial only', () => {
    expect(publicName('Carla Mendes')).toBe('Carla M.');
    expect(publicName('João Pedro Alves')).toBe('João A.');
    expect(publicName(' Marina ')).toBe('Marina');
  });
});

describe('ratingSummary', () => {
  it('averages to one decimal', () => {
    expect(ratingSummary([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
    expect(ratingSummary([])).toEqual({ average: 0, count: 0 });
  });
});
