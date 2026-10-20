import { describe, expect, it } from 'vitest';
import { alternates, truncate } from './seo';

describe('seo helpers', () => {
  it('links both languages and points x-default to Portuguese', () => {
    expect(alternates('en', '/pecas')).toEqual({
      canonical: '/en/pecas',
      languages: { 'pt-BR': '/pt/pecas', en: '/en/pecas', 'x-default': '/pt/pecas' },
    });
  });

  it('keeps short text and cuts long text at a word', () => {
    expect(truncate('Tigela rústica.')).toBe('Tigela rústica.');
    expect(truncate('Modelada à mão com argila local e queimada em forno a lenha.', 30)).toBe(
      'Modelada à mão com argila…',
    );
  });
});
