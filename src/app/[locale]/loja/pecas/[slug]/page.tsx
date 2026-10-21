import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PieceDetails } from '@/components/piece-details';
import { PreviewBanner } from '@/components/seller/preview-banner';
import type { Locale } from '@/i18n/routing';
import { sellerRepository } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export const metadata: Metadata = { robots: { index: false } };

/** A maker's piece as buyers see it. Public pieces go to their public page. */
export default async function PiecePreviewPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  const repo = sellerRepository();
  const [piece, shop, t] = await Promise.all([
    repo.getPiece(viewer, slug),
    repo.getShop(viewer),
    getTranslations('Seller'),
  ]);
  if (!piece) notFound();
  if (piece.visibility === 'public') redirect(`/${locale}/pecas/${slug}`);

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-12 pb-16 pt-6 md:pt-10">
      <PreviewBanner visibility={piece.visibility} />
      <PieceDetails
        piece={piece}
        shop={shop}
        locale={locale}
        shopHref="/loja/previa"
        action={<p className="rounded-lg bg-bg-surface p-4 text-sm">{t('previewAction')}</p>}
      />
    </div>
  );
}
