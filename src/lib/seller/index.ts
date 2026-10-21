import 'server-only';
import { dbSellerRepository } from './db-repository';
import { sampleSellerRepository } from './sample-repository';
import type { SellerRepository } from './types';

export const sellerRepository = (): SellerRepository =>
  process.env.DATABASE_URL ? dbSellerRepository : sampleSellerRepository;
