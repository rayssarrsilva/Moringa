import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

async function signIn(page: Page, where: '/pt/conta' | '/pt/loja', button: string) {
  await page.goto(where);
  await page.getByRole('button', { name: button }).click();
  await expect(page.getByRole('button', { name: button })).toHaveCount(0);
}

test.describe('public reviews on the piece page', () => {
  test('shows the average, each review and rich results data', async ({ page }) => {
    await page.goto('/pt/pecas/moringa-de-barro-com-tampa');
    const reviews = page.getByRole('region', { name: 'Avaliações' });
    await expect(reviews.getByText('5 de 5 · 2 avaliações')).toBeVisible();
    await expect(reviews.getByRole('img', { name: '5 de 5 estrelas' }).first()).toBeVisible();
    await expect(reviews.getByText('Helena D.')).toBeVisible();

    const product = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
      .then((all) => all.map((s) => JSON.parse(s)).find((d) => d['@type'] === 'Product'));
    expect(product.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 5,
      reviewCount: 2,
    });
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe('review a delivered piece (US-09)', () => {
  test('asks for stars, posts 5 stars with a comment and does not allow a second review', async ({
    page,
  }) => {
    await signIn(page, '/pt/conta', 'Entrar como Marina');
    await page.goto('/pt/conta/pedidos/MOR-4MWD8C');
    const form = page.getByRole('heading', { name: 'Avalie Pano de prato bordado' }).locator('..');
    expect((await axe(page)).violations).toEqual([]);

    await form.getByRole('button', { name: 'Publicar avaliação' }).click();
    await expect(form.getByText('Escolha de 1 a 5 estrelas.')).toBeVisible();

    await form.getByRole('radio', { name: '5 estrelas' }).check();
    await form.getByLabel('Conte como foi (opcional)').fill('Bordado delicado, chegou rapidinho.');
    await form.getByRole('button', { name: 'Publicar avaliação' }).click();

    await expect(
      page.getByRole('status').filter({ hasText: 'Obrigada! Ana vai adorar ler.' }),
    ).toBeVisible();
    await expect(page.getByText('Sua avaliação', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Bordado delicado, chegou rapidinho.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publicar avaliação' })).toHaveCount(0);
  });

  test('picks the rating with the keyboard', async ({ page }) => {
    await signIn(page, '/pt/conta', 'Entrar como Marina');
    await page.goto('/pt/conta/pedidos/MOR-4MWD8C');
    await page.getByRole('radio', { name: '1 estrela' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: '3 estrelas' })).toBeChecked();
  });

  test('only takes reviews from signed-in buyers', async ({ request }) => {
    const res = await request.post('/api/me/orders/MOR-4MWD8C/reviews', {
      data: { piece: 'x', rating: 5 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('the maker’s reviews (US-16)', () => {
  test('lists what buyers said, with the piece', async ({ page }) => {
    await signIn(page, '/pt/loja', 'Entrar como Dona Lúcia');
    await page.getByRole('link', { name: 'Ver avaliações' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Avaliações recebidas' }),
    ).toBeVisible();
    await expect(page.getByText('sobre Tigela de cerâmica')).toBeVisible();
    await expect(page.getByText(/de 5 · 3 avaliações/)).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe('favorites (US-03)', () => {
  test('a piece saved before signing in is still a favorite after', async ({ page }) => {
    await page.goto('/pt/pecas/cesto-de-palha');
    const save = page.getByRole('button', { name: 'Salvar nos favoritos' });
    await expect(save).toHaveAttribute('aria-pressed', 'false');
    await save.click();
    await expect(save).toHaveAttribute('aria-pressed', 'true');

    await signIn(page, '/pt/conta', 'Entrar como Marina');
    await page.getByRole('link', { name: 'Favoritos' }).first().click();
    await expect(page.getByRole('link', { name: 'Cesto de palha' })).toBeVisible();
    await expect(page.getByText('1 peça salva')).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });

  test('shows a paused or missing piece as unavailable (US-15)', async ({ page }) => {
    await page.goto('/pt');
    await page.evaluate(() =>
      localStorage.setItem(
        'moringa:favorites',
        JSON.stringify({
          version: 1,
          state: {
            items: [
              {
                slug: 'peca-pausada',
                name: { pt: 'Vaso pausado', en: 'Paused vase' },
                material: 'ceramics',
                priceCents: 9000,
                shop: { slug: 'ceramica-da-lucia', name: 'Dona Lúcia', city: 'Cunha', state: 'SP' },
              },
            ],
          },
        }),
      ),
    );
    await page.goto('/pt/favoritos');
    await expect(page.getByText('Indisponível')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vaso pausado' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Remover Vaso pausado dos favoritos' }).click();
    await expect(page.getByText('Você ainda não salvou nenhuma peça.')).toBeVisible();
  });
});
