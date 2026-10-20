import type { NextRequest } from 'next/server';
import { catalog } from '@/lib/catalog';
import { parseCatalogQuery } from '@/lib/catalog/query';

/**
 * Public, read-only catalog API. Takes the same params as the catalog page:
 * GET /api/pieces?regiao=nordeste&material=palha&preco_max=150&ordem=menor-preco
 */
export async function GET(request: NextRequest) {
  const query = parseCatalogQuery(Object.fromEntries(request.nextUrl.searchParams));
  const pieces = await catalog().listPieces(query);
  return Response.json(
    { count: pieces.length, query, pieces },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
