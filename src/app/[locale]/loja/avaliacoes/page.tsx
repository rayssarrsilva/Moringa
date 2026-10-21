import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ReviewList } from '@/components/reviews/review-list';
import { Stars } from '@/components/reviews/stars';
import type { Locale } from '@/i18n/routing';
import { reviewsRepository } from '@/lib/reviews';
import { ratingSummary } from '@/lib/reviews/rules';
import { sellerRepository } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Reviews' });
  return { title: t('sellerTitle'), robots: { index: false } };
}

/** US-16: what buyers said about the maker's pieces. */
export default async function SellerReviewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  if (!(await sellerRepository().getShop(viewer))) redirect(`/${locale}/loja/comecar`);

  const [reviews, t, ts] = await Promise.all([
    reviewsRepository().forShop(viewer),
    getTranslations('Reviews'),
    getTranslations('Seller'),
  ]);
  const { average, count } = ratingSummary(reviews.map((r) => r.rating));
  const averageText = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(average);

  return (
    <div className="container-page grid max-w-4xl gap-6 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs
          locale={locale}
          items={[{ label: ts('title'), href: '/loja' }, { label: t('sellerTitle') }]}
        />
        <h1 className="text-heading-md md:text-display">{t('sellerTitle')}</h1>
        <p className="text-lg text-text-secondary">{t('sellerIntro')}</p>
        {count > 0 && (
          <p className="flex items-center gap-2">
            <Stars rating={average} label={t('stars', { rating: averageText })} size={22} />
            <span className="text-label">{t('summary', { average: averageText, count })}</span>
          </p>
        )}
      </div>
      {count === 0 ? (
        <p className="rounded-xl border-[1.5px] border-border-subtle p-6 text-text-secondary">
          {t('sellerEmpty')}
        </p>
      ) : (
        <ReviewList reviews={reviews} locale={locale} showPiece />
      )}
    </div>
  );
}
