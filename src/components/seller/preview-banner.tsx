import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Visibility } from '@/lib/seller/types';

/** Says clearly that this is the maker's preview, and who can see it. */
export async function PreviewBanner({ visibility }: { visibility: Visibility }) {
  const t = await getTranslations('Seller');
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-feedback-info p-4"
    >
      <p>
        <span className="text-label">{t('previewBanner')}</span>
        {visibility === 'onlyYou' && <> {t('previewDemo')}</>}
      </p>
      <Link
        href="/loja"
        className="text-label min-h-11 content-center underline underline-offset-4"
      >
        {t('backToShop')}
      </Link>
    </div>
  );
}
