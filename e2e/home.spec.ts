import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('home', () => {
  test.describe('with a Portuguese browser', () => {
    test.use({ locale: 'pt-BR' });

    test('opens the Portuguese home from the root address', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      await expect(
        page.getByRole('heading', { level: 1, name: /feito à mão no brasil/i }),
      ).toBeVisible();
    });
  });

  test.describe('with an English browser', () => {
    test.use({ locale: 'en-US' });

    test('opens the English home from the root address', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/en$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });

  test('switches to English and stays on the same page', async ({ page }) => {
    await page.goto('/pt');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(
      page.getByRole('heading', { level: 1, name: /handmade in brazil/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  test('lists pieces as links to their pages, with prices in reais', async ({ page }) => {
    await page.goto('/pt');
    const newThisWeek = page.getByRole('region', { name: 'Novidades da semana' });
    const first = newThisWeek.getByRole('link', { name: /moringa de barro com tampa/i });
    await expect(first).toHaveAttribute('href', '/pt/pecas/moringa-de-barro-com-tampa');
    await expect(first).toContainText('R$');
  });

  test('has a skip link that moves focus to the content', async ({ page }) => {
    await page.goto('/pt');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#content')).toBeFocused();
  });

  test('shows a friendly page for unknown addresses', async ({ page }) => {
    const response = await page.goto('/pt/nao-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /não está na feira/i })).toBeVisible();
  });

  for (const locale of ['pt', 'en']) {
    test(`has no detectable accessibility violations (${locale})`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('small phones', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of [
    '/pt',
    '/pt/pecas',
    '/pt/pecas/moringa-de-barro-com-tampa',
    '/pt/sacola',
    '/pt/conta',
  ]) {
    test(`fits 320px without sideways scrolling (WCAG 1.4.10): ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBe(0);
      await expect(page.getByRole('link', { name: /Sacola/ })).toBeInViewport();
    });
  }
});
