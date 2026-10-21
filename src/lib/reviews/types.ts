import type { Localized } from '../catalog/types';
import type { Visibility } from '../seller/types';
import type { ReviewInput, ReviewRefusal } from './rules';

export interface PublicReview {
  author: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  piece: { slug: string; name: Localized };
  visibility: Visibility;
}

export type CreateReviewResult =
  { ok: true; review: PublicReview } | { ok: false; reason: ReviewRefusal | 'not_found' };

export interface ReviewsRepository {
  /** Public reviews of a piece: never the ones written in a demo session. */
  forPiece(slug: string): Promise<PublicReview[]>;
  /** Reviews of the maker's pieces (US-16). Demo makers also see their browser's demo reviews. */
  forShop(viewer: { email: string; sid: string }): Promise<PublicReview[]>;
  create(
    viewer: { email: string; sid: string },
    code: string,
    input: ReviewInput,
  ): Promise<CreateReviewResult>;
}
