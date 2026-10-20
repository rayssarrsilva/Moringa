import { describe, expect, it } from 'vitest';
import { initials } from './maker-avatar';

describe('initials', () => {
  it('skips Brazilian honorifics so "Dona Lúcia" becomes "L"', () => {
    expect(initials('Dona Lúcia')).toBe('L');
    expect(initials('Seu Raimundo')).toBe('R');
  });

  it('uses up to two words', () => {
    expect(initials('Ana Maria Souza')).toBe('AM');
    expect(initials('Tião')).toBe('T');
  });
});
