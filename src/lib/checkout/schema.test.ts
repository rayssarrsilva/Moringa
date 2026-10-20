import { describe, expect, it } from 'vitest';
import { addressSchema, maskCep, onlyDigits } from './schema';

const valid = {
  name: 'Marina Souza',
  email: 'marina@example.com',
  cep: '01310-100',
  street: 'Avenida Paulista',
  number: '1578',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

describe('addressSchema', () => {
  it('accepts a complete Brazilian address, with or without the CEP dash', () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
    expect(addressSchema.safeParse({ ...valid, cep: '01310100' }).success).toBe(true);
  });

  it('returns translation keys as messages', () => {
    const result = addressSchema.safeParse({ ...valid, cep: '0131', email: 'x', number: ' ' });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(
      result.error!.issues.map((i) => [i.path.join('.'), i.message]),
    );
    expect(messages).toEqual({ cep: 'cep', email: 'email', number: 'required' });
  });

  it('rejects a state that does not exist', () => {
    expect(addressSchema.safeParse({ ...valid, state: 'XX' }).success).toBe(false);
  });
});

describe('CEP helpers', () => {
  it('masks as the user types', () => {
    expect(maskCep('0131')).toBe('0131');
    expect(maskCep('013101')).toBe('01310-1');
    expect(maskCep('01310100999')).toBe('01310-100');
    expect(maskCep('01.310-100')).toBe('01310-100');
  });

  it('keeps only digits', () => {
    expect(onlyDigits('01310-100')).toBe('01310100');
  });
});
