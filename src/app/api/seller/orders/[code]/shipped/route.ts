import { z } from 'zod';
import { shopOrders } from '@/lib/seller';
import { respond } from '@/lib/seller/orders-api';
import { sellerViewer } from '@/lib/seller/viewer';

const body = z.object({ trackingCode: z.string().max(40) });

/** The maker ships the order with a Correios tracking code: preparing → shipped (US-14). */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const viewer = await sellerViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid_tracking' }, { status: 422 });
  return respond(
    await shopOrders().markShipped(viewer, (await params).code, parsed.data.trackingCode),
  );
}
