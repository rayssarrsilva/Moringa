import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PieceWizardLoader } from '@/components/seller/piece-wizard-loader';
import type { Locale } from '@/i18n/routing';
import { sellerRepository } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Seller' });
  return { title: t('wizardTitle'), robots: { index: false } };
}

export default async function NewPiecePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  const shop = await sellerRepository().getShop(viewer);
  if (!shop) redirect(`/${locale}/loja/comecar`);
  const t = await getTranslations('Seller');

  return (
    <div className="container-page grid max-w-4xl gap-8 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs
          locale={locale}
          items={[{ label: t('title'), href: '/loja' }, { label: t('wizardTitle') }]}
        />
        <h1 className="text-heading-md md:text-display">{t('wizardTitle')}</h1>
      </div>
      <PieceWizardLoader
        shop={{ slug: shop.slug, name: shop.name, city: shop.city, state: shop.state }}
      />
    </div>
  );
}
