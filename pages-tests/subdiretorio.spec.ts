import { test, expect } from '@playwright/test';
import { respostaProdutos } from '../tests/fixtures/produtos.ts';

test.beforeEach(async ({ context }) => {
  // O MSW real trata /api/clientes. Somente as chamadas externas que ele deixa
  // passar recebem fixtures nesta suíte, sem handlers concorrentes de clientes.
  await context.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/category/groceries') {
      await route.fulfill({ json: respostaProdutos });
      return;
    }
    if (/^\/users\/[12]$/.test(url.pathname)) {
      await route.fulfill({
        json: {
          id: Number(url.pathname.split('/').at(-1)),
          firstName: 'Ana',
          lastName: 'de Teste',
          email: 'ana@example.com',
        },
      });
      return;
    }
    throw new Error(`API externa inesperada na verificação de Pages: ${url.pathname}`);
  });
});

test('serve capa, favicon e worker reais e carrega login profundo com status 404', async ({
  page,
  request,
}) => {
  const home = await page.goto('./');
  expect(home?.status()).toBe(200);
  await expect(page.getByRole('button', { name: 'INICIAR COMPRA' })).toBeVisible();
  for (const [arquivo, tipo] of [
    ['mercado.jpg', 'image/jpeg'],
    ['favicon.svg', 'image/svg+xml'],
    ['mockServiceWorker.js', 'javascript'],
  ]) {
    const resposta = await request.get(arquivo);
    expect(resposta.status(), arquivo).toBe(200);
    expect(resposta.headers()['content-type'], arquivo).toContain(tipo);
  }
  const login = await page.goto('admin/login?origem=pages#formulario');
  expect(login?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  await expect(page).toHaveURL(/\/Ponto-Verde\/admin\/login\?origem=pages#formulario$/);
  await page.getByRole('link', { name: '← Voltar ao autoatendimento' }).click();
  await expect(page).toHaveURL(/\/Ponto-Verde\/$/);
});

test('o build normal identifica CPF pelo MSW e preserva compra em recargas profundas', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'INICIAR COMPRA' }).click();
  await page.getByRole('textbox', { name: 'CPF', exact: true }).fill('52998224725');
  const respostaCliente = page.waitForResponse(
    (resposta) => new URL(resposta.url()).pathname === '/api/clientes',
  );
  await page.getByRole('button', { name: 'Continuar com CPF' }).click();
  expect((await respostaCliente).fromServiceWorker()).toBe(true);
  await expect(page.getByText('Olá, Ana!', { exact: true })).toBeVisible();
  const scriptWorker = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL);
  expect(scriptWorker).toContain('/Ponto-Verde/mockServiceWorker.js');
  await page.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }).click();
  await page.getByRole('link', { name: 'Revisar minha sacola (1)' }).click();
  const recarga = await page.reload();
  expect(recarga?.status()).toBe(404);
  await expect(page.getByLabel('Total da compra', { exact: true })).toHaveText(/R\$\s*10,00/);
  await page.getByRole('link', { name: 'Adicionar mais produtos' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver detalhes de Arroz' }).click();
  await expect(page).toHaveURL(/\/Ponto-Verde\/produtos\/api-38$/);
  const detalheDireto = await page.reload();
  expect(detalheDireto?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Arroz', exact: true })).toBeVisible();
  await page.goto('admin');
  await expect(page).toHaveURL(/\/Ponto-Verde\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  await page.getByRole('link', { name: '← Voltar ao autoatendimento' }).click();
  await page.getByRole('link', { name: 'Continuar meu atendimento' }).click();
  await expect(page.getByRole('link', { name: 'Revisar minha sacola (1)' })).toBeVisible();
});
