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
