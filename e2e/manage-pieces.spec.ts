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

async function publishPiece(page: Page, name: string) {
  await page.goto('/pt/loja/pecas/nova');
  await page.getByLabel('Nome da peça').fill(name);
  await page.getByLabel('Material').selectOption({ label: 'Cerâmica' });
  await page.getByLabel('Descrição').fill('Prato fundo de cerâmica, esmalte verde.');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Preço (R$)').fill('120');
  await page.getByLabel('Frete (R$)').fill('20');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Publicar peça' }).click();
  await expect(page.getByText(`${name} foi publicada!`)).toBeVisible();
}

test.describe('manage pieces (US-15)', () => {
  test('keeps the public example pieces read-only in the demo', async ({ page }) => {
    await signInAsLucia(page);
    await page.getByRole('link', { name: 'Editar: Moringa de barro com tampa' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Peça de exemplo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pausar peça' })).toHaveCount(0);
    expect((await axe(page)).violations).toEqual([]);
  });

  test('edits the price, pauses and sells again a piece of her own', async ({ page }) => {
    await signInAsLucia(page);
    await publishPiece(page, 'Prato fundo');
    await page.goto('/pt/loja');
    await page.getByRole('link', { name: 'Editar: Prato fundo' }).click();
    expect((await axe(page)).violations).toEqual([]);

    await page.getByLabel('Preço (R$)').fill('150,00');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Alterações salvas.' })).toBeVisible();

    await page.getByRole('button', { name: 'Pausar peça' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Peça pausada.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar a vender' })).toBeVisible();

    await page.goto('/pt/loja');
    const item = page.getByRole('listitem').filter({ hasText: 'Prato fundo' });
    await expect(item).toContainText('R$ 150');
    await expect(item).toContainText('Pausada');

    await item.getByRole('link', { name: 'Editar: Prato fundo' }).click();
    await page.getByRole('button', { name: 'Voltar a vender' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'A peça voltou para o catálogo.' }),
    ).toBeVisible();
  });

  test('says "Informe o preço" when the price is cleared', async ({ page }) => {
    await signInAsLucia(page);
    await publishPiece(page, 'Caneca');
    await page.goto('/pt/loja');
    await page.getByRole('link', { name: 'Editar: Caneca' }).click();
    await page.getByLabel('Preço (R$)').fill('');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByText('Informe o preço.')).toBeVisible();
    await expect(page.getByLabel('Preço (R$)')).toBeFocused();
  });
});

test.describe('forms never move the button under the click', () => {
  test('leaving a field invalid and clicking submit still submits and shows the error', async ({
    page,
  }) => {
    await page.goto('/pt/pecas/cesto-de-palha');
    await page.getByRole('button', { name: 'Adicionar à sacola' }).click();
    await page.goto('/pt/finalizar');
    await page.getByLabel('E-mail').fill('nao-e-email');
    // One click straight from the invalid field: before the fix, the message appeared on blur,
    // pushed the button down and the click missed.
    await page.getByRole('button', { name: /Pagar/ }).click();
    await expect(page.getByText(/Confira os \d+ campos destacados/)).toBeVisible();
  });
});
