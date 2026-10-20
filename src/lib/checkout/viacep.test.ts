import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupCep } from './viacep';

const respond = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

describe('lookupCep (US-06)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fills street, neighborhood, city and state from a valid CEP', async () => {
    const fetch = respond({
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    expect(await lookupCep('01310-100')).toEqual({
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/01310100/json/',
      expect.anything(),
    );
  });

  it('returns null when the CEP does not exist', async () => {
    respond({ erro: 'true' });
    expect(await lookupCep('99999-999')).toBeNull();
  });

  it('returns null for an incomplete CEP without calling the API', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    expect(await lookupCep('0131')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when ViaCEP is down, so the form can say "could not check"', async () => {
    respond({}, 503);
    await expect(lookupCep('01310-100')).rejects.toThrow('503');
  });
});
