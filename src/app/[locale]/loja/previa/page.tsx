import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PreviewBanner } from '@/components/seller/preview-banner';
import { ShopProfile } from '@/components/shop-profile';
import type { Locale } from '@/i18n/routing';
import { sellerRepository } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale }> };

export const metadata: Metadata = { robots: { index: false } };

/** The maker's shop page exactly as buyers would see it, including pieces only this session sees. */
export default async function ShopPreviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  const repo = sellerRepository();
  const shop = await repo.getShop(viewer);
  if (!shop) redirect(`/${locale}/loja/comecar`);
  const pieces = await repo.listPieces(viewer);

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-12 pb-16 pt-6 md:pt-10">
      <PreviewBanner visibility={shop.visibility} />
      <ShopProfile
        shop={shop}
        pieces={pieces}
        locale={locale}
        pieceHref={(slug) => {
          const piece = pieces.find((p) => p.slug === slug);
          return piece?.visibility === 'public' ? `/pecas/${slug}` : `/loja/pecas/${slug}`;
        }}
      />
    </div>
  );
}
