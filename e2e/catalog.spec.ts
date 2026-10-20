import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

/** On phones the filters are folded behind a button. */
async function openFilters(page: Page) {
  const toggle = page.getByRole('button', { name: /^Filtros/ });
  if (await toggle.isVisible()) await toggle.click();
}

test.describe('catalog (US-01)', () => {
  test('filters by state and material and keeps the filters in the URL', async ({ page }) => {
    await page.goto('/pt/pecas');
    await openFilters(page);
    await page.getByLabel('Estado').selectOption('SP');
    await page.getByLabel('Material').selectOption({ label: 'Cerâmica' });
    await page.getByRole('button', { name: 'Aplicar filtros' }).click();

    await expect(page).toHaveURL(/estado=SP/);
    await expect(page).toHaveURL(/material=ceramica/);
    await expect(page.getByRole('heading', { level: 2, name: '2 peças' })).toBeVisible();
    const results = page.getByRole('region', { name: '2 peças' });
    await expect(results.getByRole('link', { name: /moringa de barro/i })).toBeVisible();
    await expect(results.getByRole('link', { name: /tigela de cerâmica/i })).toBeVisible();
  });

  test('opens a shared filtered address with the same results', async ({ page }) => {
    await page.goto('/pt/pecas?regiao=nordeste&ordem=menor-preco');
    const cards = page.getByRole('region', { name: '2 peças' }).getByRole('article');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText('Jogo de colheres');
  });

  test('removes one filter from its chip and keeps the others', async ({ page }) => {
    await page.goto('/pt/pecas?regiao=sudeste&material=ceramica');
    await page.getByRole('link', { name: 'Remover filtro: Sudeste' }).click();
    await expect(page).toHaveURL(/\/pt\/pecas\?material=ceramica$/);
    await expect(page.getByRole('link', { name: 'Remover filtro: Cerâmica' })).toBeVisible();
  });

  test('shows a friendly empty state with a way out', async ({ page }) => {
    await page.goto('/pt/pecas?estado=PE&material=ceramica');
    await expect(page.getByText('Nenhuma peça com esses filtros, por enquanto.')).toBeVisible();
    await page.getByRole('link', { name: 'Limpar filtros' }).first().click();
    await expect(page).toHaveURL(/\/pt\/pecas$/);
  });

  test('ignores broken filter values instead of failing', async ({ page }) => {
    const response = await page.goto('/pt/pecas?regiao=atlantida&preco_min=abc');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 2, name: '5 peças' })).toBeVisible();
  });
});

test.describe('piece and shop pages (US-02)', () => {
  test('shows price, stock, material and maker, and links to the shop', async ({ page }) => {
    await page.goto('/pt/pecas/moringa-de-barro-com-tampa');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Moringa de barro com tampa' }),
    ).toBeVisible();
    await expect(page.getByText('R$ 140')).toBeVisible();
    await expect(page.getByText('2 disponíveis')).toBeVisible();
    await expect(page.getByText('Cerâmica', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Dona Lúcia', exact: true }).click();
    await expect(page).toHaveURL(/\/pt\/lojas\/ceramica-da-lucia$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Dona Lúcia' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Peças de Dona Lúcia' }).getByRole('link'),
    ).toHaveCount(2);
  });

  test('describes the piece for search engines', async ({ page }) => {
    await page.goto('/en/pecas/cesto-de-palha');
    const data = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
      .then((all) => all.map((s) => JSON.parse(s)));
    const product = data.find((d) => d['@type'] === 'Product');
    expect(product.name).toBe('Straw basket');
    expect(product.offers).toMatchObject({ price: '120.00', priceCurrency: 'BRL' });
    expect(data.some((d) => d['@type'] === 'BreadcrumbList')).toBe(true);
    await expect(page.locator('link[rel="alternate"][hreflang="pt-BR"]')).toHaveAttribute(
      'href',
      /\/pt\/pecas\/cesto-de-palha$/,
    );
  });

  test('answers 404 for a piece that does not exist', async ({ page }) => {
    const response = await page.goto('/pt/pecas/peca-que-nao-existe');
    expect(response?.status()).toBe(404);
  });
});

test.describe('public API', () => {
  test('filters with the same params as the catalog page', async ({ request }) => {
    const res = await request.get('/api/pieces?regiao=nordeste&ordem=menor-preco');
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.pieces.map((p: { slug: string }) => p.slug)).toEqual([
      'jogo-de-colheres-de-madeira',
      'cesto-de-palha',
    ]);
  });

  test('returns a JSON 404 for an unknown piece', async ({ request }) => {
    const res = await request.get('/api/pieces/nada');
    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'not_found' });
  });
});

for (const path of [
  '/pt/pecas',
  '/en/pecas?material=palha',
  '/pt/pecas/cesto-de-palha',
  '/en/lojas',
  '/pt/lojas/bordados-da-ana',
]) {
  test(`has no detectable accessibility violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    expect((await axe(page)).violations).toEqual([]);
  });
}
