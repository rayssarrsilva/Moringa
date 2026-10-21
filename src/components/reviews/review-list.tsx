import { Badge } from '@rayssarrsilva/ipe';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import type { PublicReview } from '@/lib/reviews/types';
import { Stars } from './stars';

/** Reviews as people wrote them. Comments are kept in Portuguese, marked with lang="pt". */
export async function ReviewList({
  reviews,
  locale,
  showPiece = false,
}: {
  reviews: PublicReview[];
  locale: Locale;
  showPiece?: boolean;
}) {
  const t = await getTranslations('Reviews');
  return (
    <ul className="grid gap-4">
      {reviews.map((r) => (
        <li
          key={`${r.piece.slug}-${r.createdAt}-${r.author}`}
          className="grid gap-2 rounded-xl border-[1.5px] border-border-subtle p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex flex-wrap items-center gap-3">
              <Stars rating={r.rating} label={t('stars', { rating: r.rating })} />
              <span className="text-label">{r.author}</span>
            </span>
            <span className="text-sm text-text-secondary">{formatDate(r.createdAt, locale)}</span>
          </div>
          {showPiece && (
            <p className="text-sm text-text-secondary">
              {t('on', { piece: r.piece.name[locale] })}
            </p>
          )}
          {r.comment && (
            <blockquote lang="pt" className="max-w-[64ch]">
              {r.comment}
            </blockquote>
          )}
          {r.visibility === 'onlyYou' && (
            <div>
              <Badge tone="info" dot>
                {t('onlyYou')}
              </Badge>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
