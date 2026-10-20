import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

const plain = (s: string) => s.replace(/ /g, ' ');

describe('formatPrice', () => {
  it('formats whole reais without cents', () => {
    expect(plain(formatPrice(14000, 'pt'))).toBe('R$ 140');
    expect(plain(formatPrice(14000, 'en'))).toBe('R$140');
  });

  it('shows cents with the right separator for each language', () => {
    expect(plain(formatPrice(8990, 'pt'))).toBe('R$ 89,90');
    expect(plain(formatPrice(8990, 'en'))).toBe('R$89.90');
  });

  it('uses thousands separators', () => {
    expect(plain(formatPrice(124000, 'pt'))).toBe('R$ 1.240');
  });

  it('rejects fractional cents', () => {
    expect(() => formatPrice(10.5, 'pt')).toThrow(TypeError);
  });
});

describe('formatDate', async () => {
  const { formatDate } = await import('./format');
  it('shows dates in Brasília time, in the reader language', () => {
    // 02:30 UTC is still the previous evening in Brasília (UTC−3).
    expect(formatDate('2026-10-05T02:30:00Z', 'pt')).toBe('4 de out. de 2026');
    expect(formatDate('2026-10-05T02:30:00Z', 'en', true)).toBe('Oct 4, 2026, 11:30 PM');
  });
});
