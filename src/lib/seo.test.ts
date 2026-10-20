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

describe('siteUrl', () => {
  it('prefers the configured address, then the Vercel production domain', async () => {
    const { siteUrl } = await import('./seo');
    const saved = { ...process.env };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'moringa-silk.vercel.app';
    expect(siteUrl()).toBe('https://moringa-silk.vercel.app');
    process.env.NEXT_PUBLIC_SITE_URL = 'https://moringa.test';
    expect(siteUrl()).toBe('https://moringa.test');
    process.env = saved;
  });
});
