import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

async function signInAsMarina(page: Page) {
  await page.goto('/pt/conta');
  await page.getByRole('button', { name: 'Entrar como Marina' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Olá, Marina!' })).toBeVisible();
}

test.describe('buyer area (US-08)', () => {
  test('asks to sign in, with a one-click demo account', async ({ page }) => {
    await page.goto('/pt/conta');
    await expect(
      page.getByRole('heading', { level: 1, name: /Entre para acompanhar/ }),
    ).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });

  test('sends visitors who are not signed in away from an order page', async ({ page }) => {
    await page.goto('/pt/conta/pedidos/MOR-7KQ2XA');
    await expect(page).toHaveURL(/\/pt\/conta$/);
  });

  test('protects the orders API', async ({ request }) => {
    expect((await request.get('/api/me/orders')).status()).toBe(401);
  });

  test('lists the orders with their status', async ({ page }) => {
    await signInAsMarina(page);
    const orders = page.getByRole('region', { name: 'Meus pedidos' });
    await expect(orders.getByRole('link', { name: /MOR-7KQ2XA.*Enviado/ })).toBeVisible();
    await expect(orders.getByRole('link', { name: /MOR-H3P9TZ.*Pago/ })).toBeVisible();
    await expect(orders.getByRole('link', { name: /MOR-4MWD8C.*Entregue/ })).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });

  test('shows the timeline with the tracking code', async ({ page }) => {
    await signInAsMarina(page);
    await page.getByRole('link', { name: /MOR-7KQ2XA/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Pedido MOR-7KQ2XA' })).toBeVisible();
    const timeline = page.getByRole('region', { name: 'Acompanhe o pedido' });
    await expect(timeline.locator('[aria-current="step"]')).toContainText('Enviado');
    await expect(page.getByText('QB123456789BR')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Rastrear nos Correios' })).toHaveAttribute(
      'href',
      /rastreamento\.correios\.com\.br/,
    );
    expect((await axe(page)).violations).toEqual([]);
  });

  test('confirms delivery right away and keeps it after a reload', async ({ page }) => {
    await signInAsMarina(page);
    await page.goto('/pt/conta/pedidos/MOR-7KQ2XA');
    await page.getByRole('button', { name: 'Recebi meu pedido' }).click();
    await expect(
      page.getByText('Obrigada por confirmar! Dona Lúcia vai ficar feliz em saber.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recebi meu pedido' })).toHaveCount(0);
    await page.reload();
    const timeline = page.getByRole('region', { name: 'Acompanhe o pedido' });
    await expect(timeline.locator('[aria-current="step"]')).toHaveCount(0);
    await expect(timeline).toContainText('Entregue');
  });

  test('signs out', async ({ page }) => {
    await signInAsMarina(page);
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('button', { name: 'Entrar como Marina' })).toBeVisible();
  });
});

test.describe('theme', () => {
  test.use({ colorScheme: 'dark' });

  test('follows the device, switches with one click and remembers the choice', async ({ page }) => {
    await page.goto('/pt');
    const html = page.locator('html');
    await page.getByRole('button', { name: 'Ativar tema claro' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Ativar tema escuro' })).toBeVisible();
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
    const canvas = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    expect(canvas).toBe('rgb(255, 255, 255)');
  });

  test('uses charcoal, not pure black, in the dark theme', async ({ page }) => {
    await page.goto('/pt');
    const canvas = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    expect(canvas).toBe('rgb(18, 18, 18)');
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe('checkout with the demo account', () => {
  test('fills in Marina’s made-up address and warns not to use real details', async ({ page }) => {
    await signInAsMarina(page);
    await page.goto('/pt/pecas/cesto-de-palha');
    await page.getByRole('button', { name: 'Adicionar à sacola' }).click();
    await page.goto('/pt/finalizar');
    await expect(page.getByText(/conta de demonstração da Marina/)).toBeVisible();
    await expect(page.getByLabel('E-mail')).toHaveValue('marina@demo.moringa.dev');
    await expect(page.getByLabel('CEP')).toHaveValue('01310-100');
    await expect(page.getByLabel('Rua')).toHaveValue('Avenida Paulista');
  });
});

test.describe('track an order without an account', () => {
  test('is linked from the footer and says clearly when nothing matches', async ({ page }) => {
    await page.goto('/pt');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Acompanhar pedido' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Acompanhar pedido' })).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);

    await page.getByLabel('Código do pedido').fill('MOR-ZZZZZZ');
    await page.getByLabel('E-mail da compra').fill('ninguem@example.com');
    await page.getByRole('button', { name: 'Acompanhar' }).click();
    await expect(
      page.getByText(/Não encontramos um pedido com esse código e esse e-mail/),
    ).toBeVisible();
  });

  test('prefills the code from the confirmation link', async ({ page }) => {
    await page.goto('/pt/pedido/acompanhar?codigo=mor-7kq2xa');
    await expect(page.getByLabel('Código do pedido')).toHaveValue('MOR-7KQ2XA');
  });

  test('answers the same 404 for a wrong code or a wrong email', async ({ request }) => {
    const res = await request.post('/api/orders/lookup', {
      data: { code: 'MOR-7KQ2XA', email: 'x@example.com' },
    });
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});

test.describe('system status', () => {
  test('shows yes/no checks and never a secret', async ({ page }) => {
    await page.goto('/pt/status');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Banco de dados (Neon)' }),
    ).toBeVisible();
    await expect(
      page.getByText(/sk_test_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}|postgres(ql)?:\/\//),
    ).toHaveCount(0);
    expect((await axe(page)).violations).toEqual([]);
  });
});
