import { buyerOrders } from '@/lib/orders/buyer';
import { guestViewer, lookupSchema } from '@/lib/orders/lookup';
import { guardPost } from '@/lib/security/guard';

const noStore = { 'Cache-Control': 'private, no-store' };
const notFound = () => Response.json({ error: 'not_found' }, { status: 404, headers: noStore });

/**
 * Order tracking without an account. POST keeps the email out of URLs and logs.
 * A wrong code and a wrong email get the same answer, so the API never confirms a code exists.
 */
export async function POST(request: Request) {
  const blocked = await guardPost(request, 'lookup');
  if (blocked) return blocked;
  const parsed = lookupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return notFound();
  const order = await buyerOrders().getForBuyer(guestViewer(parsed.data), parsed.data.code);
  return order ? Response.json(order, { headers: noStore }) : notFound();
}
