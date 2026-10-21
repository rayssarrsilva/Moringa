import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShopForm } from '@/components/seller/shop-form';
import type { Locale } from '@/i18n/routing';
import { sellerRepository } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Seller' });
  return { title: t('onboardingTitle'), robots: { index: false } };
}

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  if (await sellerRepository().getShop(viewer)) redirect(`/${locale}/loja`);
  const t = await getTranslations('Seller');

  return (
    <div className="container-page grid max-w-3xl gap-8 pb-16 pt-10 md:pt-14">
      <div className="grid gap-3">
        <h1 className="text-heading-md md:text-display">{t('onboardingTitle')}</h1>
        <p className="max-w-[60ch] text-lg text-text-secondary">{t('onboardingIntro')}</p>
        <p className="text-sm text-text-secondary">{t('demoNote')}</p>
      </div>
      <ShopForm />
    </div>
  );
}
