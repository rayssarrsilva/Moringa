import { currentViewer } from '@/auth';
import { buyerOrders } from '@/lib/orders/buyer';

/** The buyer confirms the package arrived: shipped → delivered. */
export async function POST(_request: Request, { params }: { params: Promise<{ code: string }> }) {
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
