import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';

const messages = { pt, en };

/** Renders with the real translation files, so tests catch missing keys. */
export function renderWithIntl(ui: ReactElement, locale: 'pt' | 'en' = 'pt') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}
