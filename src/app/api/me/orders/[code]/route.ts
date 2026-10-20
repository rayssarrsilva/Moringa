import { currentViewer } from '@/auth';
import { buyerOrders } from '@/lib/orders/buyer';

const noStore = { 'Cache-Control': 'private, no-store' };

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const viewer = await currentViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401, headers: noStore });
  const order = await buyerOrders().getForBuyer(viewer, (await params).code);
  if (!order) return Response.json({ error: 'not_found' }, { status: 404, headers: noStore });
  return Response.json(order, { headers: noStore });
}
