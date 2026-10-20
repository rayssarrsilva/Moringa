import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/ipe';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('NotFound');
  return (
    <section className="container-page grid max-w-2xl gap-4 py-24">
      <h1 className="text-heading-md">{t('title')}</h1>
      <p className="text-lg text-text-secondary">{t('body')}</p>
      <div>
        <Button asChild>
          <Link href="/">{t('back')}</Link>
        </Button>
      </div>
    </section>
  );
}
