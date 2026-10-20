/**
 * Fills the database with the demo makers, pieces and one buyer.
 * Run with: npm run db:seed (after npm run db:push). Safe to run again: it clears demo data first.
 */
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

const { eq } = await import('drizzle-orm');
const { db, schema } = await import('./index');
const { makers, pieces } = await import('../lib/sample-catalog');

const database = db();

console.log('Clearing demo data…');
await database.delete(schema.users).where(eq(schema.users.isDemo, true));

const [buyer] = await database
  .insert(schema.users)
  .values({ name: 'Marina', email: 'marina@demo.moringa.dev', role: 'buyer', isDemo: true })
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
  pieces.map((p) => ({
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
  })),
);

console.log(`Seeded ${makers.length} makers, ${pieces.length} pieces and buyer ${buyer!.name}.`);
