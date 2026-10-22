import { currentViewer } from '@/auth';
import { reviewsRepository } from '@/lib/reviews';
import { reviewSchema } from '@/lib/reviews/rules';
import { guardPost } from '@/lib/security/guard';

const status = {
  not_found: 404,
  not_delivered: 409,
  not_in_order: 422,
  already_reviewed: 409,
} as const;

/** The buyer reviews a piece of a delivered order (US-09). */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const blocked = await guardPost(request);
  if (blocked) return blocked;
  const viewer = await currentViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 422 });
  const result = await reviewsRepository().create(viewer, (await params).code, parsed.data);
  return result.ok
    ? Response.json(result.review, { status: 201 })
    : Response.json({ error: result.reason }, { status: status[result.reason] });
}
