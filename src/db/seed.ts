/**
 * Fills the database with the demo makers, pieces and one buyer.
 * Run with: npm run db:seed (after npm run db:push). Safe to run again: it clears demo data first.
 * Marina's orders are not seeded: each demo sign-in gets its own copy (src/lib/orders/demo-orders.ts).
 */
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });

const { db } = await import('./index');
const { seedDemoData } = await import('./demo-data');

console.log('Clearing demo data…');
const result = await seedDemoData(db());
console.log(
  `Seeded ${result.makers} makers, ${result.pieces} pieces and buyer ${result.buyer.name}.`,
);
