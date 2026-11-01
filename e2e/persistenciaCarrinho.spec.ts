import { test, expect } from './fixtures/loja.ts';

test('recarregar a sacola preserva itens, quantidades e a escolha de visitante', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'INICIAR COMPRA' }).click();
  await page.getByRole('button', { name: 'Seguir sem CPF' }).click();
  await expect(page.getByRole('article', { name: 'Produto Arroz' })).toBeVisible();
  await page.getByRole('button', { name: 'Aumentar quantidade de Arroz' }).click();
  await page.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }).click();
  await page.getByRole('button', { name: 'Adicionar Leite ao carrinho' }).click();
  await page.getByRole('link', { name: 'Revisar minha sacola (3)' }).click();
  await expect(page.getByLabel('Total da compra', { exact: true })).toHaveText(/R\$\s*25,00/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sua sacola', exact: true })).toBeVisible();
  await expect(page.getByLabel('Quantidade selecionada de Arroz')).toHaveText('2');
  await expect(page.getByLabel('Quantidade selecionada de Leite')).toHaveText('1');
  await expect(page.getByLabel('Total da compra', { exact: true })).toHaveText(/R\$\s*25,00/);
  await page.getByRole('link', { name: 'Adicionar mais produtos' }).click();
  await expect(page.getByRole('article', { name: 'Produto Arroz' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
