import { buyerOrders } from '@/lib/orders/buyer';
import { guestViewer, lookupSchema } from '@/lib/orders/lookup';
import { guardPost } from '@/lib/security/guard';

/** A guest confirms the package arrived, with the same code + email proof. */
export async function POST(request: Request) {
  const blocked = await guardPost(request, 'lookup');
  if (blocked) return blocked;
  const parsed = lookupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'not_found' }, { status: 404 });
  const result = await buyerOrders().confirmDelivery(guestViewer(parsed.data), parsed.data.code);
  if (!result.ok) {
    return Response.json(
      { error: result.reason },
      { status: result.reason === 'not_found' ? 404 : 409 },
    );
  }
  return Response.json(result.order);
}
