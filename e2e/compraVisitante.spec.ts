import { test, expect } from './fixtures/loja.ts';

test('visitante compra, imprime o comprovante e inicia outro atendimento limpo', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'INICIAR COMPRA' }).click();
  await page.getByRole('button', { name: 'Seguir sem CPF' }).click();
  const arroz = page.getByRole('article', { name: 'Produto Arroz' });
  await expect(arroz).toBeVisible();
  await arroz.getByRole('button', { name: 'Aumentar quantidade de Arroz' }).click();
  await arroz.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }).click();
  await page.getByRole('button', { name: 'Adicionar Leite ao carrinho' }).click();
  await page.getByRole('link', { name: 'Revisar minha sacola (3)' }).click();
  await expect(page.getByRole('article', { name: 'Item Arroz no carrinho' })).toBeVisible();
  await expect(page.getByLabel('Quantidade selecionada de Arroz')).toHaveText('2');
  await expect(page.getByLabel('Quantidade selecionada de Leite')).toHaveText('1');
  await expect(page.getByLabel('Total da compra', { exact: true })).toHaveText(/R\$\s*25,00/);
  await page.getByRole('link', { name: 'Ir para pagamento' }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento simulado' }).click();
  await expect(
    page.getByRole('heading', { name: /Conectando à maquininha|Processando pagamento/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Conectando à maquininha|Processando pagamento/ }),
  ).toBeDisabled();
  // A tela de comprovante é evidência estável da aprovação, sem encurtar os cinco segundos.
  await expect(page.getByRole('heading', { name: 'Pagamento aprovado!' })).toBeVisible();
  await expect(page.getByText(/Pedido PV-0001/)).toBeVisible();
  await page.getByRole('button', { name: 'Imprimir nota' }).click();
  await expect(
    page.getByRole('heading', { name: 'Muito obrigado por escolher comprar com a gente!' }),
  ).toBeVisible();
  await expect(page.getByText('Comprovante impresso · simulação', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'INICIAR COMPRA' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'INICIAR COMPRA' }).click();
  await expect(page.getByRole('dialog', { name: 'Vamos nos conhecer?' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'CPF', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Seguir sem CPF' }).click();
  await expect(page.getByRole('link', { name: /Revisar minha sacola/ })).toHaveCount(0);
  await page.getByRole('link', { name: /0 itens/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Sua sacola está esperando por você' }),
  ).toBeVisible();
});
