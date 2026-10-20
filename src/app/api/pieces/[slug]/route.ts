import { catalog } from '@/lib/catalog';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const piece = await catalog().getPiece(slug);
  if (!piece) {
    return Response.json(
      { error: 'not_found', message: `No piece with slug "${slug}"` },
      { status: 404 },
    );
  }
  return Response.json(piece, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
