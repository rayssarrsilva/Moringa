'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Input, Textarea } from '@rayssarrsilva/ipe';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { type FieldPath, useForm } from 'react-hook-form';
import { createPieceAction } from '@/app/[locale]/loja/actions';
import { PiecePhoto } from '@/components/material-art';
import { PieceCard } from '@/components/piece-card';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { materials } from '@/lib/catalog/types';
import { formatPrice } from '@/lib/format';
import { parseReais, type PieceForm, pieceSchema } from '@/lib/seller/schema';
import { firstInvalid, selectClass } from './form-styles';

const steps = ['details', 'pricing', 'preview'] as const;
const stepFields: Record<(typeof steps)[number], FieldPath<PieceForm>[]> = {
  details: ['name', 'material', 'description'],
  pricing: ['price', 'shipping', 'stock'],
  preview: [],
};
const draftKey = 'moringa:piece-draft';

function readDraft(): Partial<PieceForm> | null {
  try {
    const raw = localStorage.getItem(draftKey);
    return raw ? (JSON.parse(raw) as Partial<PieceForm>) : null;
  } catch {
    return null;
  }
}

/**
 * US-12. Each "Continue" validates only the fields on screen; on error, focus goes to
 * the first invalid field. The draft is saved as the maker types, so a reload loses nothing.
 * Rendered only in the browser (see piece-wizard-loader), because the draft lives in localStorage.
 */
