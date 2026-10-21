import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

async function signInAsLucia(page: Page) {
  await page.goto('/pt/loja');
  await page.getByRole('button', { name: 'Entrar como Dona Lúcia' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Olá, Dona Lúcia!' })).toBeVisible();
}

test.describe('shop overview (US-13)', () => {
  test('shows what to ship today and a chart that is also a table', async ({ page }) => {
    await signInAsLucia(page);
    const overview = page.getByRole('region', { name: 'Resumo da loja' });
    await expect(overview.getByText('3 pedidos esperando você.')).toBeVisible();

    const toggle = overview.getByRole('button', { name: 'Mostrar como tabela' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(overview.getByRole('button', { name: 'Esconder tabela' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const table = overview.getByRole('table', { name: 'Receita por semana' });
    await expect(table.getByRole('row')).toHaveCount(9);
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe('ship an order (US-14)', () => {
  test('a prepared order gets a tracking code and leaves "To ship"', async ({ page }) => {
    await signInAsLucia(page);
    await page.getByRole('link', { name: 'Ver pedidos' }).click();
    await expect(page.getByRole('tab', { name: 'Para enviar (3)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect((await axe(page)).violations).toEqual([]);

    const preparing = page.getByRole('article', { name: 'Pedido MOR-LCR8M3' });
    await preparing.getByRole('button', { name: 'Marcar como enviado' }).click();
    const dialog = page.getByRole('dialog', { name: 'Enviar o pedido MOR-LCR8M3' });
    await expect(dialog.getByLabel('Código de rastreio')).toBeFocused();
    expect((await axe(page)).violations).toEqual([]);

    await dialog.getByLabel('Código de rastreio').fill('BR1234');
    await dialog.getByRole('button', { name: 'Confirmar envio' }).click();
    await expect(dialog.getByText(/não parece dos Correios/)).toBeVisible();

    await dialog.getByLabel('Código de rastreio').fill('br123456789br');
    await dialog.getByRole('button', { name: 'Confirmar envio' }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Pedido MOR-LCR8M3 enviado! Beatriz já pode acompanhar' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Para enviar (2)' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Pedido MOR-LCR8M3' })).toBeHidden();

    await page.getByRole('tab', { name: 'A caminho (2)' }).click();
    const shipped = page.getByRole('article', { name: 'Pedido MOR-LCR8M3' });
    await expect(shipped.getByText('Rastreio: BR123456789BR')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Para enviar (2)' })).toBeVisible();
  });

  test('a paid order goes to "being prepared" first', async ({ page }) => {
    await signInAsLucia(page);
    await page.goto('/pt/loja/pedidos');
    const paid = page.getByRole('article', { name: 'Pedido MOR-LC2P9A' });
    await paid.getByRole('button', { name: 'Começar a preparar' }).click();
    await expect(paid.getByRole('button', { name: 'Marcar como enviado' })).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: 'Pedido MOR-LC2P9A em preparo.' }),
    ).toBeVisible();
  });

  test('keeps the orders API for makers only', async ({ request }) => {
    expect((await request.get('/api/seller/orders')).status()).toBe(401);
    expect((await request.post('/api/seller/orders/MOR-LC2P9A/preparing')).status()).toBe(401);
  });
});
