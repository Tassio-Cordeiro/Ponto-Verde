import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Carrinho } from '../../src/pages/totem/Carrinho.tsx';
import { renderComProviders } from '../renderComProviders.tsx';
import { arroz, produtoLocal } from '../fixtures/produtos.ts';

describe('Revisão do carrinho', () => {
  it('mostra a sacola vazia e não oferece avanço ao pagamento', async () => {
    renderComProviders(<Carrinho />, { contextos: 'loja' });
    expect(
      await screen.findByRole('heading', { name: 'Sua sacola está esperando por você' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Escolher produtos' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Ir para pagamento' })).not.toBeInTheDocument();
  });
  it('apresenta produtos, quantidades e o total conhecido de R$ 25,00', async () => {
    renderComProviders(<Carrinho />, {
      contextos: 'loja',
      estadoInicial: {
        carrinho: [
          { produtoId: 'api-38', quantidade: 2 },
          { produtoId: 'api-32', quantidade: 1 },
        ],
      },
    });
    const arroz = within(await screen.findByRole('article', { name: 'Item Arroz no carrinho' }));
    expect(arroz.getByLabelText('Quantidade selecionada de Arroz')).toHaveTextContent('2');
    expect(arroz.getByText(/R\$\s*20,00/)).toBeVisible();
    expect(screen.getByRole('article', { name: 'Item Leite no carrinho' })).toBeVisible();
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*25,00/);
    expect(screen.getByRole('link', { name: 'Ir para pagamento' })).toBeVisible();
  });
  it('atualiza o total ao mudar quantidade e mantém os limites de uma unidade e do estoque', async () => {
    const user = userEvent.setup();
    renderComProviders(<Carrinho />, {
      contextos: 'loja',
      estadoInicial: { carrinho: [{ produtoId: 'api-38', quantidade: 2 }] },
    });
    const linha = within(await screen.findByRole('article', { name: 'Item Arroz no carrinho' }));
    await user.click(linha.getByRole('button', { name: 'Aumentar quantidade de Arroz' }));
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*30,00/);
    expect(linha.getByRole('button', { name: 'Aumentar quantidade de Arroz' })).toBeDisabled();
    const diminuir = linha.getByRole('button', { name: 'Diminuir quantidade de Arroz' });
    await user.click(diminuir);
    await user.click(diminuir);
    expect(linha.getByLabelText('Quantidade selecionada de Arroz')).toHaveTextContent('1');
    expect(diminuir).toBeDisabled();
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*10,00/);
  });
  it('remove um item, recalcula o resumo e retorna ao vazio ao remover o último', async () => {
    const user = userEvent.setup();
    renderComProviders(<Carrinho />, {
      contextos: 'loja',
      estadoInicial: {
        carrinho: [
          { produtoId: 'api-38', quantidade: 2 },
          { produtoId: 'api-32', quantidade: 1 },
        ],
      },
    });
    await screen.findByRole('article', { name: 'Item Leite no carrinho' });
    await user.click(screen.getByRole('button', { name: 'Remover Leite do carrinho' }));
    expect(
      screen.queryByRole('article', { name: 'Item Leite no carrinho' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*20,00/);
    await user.click(screen.getByRole('button', { name: 'Remover Arroz do carrinho' }));
    expect(
      screen.getByRole('heading', { name: 'Sua sacola está esperando por você' }),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Ir para pagamento' })).not.toBeInTheDocument();
  });
  it('reaplica preço administrativo e inclui um produto local no resumo', async () => {
    renderComProviders(<Carrinho />, {
      contextos: 'loja',
      estadoInicial: {
        catalogo: { produtos: [{ ...arroz, precoCentavos: 1200 }, produtoLocal], excluidos: [] },
        carrinho: [
          { produtoId: arroz.id, quantidade: 2 },
          { produtoId: produtoLocal.id, quantidade: 1 },
        ],
      },
    });
    expect(
      await screen.findByRole('article', { name: 'Item Pão local no carrinho' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Total da compra')).toHaveTextContent(/R\$\s*27,50/);
  });
});
