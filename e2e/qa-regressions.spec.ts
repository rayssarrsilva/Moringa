import { expect, type Page, test } from '@playwright/test';

/**
 * Regression tests for the bugs found in the QA cycle (docs/qa/BUG-REPORTS.md).
 * Each test is named after its bug report.
 */

async function addCestoAndTamper(page: Page, change: (item: Record<string, unknown>) => void) {
  await page.goto('/pt/pecas/cesto-de-palha');
  await page.getByRole('button', { name: 'Adicionar à sacola' }).click();
  await page.evaluate((fn) => {
    const saved = JSON.parse(localStorage.getItem('moringa:bag')!);
    new Function('item', fn)(saved.state.items[0]);
    localStorage.setItem('moringa:bag', JSON.stringify(saved));
  }, `(${change.toString()})(item)`);
}

test.describe('BUG-001 · the bag kept the price of the day the piece was added', () => {
  test('shows today’s price and says it changed', async ({ page }) => {
    await addCestoAndTamper(page, (item) => {
      item.priceCents = 9000;
    });
    await page.goto('/pt/sacola');
    await expect(
      page.getByRole('status').filter({ hasText: 'Atualizamos sua sacola' }),
    ).toContainText('Cesto de palha: o preço mudou de R$ 90 para R$ 120.');
    await expect(page.getByText('R$ 140', { exact: true }).last()).toBeVisible(); // R$ 120 + R$ 20 shipping
  });

  test('caps the quantity at the stock left', async ({ page }) => {
    await addCestoAndTamper(page, (item) => {
      item.quantity = 500;
    });
    await page.goto('/pt/sacola');
    await expect(page.getByRole('status').filter({ hasText: 'Atualizamos' })).toContainText(
      'só restam 3 peças',
    );
    const quantity = page.getByRole('group', { name: 'Quantidade de Cesto de palha' });
    await expect(quantity).toContainText('3');
    await expect(quantity.getByRole('button', { name: /Aumentar/ })).toBeDisabled();
  });

  test('takes out a piece that left the fair, and keeps saying so', async ({ page }) => {
    await addCestoAndTamper(page, (item) => {
      item.slug = 'peca-que-saiu-da-feira';
    });
    await page.goto('/pt/sacola');
    await expect(page.getByRole('status').filter({ hasText: 'Atualizamos' })).toContainText(
      'saiu da feira',
    );
    await expect(page.getByText('Sua sacola está vazia.')).toBeVisible();
  });

  test('the pay button shows the price that will be charged', async ({ page }) => {
    await addCestoAndTamper(page, (item) => {
      item.priceCents = 1;
    });
    await page.goto('/pt/finalizar');
    await expect(page.getByRole('button', { name: /Pagar R\$ 140/ })).toBeVisible();
  });
});
