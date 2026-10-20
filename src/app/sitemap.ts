import type { MetadataRoute } from 'next';
import { catalog } from '@/lib/catalog';
import { siteUrl } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pieces, shops] = await Promise.all([
    catalog().listPieces({ sort: 'new' }),
    catalog().listShops(),
  ]);
  const paths = [
    '',
    '/pecas',
    '/lojas',
    ...pieces.map((p) => `/pecas/${p.slug}`),
    ...shops.map((s) => `/lojas/${s.slug}`),
  ];
  return paths.map((path) => ({
    url: `${siteUrl()}/pt${path}`,
    changeFrequency: path.startsWith('/pecas/') ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path.split('/').length > 2 ? 0.7 : 0.8,
    alternates: { languages: { 'pt-BR': `${siteUrl()}/pt${path}`, en: `${siteUrl()}/en${path}` } },
  }));
}
