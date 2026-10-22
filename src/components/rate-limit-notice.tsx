import { getTranslations } from 'next-intl/server';

/** Shown after a rate-limited sign-in, which comes back with ?limite=1. */
export async function RateLimitNotice() {
  const t = await getTranslations('Security');
  return (
    <p role="alert" className="rounded-lg border-[1.5px] border-feedback-danger p-4">
      {t('rateLimited')}
    </p>
  );
}
