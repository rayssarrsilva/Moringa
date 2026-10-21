import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OrderLookup } from '@/components/account/order-lookup';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ codigo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Lookup' });
  return { title: t('title'), robots: { index: false } };
}

export default async function TrackOrderPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ codigo }, t] = await Promise.all([searchParams, getTranslations('Lookup')]);
  const initialCode = /^MOR-[A-Z0-9]{6}$/i.test(codigo ?? '') ? codigo!.toUpperCase() : '';

  return (
    <div className="container-page grid max-w-5xl gap-8 pb-16 pt-10 md:pt-14">
      <div className="grid gap-3">
        <h1 className="text-heading-md md:text-display">{t('title')}</h1>
        <p className="max-w-[60ch] text-lg text-text-secondary">
          {t('intro')}{' '}
          <Link href="/conta" className="text-label text-text-primary underline underline-offset-4">
            {t('signInInstead')}
          </Link>
        </p>
      </div>
      <OrderLookup initialCode={initialCode} />
    </div>
  );
}
