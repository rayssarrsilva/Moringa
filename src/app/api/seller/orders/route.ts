import { shopOrders } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

const noStore = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const viewer = await sellerViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401, headers: noStore });
  return Response.json(await shopOrders().list(viewer), { headers: noStore });
}
