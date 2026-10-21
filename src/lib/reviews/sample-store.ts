import type { Localized } from '../catalog/types';

/** Reviews written in demo sessions without a database, per browser. Shared by both repositories. */
export interface StoredReview {
  sid: string;
  code: string;
  piece: string;
  pieceName: Localized;
  shop: string;
  author: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

const store = globalThis as typeof globalThis & { __moringaDemoReviews?: StoredReview[] };
export const demoReviews = (store.__moringaDemoReviews ??= []);
