import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations('Footer');

  return (
    <footer className="mt-24 border-t border-border-subtle bg-bg-surface">
      <div className="container-page grid gap-6 py-12 md:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <p className="text-heading-sm">Moringa</p>
          <p className="text-text-secondary">{t('tagline')}</p>
          <p className="text-sm text-text-secondary">{t('demo')}</p>
        </div>
        <ul className="grid content-start gap-2 text-label">
          <li>
            <Link className="underline underline-offset-4" href="/pedido/acompanhar">
              {t('track')}
            </Link>
          </li>
          <li>
            <a
              className="underline underline-offset-4"
              href="https://github.com/rayssarrsilva/Moringa"
            >
              {t('code')}
            </a>
          </li>
          <li>
            <a
              className="underline underline-offset-4"
              href="https://www.figma.com/design/o3irY2VOsGjlLt3fiAPTU0"
            >
              {t('design')}
            </a>
          </li>
          <li className="font-normal text-text-secondary">{t('madeBy')}</li>
        </ul>
      </div>
    </footer>
  );
}
