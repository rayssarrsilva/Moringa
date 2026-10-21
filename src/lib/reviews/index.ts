import 'server-only';
import { dbReviewsRepository } from './db-repository';
import { sampleReviewsRepository } from './sample-repository';
import type { ReviewsRepository } from './types';

export const reviewsRepository = (): ReviewsRepository =>
  process.env.DATABASE_URL ? dbReviewsRepository : sampleReviewsRepository;
