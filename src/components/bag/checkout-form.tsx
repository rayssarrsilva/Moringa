'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { startCheckout } from '@/app/[locale]/finalizar/actions';
import { Button, Input } from '@rayssarrsilva/ipe';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { bagTotals } from '@/lib/bag/bag';
import { useBag, useHydrated } from '@/lib/bag/store';
import { type AddressInput, addressSchema, maskCep, onlyDigits } from '@/lib/checkout/schema';
import { lookupCep } from '@/lib/checkout/viacep';
import { formatPrice } from '@/lib/format';
import { regions, stateNames, statesByRegion } from '@/lib/regions';
import { BagSummary } from './bag-summary';

const fieldOrder: (keyof AddressInput)[] = [
  'name',
  'email',
  'cep',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
];

type CepStatus = 'idle' | 'looking' | 'found' | 'notFound' | 'offline';
type Problem = 'stock' | 'payment' | 'invalid' | null;

export function CheckoutForm() {
  const t = useTranslations('Checkout');
  const tb = useTranslations('Bag');
  const tr = useTranslations('Regions');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useBag((s) => s.items);
  const setQuantity = useBag((s) => s.setQuantity);

  const [cepStatus, setCepStatus] = useState<CepStatus>('idle');
  const [found, setFound] = useState({ street: '', city: '' });
  const [problem, setProblem] = useState<Problem>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const lookup = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    mode: 'onTouched',
    // We focus the first invalid field in screen order ourselves (see onInvalid).
    shouldFocusError: false,
    defaultValues: { state: '' as AddressInput['state'] },
  });

  useEffect(() => {
    if (problem) problemRef.current?.focus();
  }, [problem]);

  const message = (key?: string) => (key ? t(`errors.${key}` as 'errors.required') : undefined);
  const errorCount = Object.keys(errors).length;

  async function onCepChange(value: string) {
    const masked = maskCep(value);
    setValue('cep', masked);
    lookup.current?.abort();
    if (onlyDigits(masked).length !== 8) return setCepStatus('idle');

    const controller = new AbortController();
    lookup.current = controller;
    setCepStatus('looking');
    try {
      const address = await lookupCep(masked, controller.signal);
      if (controller.signal.aborted) return;
      if (!address) return setCepStatus('notFound');
      const fill = { shouldValidate: true, shouldDirty: true };
      setValue('street', address.street, fill);
      setValue('neighborhood', address.neighborhood, fill);
      setValue('city', address.city, fill);
      setValue('state', address.state as AddressInput['state'], fill);
      setFound({ street: address.street, city: address.city });
      setCepStatus('found');
      setFocus(address.street ? 'number' : 'street');
    } catch {
      if (!controller.signal.aborted) setCepStatus('offline');
    }
  }

  const cep = register('cep');

  /** The first invalid field in the order people see them, not the order they were registered. */
  function onInvalid(invalid: Partial<Record<keyof AddressInput, unknown>>) {
    const first = fieldOrder.find((name) => invalid[name]);
    if (first) setFocus(first);
  }

  async function onValid(address: AddressInput) {
    setProblem(null);
    const result = await startCheckout({
      locale,
      items: items.map(({ slug, quantity }) => ({ slug, quantity })),
      address,
    });
    if (result.ok) {
      if (result.url.startsWith('/')) router.push(result.url.replace(`/${locale}`, ''));
      else window.location.assign(result.url);
      return;
    }
    if (result.error === 'stock') {
      for (const p of result.problems) setQuantity(p.slug, p.reason === 'stock' ? p.available : 0);
    }
    setProblem(result.error);
  }

  if (!hydrated) return <p className="text-text-secondary">{tb('loading')}</p>;

  if (items.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-6 md:p-10">
        <p className="text-heading-sm">{tb('emptyTitle')}</p>
        <Button asChild>
          <Link href="/pecas">{tb('browse')}</Link>
        </Button>
      </div>
    );
  }

  const total = formatPrice(bagTotals(items).totalCents, locale);
  const select =
    'min-h-11 w-full rounded-md border-[1.5px] border-border-control bg-bg-canvas px-3 aria-[invalid=true]:border-feedback-danger';

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate className="grid gap-8">
        {problem && (
          <div
            ref={problemRef}
            tabIndex={-1}
            role="alert"
            className="rounded-lg border-[1.5px] border-feedback-danger p-4"
          >
            {problem === 'stock' && (
              <>
                {t('stockProblem')}{' '}
                <Link href="/sacola" className="text-label underline underline-offset-4">
                  {tb('title')}
                </Link>
              </>
            )}
            {problem === 'payment' && t('paymentProblem')}
            {problem === 'invalid' && t('invalidProblem')}
          </div>
        )}
        {submitCount > 0 && errorCount > 0 && (
          <p role="alert" className="text-label text-feedback-danger">
            {t('errorSummary', { count: errorCount })}
          </p>
        )}

        <fieldset className="grid gap-4">
          <legend className="text-heading-sm mb-4">{t('contact')}</legend>
          <Input
            label={t('name')}
            autoComplete="name"
            error={message(errors.name?.message)}
            {...register('name')}
          />
          <Input
            label={t('email')}
            type="email"
            autoComplete="email"
            hint={t('emailHint')}
            error={message(errors.email?.message)}
            {...register('email')}
          />
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-heading-sm mb-4">{t('address')}</legend>
          <div className="grid gap-2 sm:max-w-60">
            <Input
              label={t('cep')}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={9}
              placeholder="00000-000"
              hint={t('cepHint')}
              error={message(errors.cep?.message)}
              {...cep}
              onChange={(event) => {
                void cep.onChange(event);
                void onCepChange(event.target.value);
              }}
            />
          </div>
          <p role="status" className="min-h-6 text-sm">
            {cepStatus === 'looking' && t('cepLooking')}
            {cepStatus === 'found' && t('cepFound', found)}
            {cepStatus === 'notFound' && t('cepNotFound')}
            {cepStatus === 'offline' && t('cepOffline')}
          </p>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Input
              label={t('street')}
              autoComplete="address-line1"
              error={message(errors.street?.message)}
              {...register('street')}
            />
            <Input
              label={t('number')}
              inputMode="numeric"
              error={message(errors.number?.message)}
              {...register('number')}
            />
          </div>
          <Input
            label={t('complement')}
            autoComplete="address-line2"
            error={message(errors.complement?.message)}
            {...register('complement')}
          />
          <Input
            label={t('neighborhood')}
            error={message(errors.neighborhood?.message)}
            {...register('neighborhood')}
          />
          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <Input
              label={t('city')}
              autoComplete="address-level2"
              error={message(errors.city?.message)}
              {...register('city')}
            />
            <div className="grid content-start gap-1.5">
              <label htmlFor="state" className="text-label">
                {t('state')}
              </label>
              <select
                id="state"
                autoComplete="address-level1"
                aria-invalid={errors.state ? true : undefined}
                aria-describedby={errors.state ? 'state-error' : undefined}
                className={select}
                {...register('state')}
              >
                <option value="">{t('chooseState')}</option>
                {regions.map((r) => (
                  <optgroup key={r} label={tr(r)}>
                    {statesByRegion[r].map((uf) => (
                      <option key={uf} value={uf}>
                        {stateNames[uf]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.state && (
                <p id="state-error" className="text-sm text-feedback-danger">
                  {message(errors.state.message)}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="grid gap-3">
          <Button type="submit" size="lg" loading={isSubmitting} fullWidth>
            {isSubmitting ? t('paying') : t('pay', { total })}
          </Button>
          <p className="text-sm text-text-secondary">{t('stripeNote')}</p>
        </div>
      </form>

      <BagSummary items={items}>
        <ul className="grid gap-2 border-t border-border-subtle pt-4 text-sm">
          {items.map((i) => (
            <li key={i.slug} className="flex justify-between gap-4">
              <span>
                {i.quantity} × {i.name[locale]}
              </span>
              <span>{formatPrice(i.priceCents * i.quantity, locale)}</span>
            </li>
          ))}
        </ul>
      </BagSummary>
    </div>
  );
}
