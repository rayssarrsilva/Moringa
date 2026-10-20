import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BagView } from '@/components/bag/bag-view';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Bag' });
  return { title: t('title'), robots: { index: false } };
}

export default async function BagPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-page pb-16 pt-6 md:pt-10">
      <BagView />
    </div>
  );
}
