'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Textarea } from '@rayssarrsilva/ipe';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { createShopAction } from '@/app/[locale]/loja/actions';
import { useRouter } from '@/i18n/navigation';
import { regionOf, regions, stateNames, statesByRegion } from '@/lib/regions';
import { type ShopForm as ShopFormValues, type ShopInput, shopSchema } from '@/lib/seller/schema';
import { firstInvalid, selectClass } from './form-styles';

const order = ['name', 'craft', 'city', 'state', 'story', 'quote', 'craftEn', 'storyEn'] as const;

/** US-11: a maker introduces themselves. One schema validates here and again on the server. */
export function ShopForm() {
  const t = useTranslations('Seller');
  const tr = useTranslations('Regions');
  const router = useRouter();
  const [problem, setProblem] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ShopFormValues, unknown, ShopInput>({
    resolver: zodResolver(shopSchema),
    // Validate on submit, then re-validate as the person types (GOV.UK pattern). Never on blur:
    // a message appearing on blur pushes the button down during the click, and the click misses.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    defaultValues: { state: '' as ShopFormValues['state'] },
  });

  const state = useWatch({ control, name: 'state' });
  const region = state ? regionOf(state) : undefined;
  const message = (key?: string) => (key ? t(`errors.${key}` as 'errors.required') : undefined);
  const count = (length: number, max: number) => t('counter', { length, max });

  async function onValid(values: ShopInput) {
    setProblem(null);
    const result = await createShopAction(values);
    if (result.ok || result.error === 'exists') return router.push('/loja?loja=criada');
    setProblem(t('errors.generic'));
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onValid, (invalid) => {
        const first = firstInvalid(order, invalid);
        if (first) setFocus(first);
      })}
      className="grid gap-10"
    >
      {problem && (
        <p role="alert" className="rounded-lg border-[1.5px] border-feedback-danger p-4">
          {problem}
        </p>
      )}

      <fieldset className="grid gap-4">
        <legend className="text-heading-sm mb-4">{t('sectionAbout')}</legend>
        <Input
          label={t('shopName')}
          hint={t('shopNameHint')}
          error={message(errors.name?.message)}
          {...register('name')}
        />
        <Input
          label={t('craft')}
          hint={t('craftHint')}
          error={message(errors.craft?.message)}
          {...register('craft')}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="text-heading-sm mb-4">{t('sectionPlace')}</legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
          <Input
            label={t('city')}
            autoComplete="address-level2"
            error={message(errors.city?.message)}
            {...register('city')}
          />
          <div className="grid content-start gap-1.5">
            <label htmlFor="shop-state" className="text-label">
              {t('state')}
            </label>
            <select
              id="shop-state"
              aria-invalid={errors.state ? true : undefined}
              aria-describedby={errors.state ? 'shop-state-error' : 'shop-region'}
              className={selectClass}
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
            {errors.state ? (
              <p id="shop-state-error" className="text-sm text-feedback-danger">
                {message(errors.state.message)}
              </p>
            ) : (
              <p id="shop-region" className="min-h-5 text-sm text-text-secondary">
                {region && t('region', { region: tr(region) })}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="text-heading-sm mb-4">{t('sectionStory')}</legend>
        <Textarea
          label={t('story')}
          hint={t('storyHint')}
          rows={6}
          maxLength={600}
          showCount
          formatCount={count}
          error={message(errors.story?.message)}
          {...register('story')}
        />
        <Input
          label={t('quote')}
          hint={t('quoteHint')}
          maxLength={160}
          error={message(errors.quote?.message)}
          {...register('quote')}
        />
        <details className="rounded-xl border-[1.5px] border-border-subtle p-4 [&[open]>summary]:mb-4">
          <summary className="text-label min-h-11 cursor-pointer content-center">
            {t('english')}
          </summary>
          <div className="grid gap-4">
            <p className="text-sm text-text-secondary">{t('englishHint')}</p>
            <Input
              label={t('craftEn')}
              lang="en"
              error={message(errors.craftEn?.message)}
              {...register('craftEn')}
            />
            <Textarea
              label={t('storyEn')}
              lang="en"
              rows={5}
              maxLength={600}
              showCount
              formatCount={count}
              error={message(errors.storyEn?.message)}
              {...register('storyEn')}
            />
          </div>
        </details>
      </fieldset>

      <div>
        <Button type="submit" size="lg" loading={isSubmitting}>
          {t('createShop')}
        </Button>
      </div>
    </form>
  );
}
