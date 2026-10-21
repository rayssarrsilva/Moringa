import { Badge } from '@rayssarrsilva/ipe';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { systemStatus } from '@/lib/status';

type Props = { params: Promise<{ locale: Locale }> };

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false } };

const tone = { ok: 'success', off: 'neutral', error: 'danger' } as const;

export default async function StatusPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [checks, t] = await Promise.all([systemStatus(), getTranslations('Status')]);

  return (
    <div className="container-page grid max-w-3xl gap-8 pb-16 pt-10 md:pt-14">
      <div className="grid gap-3">
        <h1 className="text-heading-md md:text-display">{t('title')}</h1>
        <p className="text-lg text-text-secondary">{t('intro')}</p>
      </div>
      <ul className="grid gap-3">
        {checks.map((c) => (
          <li key={c.id} className="grid gap-2 rounded-xl border-[1.5px] border-border-subtle p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-label">{t(`${c.id}.name`)}</h2>
              <Badge tone={tone[c.state]} dot>
                {t(`state.${c.state}`)}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary">{t(`${c.id}.${c.state}`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
