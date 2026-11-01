import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { handlers as handlersClientes } from '../../src/mocks/handlers.ts';
import { respostaProdutos } from '../fixtures/produtos.ts';

export const requisicaoCarrinhoSchema = z.object({
  userId: z.number().int().positive(),
  products: z.array(
    z.object({ id: z.number().int().positive(), quantity: z.number().int().positive() }),
  ),
});
export const handlers = [
  http.get('https://dummyjson.com/products/category/groceries', () =>
    HttpResponse.json(respostaProdutos),
  ),
  http.post('https://dummyjson.com/carts/add', async ({ request }) => {
    const corpo: unknown = await request.json();
    const resultado = requisicaoCarrinhoSchema.safeParse(corpo);
    if (!resultado.success)
      return HttpResponse.json({ message: 'Carrinho inválido no teste.' }, { status: 400 });
    // Total propositalmente diferente: não deve substituir o total calculado pela loja.
    return HttpResponse.json({ id: 900, ...resultado.data, total: 999, discountedTotal: 900 });
  }),
  http.get('https://dummyjson.com/users/:id', ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      firstName: 'Ana',
      lastName: 'de Teste',
      email: 'ana@example.com',
    }),
  ),
  ...handlersClientes,
];
