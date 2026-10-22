import { currentViewer } from '@/auth';
import { buyerOrders } from '@/lib/orders/buyer';
import { guardPost } from '@/lib/security/guard';

/** The buyer confirms the package arrived: shipped → delivered. */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const blocked = await guardPost(request);
  if (blocked) return blocked;
  const viewer = await currentViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const result = await buyerOrders().confirmDelivery(viewer, (await params).code);
  if (!result.ok) {
    return Response.json(
      { error: result.reason },
      { status: result.reason === 'not_found' ? 404 : 409 },
    );
  }
  return Response.json(result.order);
}
