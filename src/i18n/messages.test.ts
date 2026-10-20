import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('has the same keys in Portuguese and English', () => {
    expect(keys(en).sort()).toEqual(keys(pt).sort());
  });

  it('has no empty strings', () => {
    for (const messages of [pt, en]) {
      for (const key of keys(messages)) {
        const value = key
          .split('.')
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
        expect(value, key).not.toBe('');
      }
    }
  });
});