export function PieceWizard({
  shop,
}: {
  shop: { slug: string; name: string; city: string; state: string };
}) {
  const t = useTranslations('Seller');
  const tm = useTranslations('Materials');
  const tp = useTranslations('Piece');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [draft] = useState(readDraft);
  const [restored, setRestored] = useState(Boolean(draft));
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const {
    register,
    trigger,
    setFocus,
    getValues,
    setValue,
    getFieldState,
    reset,
    subscribe,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PieceForm>({
    resolver: zodResolver(pieceSchema),
    mode: 'onTouched',
    shouldFocusError: false,
    defaultValues: {
      name: '',
      material: '' as PieceForm['material'],
      description: '',
      price: '',
      shipping: '',
      stock: '1',
      ...draft,
    },
  });

  // Save the draft as the maker types, without re-rendering the form.
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => {
          try {
            localStorage.setItem(draftKey, JSON.stringify(values));
          } catch {
            // Storage full or blocked: the form still works, only the draft is not kept.
          }
        },
      }),
    [subscribe],
  );

  // After moving between steps, take focus to the new step's heading, so screen readers announce it.
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  const current = steps[step]!;
  const message = (key?: string) => (key ? t(`errors.${key}` as 'errors.required') : undefined);
  const goTo = (index: number) => {
    moved.current = true;
    setStep(index);
  };

  async function next() {
    const fields = stepFields[current];
    if (await trigger(fields)) return goTo(step + 1);
    const invalid = fields.filter((f) => getFieldState(f).invalid);
    // Mark them as touched: in "onTouched" mode they now re-validate on every keystroke, so the
    // error clears while the maker types, not on blur. Otherwise the message would vanish on the
    // next click's mousedown, the button would jump up and the click would miss it.
    for (const f of invalid) setValue(f, getValues(f), { shouldTouch: true });
    const first = firstInvalid(invalid, Object.fromEntries(invalid.map((f) => [f, true])));
    if (first) setFocus(first);
  }

  async function publish(values: PieceForm) {
    setProblem(null);
    const result = await createPieceAction(values);
    if (!result.ok) return setProblem(t('errors.generic'));
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    router.push(`/loja?publicada=${result.slug}&nome=${encodeURIComponent(result.name)}`);
  }

  function discard() {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    reset({
      name: '',
      material: '' as PieceForm['material'],
      description: '',
      price: '',
      shipping: '',
      stock: '1',
    });
    setRestored(false);
    goTo(0);
  }

  const values = getValues();
  const priceCents = parseReais(values.price ?? '') ?? 0;
  const shippingCents = parseReais(values.shipping ?? '') ?? 0;
  const stock = Number(values.stock) || 0;

  return (
    <div className="grid gap-8">
      <ol aria-label={t('stepsLabel')} className="grid gap-2 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? 'step' : undefined}
            className={`grid gap-1 border-t-4 pt-2 text-sm ${
              i <= step
                ? 'border-action-primary text-text-primary'
                : 'border-border-subtle text-text-secondary'
            }`}
          >
            <span className="text-caps">
              {t('stepOf', { current: i + 1, total: steps.length })}
            </span>
            <span className="text-label">{t(`steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      {restored && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-lg bg-bg-surface p-4"
        >
          <span>{t('draftRestored')}</span>
          <button
            type="button"
            onClick={discard}
            className="text-label min-h-11 underline underline-offset-4"
          >
            {t('discard')}
          </button>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(publish)} className="grid gap-6">
        <h2 ref={headingRef} tabIndex={-1} className="text-heading-sm focus:outline-none">
          {t('stepOf', { current: step + 1, total: steps.length })}: {t(`steps.${current}`)}
        </h2>

        {problem && (
          <p role="alert" className="rounded-lg border-[1.5px] border-feedback-danger p-4">
            {problem}
          </p>
        )}

        <div hidden={current !== 'details'} className="grid gap-4">
          <Input
            label={t('pieceName')}
            hint={t('pieceNameHint')}
            maxLength={80}
            error={message(errors.name?.message)}
            {...register('name')}
          />
          <div className="grid gap-1.5">
            <label htmlFor="piece-material" className="text-label">
              {t('material')}
            </label>
            <select
              id="piece-material"
              aria-invalid={errors.material ? true : undefined}
              aria-describedby={errors.material ? 'piece-material-error' : undefined}
              className={`${selectClass} sm:max-w-80`}
              {...register('material')}
            >
              <option value="">{t('chooseMaterial')}</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {tm(m)}
                </option>
              ))}
            </select>
            {errors.material && (
              <p id="piece-material-error" className="text-sm text-feedback-danger">
                {message(errors.material.message)}
              </p>
            )}
          </div>
          <Textarea
            label={t('description')}
            hint={t('descriptionHint')}
            rows={5}
            maxLength={600}
            showCount
            formatCount={(length, max) => t('counter', { length, max })}
            // The counter starts from the restored draft; react-hook-form fills the field after mount.
            defaultValue={draft?.description}
            error={message(errors.description?.message)}
            {...register('description')}
          />
        </div>

        <div hidden={current !== 'pricing'} className="grid gap-4 sm:max-w-md">
          <Input
            label={t('price')}
            hint={t('priceHint')}
            inputMode="decimal"
            error={message(errors.price?.message)}
            {...register('price')}
          />
          <Input
            label={t('shipping')}
            hint={t('shippingHint')}
            inputMode="decimal"
            error={message(errors.shipping?.message)}
            {...register('shipping')}
          />
          <Input
            label={t('stock')}
            hint={t('stockHint')}
            inputMode="numeric"
            error={message(errors.stock?.message)}
            {...register('stock')}
          />
        </div>

        {current === 'preview' && (
          <div className="grid gap-8">
            <p className="text-text-secondary">{t('previewIntro')}</p>
            <div className="grid gap-8 md:grid-cols-[220px_1fr]">
              <section aria-labelledby="preview-card" className="grid content-start gap-3">
                <h3 id="preview-card" className="text-caps text-text-secondary">
                  {t('previewCard')}
                </h3>
                <PieceCard
                  slug="previa"
                  href="/loja/pecas/nova"
                  name={values.name}
                  maker={shop.name}
                  place={`${shop.city}, ${shop.state}`}
                  price={formatPrice(priceCents, locale)}
                  material={values.material || 'ceramics'}
                />
              </section>
              <section
                aria-labelledby="preview-page"
                className="grid content-start gap-4 rounded-xl border-[1.5px] border-border-subtle p-5"
              >
                <h3 id="preview-page" className="text-caps text-text-secondary">
                  {t('previewPage')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <PiecePhoto material={values.material || 'ceramics'} />
                  <div className="grid content-start gap-2">
                    <p className="text-heading-sm">{values.name}</p>
                    <p className="text-label text-xl">{formatPrice(priceCents, locale)}</p>
                    <p className="text-sm text-text-secondary">
                      {tp('shipping', { price: formatPrice(shippingCents, locale) })}
                    </p>
                    <div>
                      <Badge
                        dot
                        tone={stock === 0 ? 'neutral' : stock === 1 ? 'accent' : 'success'}
                      >
                        {tp('stock', { count: stock })}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p>{values.description}</p>
                <div className="flex flex-wrap gap-x-4">
                  {(['details', 'pricing'] as const).map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => goTo(i)}
                      className="text-label min-h-11 underline underline-offset-4"
                    >
                      {t('edit', { step: t(`steps.${s}`).toLowerCase() })}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
              {t('back')}
            </Button>
          )}
          {/*
            Different keys on purpose: React would otherwise reuse the same <button> and switch its
            type to "submit" while the "Continue" click is still being handled, so that click would
            publish the piece and skip the review step.
          */}
          {current === 'preview' ? (
            <Button key="publish" type="submit" size="lg" loading={isSubmitting}>
              {t('publish')}
            </Button>
          ) : (
            <Button key="continue" type="button" size="lg" onClick={next}>
              {t('continue')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
