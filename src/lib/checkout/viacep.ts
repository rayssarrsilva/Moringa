import { onlyDigits } from './schema';

export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | 'true';
}

/**
 * Looks up a CEP on ViaCEP, a free public API from the Correios database.
 * Returns null when the CEP does not exist. Throws on network errors, so the
 * form can tell "not found" apart from "could not check".
 */
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepAddress | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (response.status === 400) return null;
  if (!response.ok) throw new Error(`ViaCEP answered ${response.status}`);

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;
  return {
    street: data.logradouro ?? '',
    neighborhood: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
  };
}
