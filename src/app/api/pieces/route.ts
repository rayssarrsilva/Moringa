import type { NextRequest } from 'next/server';
import { catalog } from '@/lib/catalog';
import { parseCatalogQuery } from '@/lib/catalog/query';

const slugPattern = /^[a-z0-9-]{1,120}$/;

/**
 * Public, read-only catalog API. Takes the same params as the catalog page:
 * GET /api/pieces?regiao=nordeste&material=palha&preco_max=150&ordem=menor-preco
 * Or specific pieces, for favorites: GET /api/pieces?slugs=cesto-de-palha,tigela-de-ceramica
 * (only pieces on sale come back: a paused or missing piece is simply absent).
 */
export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get('slugs');
  if (slugsParam !== null) {
    const slugs = [...new Set(slugsParam.split(','))]
      .filter((s) => slugPattern.test(s))
      .slice(0, 50);
    const pieces = await catalog().getPiecesBySlugs(slugs);
    return Response.json(
      { count: pieces.length, pieces },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
    );
  }
  const query = parseCatalogQuery(Object.fromEntries(request.nextUrl.searchParams));
  const pieces = await catalog().listPieces(query);
  return Response.json(
    { count: pieces.length, query, pieces },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
