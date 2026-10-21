import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FavoritesList } from '@/components/favorites/favorites-list';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Favorites' });
  return { title: t('title'), robots: { index: false } };
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Favorites');
  return (
    <div className="container-page grid max-w-4xl gap-6 pb-16 pt-10 md:pt-14">
      <h1 className="text-heading-md md:text-display">{t('title')}</h1>
      <FavoritesList />
    </div>
  );
}
