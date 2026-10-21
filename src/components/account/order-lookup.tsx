'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@rayssarrsilva/ipe';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchGuestOrder, orderKeys } from '@/lib/orders/queries';
import { type Lookup, lookupSchema } from '@/lib/orders/lookup';
import { OrderView } from './order-view';

/** Track an order without an account: code + the email used at checkout. */
export function OrderLookup({ initialCode = '' }: { initialCode?: string }) {
  const t = useTranslations('Lookup');
  const queryClient = useQueryClient();
  const [found, setFound] = useState<Lookup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const resultRef = useRef<HTMLHeadingElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Lookup>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { code: initialCode, email: '' },
  });

  // When an order is found, move focus to it so screen readers announce the result.
  useEffect(() => {
    if (found) resultRef.current?.focus();
  }, [found]);

  async function onValid(values: Lookup) {
    setNotFound(false);
    try {
      const order = await fetchGuestOrder(values.code, values);
      queryClient.setQueryData(orderKeys.guest(values.code, values.email), order);
      setFound(values);
    } catch {
      setFound(null);
      setNotFound(true);
    }
  }

  return (
    <div className="grid gap-10">
      <form noValidate onSubmit={handleSubmit(onValid)} className="grid max-w-xl gap-4">
        <Input
          label={t('code')}
          hint={t('codeHint')}
          autoCapitalize="characters"
          error={errors.code && t('codeError')}
          {...register('code')}
        />
        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          hint={t('emailHint')}
          error={errors.email && t('emailError')}
          {...register('email')}
        />
        <div>
          <Button type="submit" loading={isSubmitting}>
            {t('submit')}
          </Button>
        </div>
        <div role="status">
          {notFound && <p className="text-feedback-danger">{t('notFound')}</p>}
        </div>
      </form>

      {found && (
        <section aria-labelledby="lookup-result" className="grid gap-6">
          <h2
            ref={resultRef}
            id="lookup-result"
            tabIndex={-1}
            className="text-heading-md focus:outline-none"
          >
            {t('result', { code: found.code })}
          </h2>
          <OrderView code={found.code} guest={{ email: found.email }} />
        </section>
      )}
    </div>
  );
}
