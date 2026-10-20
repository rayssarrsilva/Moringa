import 'server-only';
import { dbBuyerRepository } from './db-buyer-repository';
import { sampleBuyerRepository } from './sample-buyer-repository';
import type { BuyerOrdersRepository } from './types';

export const buyerOrders = (): BuyerOrdersRepository =>
  process.env.DATABASE_URL ? dbBuyerRepository : sampleBuyerRepository;
