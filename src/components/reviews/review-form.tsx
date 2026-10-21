'use client';

import { Button, Textarea } from '@rayssarrsilva/ipe';
import { useTranslations } from 'next-intl';
import { type FormEvent, useId, useState } from 'react';

/**
 * Stars as native radio buttons inside a fieldset: arrow keys pick the rating and screen
 * readers announce "4 stars, 4 of 5". The stars are only the visual skin of those radios.
 */
export function ReviewForm({
  pieceName,
  onSubmit,
  pending,
}: {
  pieceName: string;
  onSubmit: (rating: number, comment: string) => void;
  pending: boolean;
}) {
  const t = useTranslations('Reviews');
  const id = useId();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (rating < 1) return setError(true);
    onSubmit(rating, comment);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-xl bg-bg-surface p-5">
      <h3 className="text-label">{t('formTitle', { piece: pieceName })}</h3>
      <fieldset aria-describedby={error ? `${id}-error` : undefined} className="grid gap-2">
        <legend className="text-sm text-text-secondary">{t('ratingLegend')}</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="relative inline-grid size-11 cursor-pointer place-items-center rounded-md"
            >
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setError(false);
                }}
                className="peer absolute inset-0 cursor-pointer opacity-0"
              />
              <span className="sr-only">{t('ratingOption', { rating: n })}</span>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className="rounded-md text-action-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border-focus"
                fill={n <= rating ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.4 1 6.3L12 17.2l-5.6 2.9 1-6.3L3 9.4l6.3-.9L12 2.8Z" />
              </svg>
            </label>
          ))}
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-feedback-danger">
            {t('ratingRequired')}
          </p>
        )}
      </fieldset>
      <Textarea
        label={t('comment')}
        hint={t('commentHint')}
        rows={3}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div>
        <Button type="submit" loading={pending}>
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
