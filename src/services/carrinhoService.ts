import { config } from '../app/config.ts';
import { respostaCarrinhoSchema, validar } from '../schemas/dominio.ts';
import type { Cliente, Resumo } from '../types/index.ts';
import { api } from './api.ts';
export async function integrarCarrinho(
  resumo: Resumo,
  cliente: Cliente | null,
  signal?: AbortSignal,
) {
  const products = resumo.itens
    .filter((item) => item.dummyJsonId !== undefined)
    .map((item) => ({ id: item.dummyJsonId, quantity: item.quantidade }));
  if (products.length === 0) return null;
  const resposta = await api.post<unknown>(
    '/carts/add',
    { userId: cliente?.dummyJsonId ?? config.usuarioTecnicoId, products },
    { signal },
  );
  // O total remoto não é usado: a venda respeita os preços efetivos confirmados localmente.
  return validar(respostaCarrinhoSchema, resposta.data, 'integração do carrinho');
}
