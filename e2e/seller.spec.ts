import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

async function signInAs(page: Page, button: 'Entrar como Dona Lúcia' | 'Começar como artesã nova') {
  await page.goto('/pt/loja');
  await page.getByRole('button', { name: button }).click();
  // Wait for the sign-in to finish (the landing goes away) before navigating again.
  await expect(page.getByRole('heading', { name: 'Venda o que você faz à mão' })).toHaveCount(0);
}

test.describe('maker landing', () => {
  test('offers two demo accounts and passes axe', async ({ page }) => {
    await page.goto('/pt/loja');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Venda o que você faz à mão' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar como Dona Lúcia' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar como artesã nova' })).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe('shop onboarding (US-11)', () => {
  test('a new maker creates a shop with story and region', async ({ page }) => {
    await signInAs(page, 'Começar como artesã nova');
    await expect(page).toHaveURL(/\/pt\/loja\/comecar$/);
    expect((await axe(page)).violations).toEqual([]);

    await page.getByRole('button', { name: 'Criar minha loja' }).click();
    await expect(page.getByLabel('Nome da loja')).toBeFocused();
    await expect(page.getByLabel('Nome da loja')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Nome da loja').fill('Ateliê da Rosa');
    await page.getByLabel('O que você faz', { exact: true }).fill('Rendeira');
    await page.getByLabel('Cidade').fill('Divina Pastora');
    await page.getByLabel('Estado').selectOption('SE');
    await expect(page.getByText('Região: Nordeste')).toBeVisible();
    await page
      .getByLabel('Conte sua história')
      .fill('Faço renda irlandesa desde os doze anos, como minha mãe e minha avó faziam.');
    await page.getByRole('button', { name: 'Criar minha loja' }).click();

    await expect(page).toHaveURL(/\/pt\/loja\?loja=criada$/);
    await expect(page.getByText('Sua loja está pronta!')).toBeVisible();
    await page.getByRole('link', { name: 'Ver minha página' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ateliê da Rosa' })).toBeVisible();
    await expect(page.getByText('Faço renda irlandesa desde os doze anos')).toBeVisible();
  });
});

test.describe('new piece wizard (US-12)', () => {
  test('stays on "Price and stock" until the price is filled, then publishes', async ({ page }) => {
    await signInAs(page, 'Entrar como Dona Lúcia');
    await page.getByRole('link', { name: 'Nova peça' }).click();

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByLabel('Nome da peça')).toBeFocused();

    await page.getByLabel('Nome da peça').fill('Tigela grande');
    await page.getByLabel('Material').selectOption({ label: 'Cerâmica' });
    await page.getByLabel('Descrição').fill('Tigela grande de servir, com esmalte azul.');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { level: 2, name: /Preço e estoque/ })).toBeFocused();

    await page.getByLabel('Frete (R$)').fill('20');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('heading', { level: 2, name: /Preço e estoque/ })).toBeVisible();
    await expect(page.getByText('Informe o preço.')).toBeVisible();
    await expect(page.getByLabel('Preço (R$)')).toBeFocused();
    expect((await axe(page)).violations).toEqual([]);

    await page.getByLabel('Preço (R$)').fill('120');
    await page.getByRole('button', { name: 'Continuar' }).click();
    const preview = page.getByRole('region', { name: 'Na página da peça' });
    await expect(preview).toContainText('Tigela grande');
    await expect(preview).toContainText('R$ 120');
    expect((await axe(page)).violations).toEqual([]);

    await page.getByRole('button', { name: 'Publicar peça' }).click();
    await expect(page.getByText('Tigela grande foi publicada!')).toBeVisible();
    await page.getByRole('link', { name: 'Ver como ficou' }).click();
    await expect(page.getByText('Prévia: é assim que compradores veem esta página.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Tigela grande' })).toBeVisible();

    // A demo piece never reaches the public catalog.
    await page.goto('/pt/pecas?q=tigela%20grande');
    await expect(page.getByRole('heading', { level: 2, name: 'Nenhuma peça' })).toBeVisible();
  });

  test('keeps the draft after a reload', async ({ page }) => {
    await signInAs(page, 'Entrar como Dona Lúcia');
    await page.goto('/pt/loja/pecas/nova');
    await page.getByLabel('Nome da peça').fill('Moringa pequena');
    await page.reload();
    await expect(page.getByText('Recuperamos o rascunho que você começou.')).toBeVisible();
    await expect(page.getByLabel('Nome da peça')).toHaveValue('Moringa pequena');
    await page.getByRole('button', { name: 'Começar do zero' }).click();
    await expect(page.getByLabel('Nome da peça')).toHaveValue('');
  });

  test('sends visitors who are not makers to the landing', async ({ page }) => {
    await page.goto('/pt/loja/pecas/nova');
    await expect(page).toHaveURL(/\/pt\/loja$/);
  });
});
