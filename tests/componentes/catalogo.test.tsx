import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { ListaProdutos } from '../../src/pages/totem/ListaProdutos.tsx';
import { renderComProviders } from '../renderComProviders.tsx';
import { servidor } from '../mocks/server.ts';
import { respostaProdutos } from '../fixtures/produtos.ts';

const endpoint = 'https://dummyjson.com/products/category/groceries';
async function mostrarCatalogo() {
  const user = userEvent.setup();
  renderComProviders(<ListaProdutos />);
  await screen.findByRole('article', { name: 'Produto Arroz' });
  return user;
}
describe('Catálogo público', () => {
  it('informa o carregamento e só mostra os produtos depois da resposta HTTP', async () => {
    let liberarResposta!: () => void;
    const respostaPendente = new Promise<void>((resolve) => {
      liberarResposta = resolve;
    });
    servidor.use(
      http.get(endpoint, async () => {
        await respostaPendente;
        return HttpResponse.json(respostaProdutos);
      }),
    );
    renderComProviders(<ListaProdutos />);
    expect(screen.getByText('Buscando produtos fresquinhos…')).toBeVisible();
    expect(screen.queryByRole('article', { name: 'Produto Arroz' })).not.toBeInTheDocument();
    await act(async () => liberarResposta());
    expect(await screen.findByRole('article', { name: 'Produto Arroz' })).toBeVisible();
    expect(screen.queryByText('Buscando produtos fresquinhos…')).not.toBeInTheDocument();
  });
  it('apresenta os nomes, preços e desconto recebidos pelo serviço real', async () => {
    await mostrarCatalogo();
    expect(
      within(screen.getByRole('article', { name: 'Produto Arroz' })).getByText(/R\$\s*10,00/),
    ).toBeVisible();
    const cafe = within(screen.getByRole('article', { name: 'Produto Café solúvel' }));
    expect(cafe.getByText(/R\$\s*7,20/)).toBeVisible();
    expect(cafe.getByText(/R\$\s*8,00/)).toBeVisible();
    expect(cafe.getByRole('button', { name: 'Adicionar Café solúvel ao carrinho' })).toBeEnabled();
  });
  it('pesquisa por nome sem diferenciar maiúsculas e minúsculas', async () => {
    const user = await mostrarCatalogo();
    await user.type(screen.getByRole('textbox', { name: 'Pesquisar produtos' }), 'LeItE');
    expect(screen.getByRole('article', { name: 'Produto Leite' })).toBeVisible();
    expect(screen.queryByRole('article', { name: 'Produto Arroz' })).not.toBeInTheDocument();
  });
  it('encontra o produto pelo código de barras', async () => {
    const user = await mostrarCatalogo();
    await user.type(screen.getByRole('textbox', { name: 'Pesquisar produtos' }), '7890000000038');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article', { name: 'Produto Arroz' })).toBeVisible();
  });
  it('mostra estado vazio para uma busca inexistente e permite limpar os filtros', async () => {
    const user = await mostrarCatalogo();
    await user.type(screen.getByRole('textbox', { name: 'Pesquisar produtos' }), 'inexistente');
    expect(screen.getByRole('heading', { name: 'Nenhum produto por aqui' })).toBeVisible();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
  it('trata uma listagem vazia válida sem inventar produtos', async () => {
    servidor.use(
      http.get(endpoint, () => HttpResponse.json({ products: [], total: 0, skip: 0, limit: 0 })),
    );
    renderComProviders(<ListaProdutos />);
    expect(await screen.findByRole('heading', { name: 'Nenhum produto por aqui' })).toBeVisible();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
  it('mostra erro HTTP e recupera a listagem ao tentar novamente', async () => {
    servidor.use(
      http.get(endpoint, () => HttpResponse.json({ message: 'Falha controlada' }, { status: 500 })),
    );
    const user = userEvent.setup();
    renderComProviders(<ListaProdutos />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação',
    );
    servidor.use(http.get(endpoint, () => HttpResponse.json(respostaProdutos)));
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('article', { name: 'Produto Arroz' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('recusa uma resposta incompatível com o schema Zod', async () => {
    servidor.use(
      http.get(endpoint, () =>
        HttpResponse.json({ products: [{ title: 'Produto incompleto' }], total: 1 }),
      ),
    );
    renderComProviders(<ListaProdutos />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dados inválidos recebidos em catálogo',
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
  it('limita a seleção ao estoque e respeita a quantidade escolhida ao adicionar', async () => {
    const user = await mostrarCatalogo();
    const card = within(screen.getByRole('article', { name: 'Produto Arroz' }));
    const aumentar = card.getByRole('button', { name: 'Aumentar quantidade de Arroz' });
    expect(card.getByRole('button', { name: 'Diminuir quantidade de Arroz' })).toBeDisabled();
    await user.click(aumentar);
    await user.click(aumentar);
    expect(card.getByLabelText('Quantidade selecionada de Arroz')).toHaveTextContent('3');
    expect(aumentar).toBeDisabled();
    await user.click(card.getByRole('button', { name: 'Adicionar Arroz ao carrinho' }));
    expect(screen.getByRole('link', { name: 'Revisar minha sacola (3)' })).toBeVisible();
    expect(card.getByRole('button', { name: 'Adicionar Arroz ao carrinho' })).toBeDisabled();
  });
});
