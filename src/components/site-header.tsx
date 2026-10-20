import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BagLink } from './bag/bag-link';
import { SearchIcon, UserIcon } from './icons';
import { LocaleSwitcher } from './locale-switcher';

const iconLink =
  'relative inline-flex size-11 items-center justify-center rounded-pill text-text-primary hover:bg-bg-surface';

export function SiteHeader() {
  const t = useTranslations('Header');

  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-canvas/95 backdrop-blur">
      <a
        href="#content"
        className="text-label sr-only rounded-md bg-action-primary px-4 py-3 text-text-on-accent focus:not-sr-only focus:absolute focus:left-4 focus:top-2"
      >
        {t('skip')}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={t('home')} className="text-heading-sm text-text-primary">
          Moringa
        </Link>

        <nav aria-label={t('nav')} className="hidden md:block">
          <ul className="flex items-center gap-8">
            <li>
              <Link href="/pecas" className="text-label hover:underline underline-offset-4">
                {t('pieces')}
              </Link>
            </li>
            <li>
              <Link href="/lojas" className="text-label hover:underline underline-offset-4">
                {t('makers')}
              </Link>
            </li>
            <li>
              <Link href="/loja" className="text-label hover:underline underline-offset-4">
                {t('sell')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center">
          <LocaleSwitcher />
          <Link href="/pecas" className={iconLink} aria-label={t('search')}>
            <SearchIcon />
          </Link>
          <Link href="/conta" className={iconLink} aria-label={t('account')}>
            <UserIcon />
          </Link>
          <BagLink className={iconLink} />
        </div>
      </div>
    </header>
  );
}
