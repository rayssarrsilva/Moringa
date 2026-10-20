'use client';

import { useTranslations } from 'next-intl';
import { BagIcon } from '@/components/icons';
import { Link } from '@/i18n/navigation';
import { useBag, useHydrated } from '@/lib/bag/store';

export function BagLink({ className }: { className: string }) {
  const t = useTranslations('Header');
  const hydrated = useHydrated();
  const stored = useBag((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const count = hydrated ? stored : 0;

  return (
    <Link href="/sacola" className={className} aria-label={t('bag', { count })}>
      <BagIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-action-primary px-1 text-[11px] font-semibold text-text-on-accent"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
