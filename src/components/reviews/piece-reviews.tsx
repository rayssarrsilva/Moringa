import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { ratingSummary } from '@/lib/reviews/rules';
import type { PublicReview } from '@/lib/reviews/types';
import { ReviewList } from './review-list';
import { Stars } from './stars';

export async function PieceReviews({
  reviews,
  locale,
}: {
  reviews: PublicReview[];
  locale: Locale;
}) {
  const t = await getTranslations('Reviews');
  const { average, count } = ratingSummary(reviews.map((r) => r.rating));
  const averageText = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(average);

  return (
    <section aria-labelledby="reviews-title" className="grid gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="reviews-title" className="text-heading-sm">
          {t('title')}
        </h2>
        {count > 0 && (
          <p className="flex items-center gap-2">
            <Stars rating={average} label={t('stars', { rating: averageText })} />
            <span className="text-sm text-text-secondary">
              {t('summary', { average: averageText, count })}
            </span>
          </p>
        )}
      </div>
      {count === 0 ? (
        <p className="text-text-secondary">{t('empty')}</p>
      ) : (
        <ReviewList reviews={reviews} locale={locale} />
      )}
    </section>
  );
}
