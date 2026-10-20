import { describe, expect, it } from 'vitest';
import { orderCode, orderCodePattern } from './code';

describe('orderCode', () => {
  it('makes short codes without look-alike characters', () => {
    for (let i = 0; i < 200; i++) expect(orderCode()).toMatch(orderCodePattern);
  });

  it('is deterministic with a given random source', () => {
    expect(orderCode(() => 0)).toBe('MOR-222222');
  });
});
