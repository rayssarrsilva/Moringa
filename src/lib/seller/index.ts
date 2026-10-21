import 'server-only';
import { dbSellerRepository } from './db-repository';
import { sampleSellerRepository } from './sample-repository';
import { dbShopOrdersRepository } from './db-orders-repository';
import type { ShopOrdersRepository } from './orders-types';
import { sampleShopOrdersRepository } from './sample-orders-repository';
import type { SellerRepository } from './types';

export const sellerRepository = (): SellerRepository =>
  process.env.DATABASE_URL ? dbSellerRepository : sampleSellerRepository;

export const shopOrders = (): ShopOrdersRepository =>
  process.env.DATABASE_URL ? dbShopOrdersRepository : sampleShopOrdersRepository;
