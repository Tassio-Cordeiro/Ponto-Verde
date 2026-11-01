import { test, expect } from './fixtures/loja.ts';

test('cliente identificado compra com desconto e recebe o comprovante por e-mail simulado', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'INICIAR COMPRA' }).click();
  await page.getByRole('textbox', { name: 'CPF', exact: true }).fill('52998224725');
  await page.getByRole('button', { name: 'Continuar com CPF' }).click();
  await expect(page.getByText('Bem-vindo, Ana de Teste!', { exact: true })).toBeVisible();
  await expect(page.getByText('Olá, Ana!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar Café solúvel ao carrinho' }).click();
  await page.getByRole('link', { name: 'Revisar minha sacola (1)' }).click();
  await expect(page.getByRole('article', { name: 'Item Café solúvel no carrinho' })).toBeVisible();
  await expect(page.getByLabel('Total da compra', { exact: true })).toHaveText(/R\$\s*7,20/);
  await page.getByRole('link', { name: 'Ir para pagamento' }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento simulado' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento aprovado!' })).toBeVisible();
  await page.getByRole('link', { name: 'Receber por e-mail' }).click();
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'ana@example.com',
  );
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('compra@example.com');
  await page.getByRole('button', { name: 'Enviar comprovante' }).click();
  await expect(
    page.getByRole('heading', { name: 'Muito obrigado por escolher comprar com a gente!' }),
  ).toBeVisible();
  await expect(
    page.getByText('Nota fiscal enviada por e-mail · simulação', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Pedido PV-0001/)).toBeVisible();
});
