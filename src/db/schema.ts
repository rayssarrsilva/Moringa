import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { materials } from '../lib/catalog/types';
import { orderStatuses } from '../lib/order-status';
import { regions } from '../lib/regions';

export const roleEnum = pgEnum('role', ['buyer', 'seller']);
export const regionEnum = pgEnum('region', regions);
export const materialEnum = pgEnum('material', materials);
export const pieceStatusEnum = pgEnum('piece_status', ['draft', 'published', 'paused']);
export const orderStatusEnum = pgEnum('order_status', orderStatuses);

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  image: text('image'),
  role: roleEnum('role').notNull().default('buyer'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: createdAt(),
});

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('owner_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  craftPt: text('craft_pt').notNull(),
  craftEn: text('craft_en').notNull(),
  storyPt: text('story_pt').notNull(),
  storyEn: text('story_en').notNull(),
  quotePt: text('quote_pt'),
  quoteEn: text('quote_en'),
  city: text('city').notNull(),
  state: char('state', { length: 2 }).notNull(),
  region: regionEnum('region').notNull(),
  tint: text('tint').notNull().default('#E5D9C3'),
  /** Created by a demo sign-in: only that session sees it, never the public catalog. */
  demoSessionId: text('demo_session_id'),
  demoExpiresAt: timestamp('demo_expires_at', { withTimezone: true }),
  createdAt: createdAt(),
});

export const pieces = pgTable(
  'pieces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    namePt: text('name_pt').notNull(),
    nameEn: text('name_en').notNull(),
    descriptionPt: text('description_pt').notNull(),
    descriptionEn: text('description_en').notNull(),
    material: materialEnum('material').notNull(),
    priceCents: integer('price_cents').notNull(),
    shippingCents: integer('shipping_cents').notNull().default(0),
    stock: integer('stock').notNull().default(0),
    status: pieceStatusEnum('status').notNull().default('draft'),
    tint: text('tint').notNull().default('#E5D9C3'),
    /** Created by a demo sign-in: only that session sees it, never the public catalog. */
    demoSessionId: text('demo_session_id'),
    demoExpiresAt: timestamp('demo_expires_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('pieces_shop_idx').on(t.shopId),
    index('pieces_status_idx').on(t.status),
    index('pieces_demo_session_idx').on(t.demoSessionId),
    check('pieces_price_positive', sql`${t.priceCents} > 0`),
    check('pieces_stock_non_negative', sql`${t.stock} >= 0`),
  ],
);

export interface AddressSnapshot {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  cep: char('cep', { length: 8 }).notNull(),
  street: text('street').notNull(),
  number: text('number').notNull(),
  complement: text('complement'),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: char('state', { length: 2 }).notNull(),
  createdAt: createdAt(),
});

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id),
    shopId: uuid('shop_id')
      .notNull()
      .references(() => shops.id),
    status: orderStatusEnum('status').notNull().default('pending'),
    subtotalCents: integer('subtotal_cents').notNull(),
    shippingCents: integer('shipping_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    address: jsonb('address').$type<AddressSnapshot>().notNull(),
    trackingCode: text('tracking_code'),
    stripeSessionId: text('stripe_session_id'),
    /**
     * Orders that belong to one demo sign-in. The demo account is shared by every visitor,
     * so each sign-in gets its own copy of the demo orders and only sees those.
     */
    demoSessionId: text('demo_session_id'),
    demoExpiresAt: timestamp('demo_expires_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    preparingAt: timestamp('preparing_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('orders_buyer_idx').on(t.buyerId),
    index('orders_shop_status_idx').on(t.shopId, t.status),
    // One checkout can hold pieces from several makers, so one session id maps to several orders.
    index('orders_stripe_session_idx').on(t.stripeSessionId),
    index('orders_demo_session_idx').on(t.demoSessionId),
    check('orders_total_matches', sql`${t.totalCents} = ${t.subtotalCents} + ${t.shippingCents}`),
  ],
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  pieceId: uuid('piece_id')
    .notNull()
    .references(() => pieces.id),
  name: text('name').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
});

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    pieceId: uuid('piece_id')
      .notNull()
      .references(() => pieces.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    /** Written in a demo session: only that browser sees it, never the public piece page. */
    demoSessionId: text('demo_session_id'),
    demoExpiresAt: timestamp('demo_expires_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    check('reviews_rating_range', sql`${t.rating} between 1 and 5`),
    // One review per piece of an order: a buyer cannot review the same purchase twice (US-09).
    unique('reviews_order_piece_unique').on(t.orderId, t.pieceId),
    index('reviews_piece_idx').on(t.pieceId),
  ],
);

export const favorites = pgTable(
  'favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pieceId: uuid('piece_id')
      .notNull()
      .references(() => pieces.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.pieceId] })],
);

/**
 * Request counters for rate limiting (OWASP ASVS 2.2.1, 11.1.4). One row per action and client,
 * shared by every server instance. The client is a salted hash of the IP: no raw IP is stored.
 */
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text().primaryKey(),
    count: integer().notNull(),
    resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('rate_limits_reset_idx').on(t.resetAt)],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  shop: one(shops, { fields: [users.id], references: [shops.ownerId] }),
  orders: many(orders),
  addresses: many(addresses),
  favorites: many(favorites),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
  pieces: many(pieces),
  orders: many(orders),
}));

export const piecesRelations = relations(pieces, ({ one, many }) => ({
  shop: one(shops, { fields: [pieces.shopId], references: [shops.id] }),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  shop: one(shops, { fields: [orders.shopId], references: [shops.id] }),
  items: many(orderItems),
  review: one(reviews, { fields: [orders.id], references: [reviews.orderId] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  piece: one(pieces, { fields: [orderItems.pieceId], references: [pieces.id] }),
}));
