import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppRoutes } from '../../src/routes/AppRoutes.tsx';
import { itemCarrinhoSchema } from '../../src/schemas/dominio.ts';
import { lerStorage } from '../../src/utils/armazenamento.ts';
import { renderComProviders } from '../renderComProviders.tsx';
import { atendimentoVisitante } from '../fixtures/clientes.ts';

async function abrirCatalogo() {
  const user = userEvent.setup();
  const tela = renderComProviders(<AppRoutes />, {
    estadoInicial: { atendimento: atendimentoVisitante },
  });
  await screen.findByRole('article', { name: 'Produto Arroz' });
  return { user, ...tela };
}
describe('Catálogo → Context real da loja → carrinho', () => {
  it('adiciona arroz e leite pela interface e mostra R$ 15,00 na revisão', async () => {
    // Preparar: providers reais e respostas HTTP determinísticas.
    const { user } = await abrirCatalogo();
    // Agir: os botões e a navegação são os mesmos usados pelo cliente.
    await user.click(screen.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar Leite ao carrinho' }));
    await user.click(screen.getByRole('link', { name: 'Revisar minha sacola (2)' }));
    // Verificar: a atualização atravessou o Context e chegou a outra página.
    expect(screen.getByRole('article', { name: 'Item Arroz no carrinho' })).toBeVisible();
    expect(screen.getByRole('article', { name: 'Item Leite no carrinho' })).toBeVisible();
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*15,00/);
  });
  it('acumula adições repetidas em uma linha sem duplicar o produto', async () => {
    const { user } = await abrirCatalogo();
    await user.click(screen.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
    await user.click(screen.getByRole('link', { name: 'Revisar minha sacola (2)' }));
    expect(screen.getAllByRole('article', { name: 'Item Arroz no carrinho' })).toHaveLength(1);
    expect(screen.getByLabelText('Quantidade selecionada de Arroz')).toHaveTextContent('2');
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*20,00/);
  });
  it('altera uma quantidade e remove outro produto mantendo o resumo coerente', async () => {
    const { user } = await abrirCatalogo();
    await user.click(screen.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar Leite ao carrinho' }));
    await user.click(screen.getByRole('link', { name: 'Revisar minha sacola (2)' }));
    const arroz = within(screen.getByRole('article', { name: 'Item Arroz no carrinho' }));
    await user.click(arroz.getByRole('button', { name: 'Aumentar quantidade de Arroz' }));
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*25,00/);
    await user.click(screen.getByRole('button', { name: 'Remover Leite do carrinho' }));
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*20,00/);
    expect(
      screen.queryByRole('article', { name: 'Item Leite no carrinho' }),
    ).not.toBeInTheDocument();
  });
  it('recupera itens, quantidades e identificação após desmontar e montar novamente', async () => {
    const { user, unmount } = await abrirCatalogo();
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Arroz' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar Leite ao carrinho' }));
    await user.click(screen.getByRole('link', { name: 'Revisar minha sacola (3)' }));
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*25,00/);
    unmount();
    // Somente este cenário mantém o armazenamento entre as duas montagens.
    renderComProviders(<AppRoutes />, { rota: '/carrinho' });
    await screen.findByRole('article', { name: 'Item Arroz no carrinho' });
    expect(screen.getByLabelText('Quantidade selecionada de Arroz')).toHaveTextContent('2');
    expect(screen.getByLabelText('Quantidade selecionada de Leite')).toHaveTextContent('1');
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*25,00/);
    expect(lerStorage('carrinho', z.array(itemCarrinhoSchema), [])).toEqual([
      { produtoId: 'api-38', quantidade: 2 },
      { produtoId: 'api-32', quantidade: 1 },
    ]);
    await user.click(screen.getByRole('link', { name: 'Adicionar mais produtos' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
