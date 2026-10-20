import { currentViewer } from '@/auth';
import { buyerOrders } from '@/lib/orders/buyer';

const noStore = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const viewer = await currentViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401, headers: noStore });
  return Response.json(await buyerOrders().listForBuyer(viewer), { headers: noStore });
}
