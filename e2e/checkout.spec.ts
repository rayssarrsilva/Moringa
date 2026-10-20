import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

/** ViaCEP is mocked, so tests never depend on a third-party API being up. */
async function mockViaCep(page: Page) {
  await page.route('https://viacep.com.br/ws/**', (route) => {
    const cep = route
      .request()
      .url()
      .match(/ws\/(\d{8})/)?.[1];
    if (cep === '01310100') {
      return route.fulfill({
        json: {
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
        },
      });
    }
    return route.fulfill({ json: { erro: 'true' } });
  });
}

async function addToBag(page: Page, slug: string, quantity = 1) {
  await page.goto(`/pt/pecas/${slug}`);
  if (quantity > 1) await page.getByLabel('Quantidade').selectOption(String(quantity));
  await page.getByRole('button', { name: 'Adicionar à sacola' }).click();
}

test.describe('bag (US-05)', () => {
  test('adds a piece and shows it in the header count', async ({ page }) => {
    await addToBag(page, 'cesto-de-palha');
    await expect(page.getByRole('status').filter({ hasText: 'está na sua sacola' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sacola, 1 peça' })).toBeVisible();
  });

  test('keeps the stock when asked for more, and says so', async ({ page }) => {
    await addToBag(page, 'moringa-de-barro-com-tampa', 2);
    await page.getByRole('button', { name: 'Adicionar à sacola' }).click();
    await expect(
      page.getByText('Só temos 2 unidades desta peça. Sua sacola ficou com 2.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sacola, 2 peças' })).toBeVisible();
  });

  test('is still there after a reload', async ({ page }) => {
    await addToBag(page, 'pano-de-prato-bordado');
    await page.goto('/pt/sacola');
    await page.reload();
    await expect(page.getByRole('link', { name: 'Pano de prato bordado' })).toBeVisible();
  });

  test('changes quantity, charges one shipping per maker and removes', async ({ page }) => {
    await addToBag(page, 'moringa-de-barro-com-tampa');
    await addToBag(page, 'tigela-de-ceramica');
    await addToBag(page, 'cesto-de-palha');
    await page.goto('/pt/sacola');

    await page.getByRole('button', { name: 'Aumentar a quantidade de Tigela de cerâmica' }).click();
    const summary = page.getByRole('region', { name: 'Resumo' });
    // 140 + 2 × 89 + 120 = 438, shipping 20 (Lúcia) + 20 (Raimundo)
    await expect(summary).toContainText('R$ 438');
    await expect(summary).toContainText('R$ 40');
    await expect(summary).toContainText('R$ 478');

    await page.getByRole('button', { name: 'Remover Cesto de palha' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sacola' })).toBeFocused();
    await expect(page.getByText('Feito por Seu Raimundo')).toHaveCount(0);
  });
});

test.describe('checkout (US-06, US-07)', () => {
  test('fills the address from the CEP and completes a demo order', async ({ page }) => {
    await mockViaCep(page);
    await addToBag(page, 'cesto-de-palha');
    await page.goto('/pt/finalizar');

    await page.getByLabel('Nome completo').fill('Marina Souza');
    await page.getByLabel('E-mail').fill('marina@example.com');
    await page.getByLabel('CEP').fill('01310100');
    await expect(page.getByLabel('CEP')).toHaveValue('01310-100');
    await expect(page.getByText('Endereço encontrado: Avenida Paulista, São Paulo.')).toBeVisible();
    await expect(page.getByLabel('Rua')).toHaveValue('Avenida Paulista');
    await expect(page.getByLabel('Bairro')).toHaveValue('Bela Vista');
    await expect(page.getByLabel('Estado')).toHaveValue('SP');
    await expect(page.getByLabel('Número')).toBeFocused();

    await page.getByLabel('Número').fill('1578');
    await page.getByRole('button', { name: /Pagar R\$ 140 com segurança/ }).click();

    await expect(page).toHaveURL(/\/pt\/pedido\/confirmado\?demo=1$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Pedido de demonstração concluído.',
    );
    await expect(page.getByRole('link', { name: 'Sacola, vazia' })).toBeVisible();
  });

  test('lets the buyer type the address when the CEP does not exist', async ({ page }) => {
    await mockViaCep(page);
    await addToBag(page, 'cesto-de-palha');
    await page.goto('/pt/finalizar');
    await page.getByLabel('CEP').fill('99999999');
    await expect(
      page.getByText('CEP não encontrado. Você pode digitar o endereço à mão.'),
    ).toBeVisible();
    await expect(page.getByLabel('Rua')).toBeEditable();
  });

  test('explains every missing field instead of submitting', async ({ page }) => {
    await addToBag(page, 'cesto-de-palha');
    await page.goto('/pt/finalizar');
    await page.getByRole('button', { name: /Pagar/ }).click();
    await expect(page.getByText(/Confira os \d+ campos destacados/)).toBeVisible();
    await expect(page.getByLabel('Nome completo')).toBeFocused();
    await expect(page.getByLabel('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/pt\/finalizar$/);
  });
});

for (const path of ['/pt/sacola', '/en/finalizar']) {
  test(`has no detectable accessibility violations with a full bag: ${path}`, async ({ page }) => {
    await addToBag(page, 'tigela-de-ceramica');
    await page.goto(path);
    await expect(
      page.getByText('Tigela de cerâmica').or(page.getByText('Ceramic bowl')).first(),
    ).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });
}
