import { act, configure, getConfig, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { AppRoutes } from '../../src/routes/AppRoutes.tsx';
import { lerStorage } from '../../src/utils/armazenamento.ts';
import { vendaSchema } from '../../src/schemas/dominio.ts';
import { renderComProviders } from '../renderComProviders.tsx';
import { atendimentoVisitante } from '../fixtures/clientes.ts';
import { servidor } from '../mocks/server.ts';

async function abrirPagamento() {
  const tela = renderComProviders(<AppRoutes />, {
    rota: '/pagamento',
    notificacoes: false,
    estadoInicial: {
      atendimento: atendimentoVisitante,
      carrinho: [{ produtoId: 'api-38', quantidade: 2 }],
    },
  });
  const confirmar = await screen.findByRole('button', { name: 'Confirmar pagamento simulado' });
  return { ...tela, confirmar };
}
const vendasRegistradas = () => lerStorage('vendas', z.array(vendaSchema), []);
const wrapperAssincronoOriginal = getConfig().asyncWrapper;
afterEach(() => configure({ asyncWrapper: wrapperAssincronoOriginal }));
function ativarRelogioSimulado() {
  vi.useFakeTimers();
  // O wrapper padrão da RTL drena microtarefas com um setTimeout(0) que reconhece
  // o relógio do Jest. Aqui a interação usa act e o relógio do Vitest, só nestes testes.
  configure({
    asyncWrapper: async <T,>(interacao: () => Promise<T>): Promise<T> => {
      let resultado!: T;
      await act(async () => {
        resultado = await interacao();
      });
      return resultado;
    },
  });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}
describe('Pagamento simulado de cinco segundos', () => {
  it('separa o carregamento HTTP da simulação visual e bloqueia a confirmação', async () => {
    let liberarResposta!: () => void;
    const pendente = new Promise<void>((resolve) => {
      liberarResposta = resolve;
    });
    servidor.use(
      http.post('https://dummyjson.com/carts/add', async () => {
        await pendente;
        return HttpResponse.json({
          id: 900,
          userId: 1,
          products: [{ id: 38, quantity: 2 }],
          total: 999,
          discountedTotal: 900,
        });
      }),
    );
    const { confirmar } = await abrirPagamento();
    const user = userEvent.setup();
    await user.click(confirmar);
    expect(screen.getByRole('heading', { name: 'Integrando o carrinho com a API…' })).toBeVisible();
    expect(confirmar).toBeDisabled();
    expect(vendasRegistradas()).toHaveLength(0);
    await act(async () => liberarResposta());
    expect(await screen.findByRole('heading', { name: 'Conectando à maquininha…' })).toBeVisible();
  });
  it('não aprova antes de cinco segundos e registra uma única venda após o prazo', async () => {
    const { confirmar } = await abrirPagamento();
    const user = ativarRelogioSimulado();
    await user.click(confirmar);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole('heading', { name: 'Conectando à maquininha…' })).toBeVisible();
    expect(confirmar).toBeDisabled();
    await user.click(confirmar);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });
    expect(screen.getByRole('heading', { name: 'Processando pagamento…' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Pagamento aprovado!' })).not.toBeInTheDocument();
    expect(vendasRegistradas()).toHaveLength(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole('heading', { name: 'Pagamento aprovado!' })).toBeVisible();
    expect(vendasRegistradas()).toHaveLength(1);
    expect(vendasRegistradas()[0].total).toBe(2000);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(vendasRegistradas()).toHaveLength(1);
  });
  it('cancela os temporizadores ao desmontar e não aprova uma simulação interrompida', async () => {
    const { confirmar, unmount } = await abrirPagamento();
    const user = ativarRelogioSimulado();
    await user.click(confirmar);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole('heading', { name: 'Conectando à maquininha…' })).toBeVisible();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(vendasRegistradas()).toHaveLength(0);
  });
});
