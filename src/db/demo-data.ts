import { eq, inArray, or } from 'drizzle-orm';
import { demoBuyer } from '../lib/orders/sample-orders';
import { makers, pieces } from '../lib/sample-catalog';
import type { Database } from './index';
import * as schema from './schema';

/**
 * Clears and recreates the demo makers, pieces and buyer. Used by `npm run db:seed`
 * and by the database integration tests, so both run on exactly the same data.
 */
export async function seedDemoData(database: Database, now = Date.now()) {
  const demoUsers = database
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.isDemo, true));
  const demoShops = database
    .select({ id: schema.shops.id })
    .from(schema.shops)
    .where(inArray(schema.shops.ownerId, demoUsers));
  // Orders point at users and pieces without cascading, so they go first (items and reviews cascade).
  await database
    .delete(schema.orders)
    .where(or(inArray(schema.orders.buyerId, demoUsers), inArray(schema.orders.shopId, demoShops)));
  await database.delete(schema.users).where(eq(schema.users.isDemo, true));

  const [buyer] = await database
    .insert(schema.users)
    .values({ name: demoBuyer.name, email: demoBuyer.email, role: 'buyer', isDemo: true })
    .returning();

  const shopIds = new Map<string, string>();
  for (const m of makers) {
    const [owner] = await database
      .insert(schema.users)
      .values({ name: m.name, email: `${m.slug}@demo.moringa.dev`, role: 'seller', isDemo: true })
      .returning();
    const [shop] = await database
      .insert(schema.shops)
      .values({
        slug: m.slug,
        ownerId: owner!.id,
        name: m.name,
        craftPt: m.craft.pt,
        craftEn: m.craft.en,
        storyPt: m.story.pt,
        storyEn: m.story.en,
        quotePt: m.quote.pt,
        quoteEn: m.quote.en,
        city: m.city,
        state: m.state,
        region: m.region,
        tint: m.tint,
      })
      .returning();
    shopIds.set(m.slug, shop!.id);
  }

  await database.insert(schema.pieces).values(
    pieces.map((p, i) => ({
      slug: p.slug,
      shopId: shopIds.get(p.maker)!,
      namePt: p.name.pt,
      nameEn: p.name.en,
      descriptionPt: p.description.pt,
      descriptionEn: p.description.en,
      material: p.material,
      priceCents: p.priceCents,
      shippingCents: p.shippingCents,
      stock: p.stock,
      status: 'published' as const,
      tint: p.tint,
      // One minute apart, in file order, so "newest first" matches the sample catalog.
      createdAt: new Date(now - i * 60_000),
    })),
  );

  return { buyer: buyer!, makers: makers.length, pieces: pieces.length };
}
