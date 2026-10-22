import { shopOrders } from '@/lib/seller';
import { respond } from '@/lib/seller/orders-api';
import { sellerViewer } from '@/lib/seller/viewer';
import { guardPost } from '@/lib/security/guard';

/** The maker starts preparing a paid order: paid → preparing. */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const blocked = await guardPost(request);
  if (blocked) return blocked;
  const viewer = await sellerViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return respond(await shopOrders().startPreparing(viewer, (await params).code));
}
