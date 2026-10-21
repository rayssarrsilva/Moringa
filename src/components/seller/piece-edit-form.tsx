'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Textarea } from '@rayssarrsilva/ipe';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { setPieceStatusAction, updatePieceAction } from '@/app/[locale]/loja/actions';
import { useRouter } from '@/i18n/navigation';
import { materials } from '@/lib/catalog/types';
import { type PieceForm, pieceSchema } from '@/lib/seller/schema';
import type { PieceStatus } from '@/lib/seller/types';
import { firstInvalid, selectClass } from './form-styles';

const order = ['name', 'material', 'description', 'price', 'shipping', 'stock'] as const;
const reais = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

/** US-15: one form for price, stock and description, and a separate control to pause. */
export function PieceEditForm({
  slug,
  status,
  initial,
}: {
  slug: string;
  status: PieceStatus;
  initial: {
    name: string;
    material: PieceForm['material'];
    description: string;
    priceCents: number;
    shippingCents: number;
    stock: number;
  };
}) {
  const t = useTranslations('Seller');
  const tm = useTranslations('Materials');
  const router = useRouter();
  // Each confirmation appears next to the button that caused it, where the person is looking.
  const [saveMessage, setSaveMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PieceForm>({
    resolver: zodResolver(pieceSchema),
    // Validate on submit, then re-validate as the person types (GOV.UK pattern). Never on blur:
    // a message appearing on blur pushes the button down during the click, and the click misses.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    defaultValues: {
      name: initial.name,
      material: initial.material,
      description: initial.description,
      price: reais(initial.priceCents),
      shipping: reais(initial.shippingCents),
      stock: String(initial.stock),
    },
  });
  const error = (key?: string) => (key ? t(`errors.${key}` as 'errors.required') : undefined);

  async function save(values: PieceForm) {
    const result = await updatePieceAction(slug, values);
    setSaveMessage(result.ok ? t('saved') : t('errors.generic'));
    if (result.ok) router.refresh();
  }

  function toggle() {
    const next = status === 'paused' ? 'published' : 'paused';
    startTransition(async () => {
      const result = await setPieceStatusAction(slug, next);
      setStatusMessage(
        result.ok ? (next === 'paused' ? t('pausedNow') : t('resumedNow')) : t('errors.generic'),
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-10">
      <form
        noValidate
        onSubmit={handleSubmit(save, (invalid) => {
          const first = firstInvalid(order, invalid);
          if (first) setFocus(first);
        })}
        className="grid gap-4"
      >
        <Input
          label={t('pieceName')}
          maxLength={80}
          error={error(errors.name?.message)}
          {...register('name')}
        />
        <div className="grid gap-1.5">
          <label htmlFor="edit-material" className="text-label">
            {t('material')}
          </label>
          <select
            id="edit-material"
            className={`${selectClass} sm:max-w-80`}
            {...register('material')}
          >
            {materials.map((m) => (
              <option key={m} value={m}>
                {tm(m)}
              </option>
            ))}
          </select>
        </div>
        <Textarea
          label={t('description')}
          rows={5}
          maxLength={600}
          showCount
          formatCount={(length, max) => t('counter', { length, max })}
          // The counter starts from this; react-hook-form fills the field after mount.
          defaultValue={initial.description}
          error={error(errors.description?.message)}
          {...register('description')}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t('price')}
            inputMode="decimal"
            error={error(errors.price?.message)}
            {...register('price')}
          />
          <Input
            label={t('shipping')}
            inputMode="decimal"
            error={error(errors.shipping?.message)}
            {...register('shipping')}
          />
          <Input
            label={t('stock')}
            inputMode="numeric"
            error={error(errors.stock?.message)}
            {...register('stock')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="submit" size="lg" loading={isSubmitting}>
            {t('save')}
          </Button>
          <p role="status">{saveMessage}</p>
        </div>
      </form>

      <section
        aria-labelledby="status-title"
        className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-5"
      >
        <h2 id="status-title" className="text-heading-sm">
          {t('manageTitle')}
        </h2>
        <p className="text-text-secondary">{t('manageHint')}</p>
        <Button
          type="button"
          variant={status === 'paused' ? 'primary' : 'secondary'}
          loading={pending}
          onClick={toggle}
        >
          {status === 'paused' ? t('resume') : t('pause')}
        </Button>
        <p role="status">{statusMessage}</p>
      </section>
    </div>
  );
}
