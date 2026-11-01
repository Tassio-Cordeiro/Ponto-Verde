import { test as base, expect } from '@playwright/test';
import { z } from 'zod';
import { respostaProdutos } from '../../tests/fixtures/produtos.ts';
import { clienteConhecido } from '../../tests/fixtures/clientes.ts';

const pedidoRemotoSchema = z.object({
  userId: z.number().int().positive(),
  products: z.array(
    z.object({ id: z.number().int().positive(), quantity: z.number().int().positive() }),
  ),
});

// Esta fixture é instalada antes do page.goto em TODOS os cenários.
export const test = base.extend<{ redeControlada: void }>({
  redeControlada: [
    async ({ page, baseURL }, use) => {
      const inesperadas: string[] = [];
      const origem = new URL(baseURL ?? 'http://127.0.0.1:4175').origin;
      await page.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (
          url.origin === 'https://dummyjson.com' &&
          url.pathname === '/products/category/groceries' &&
          request.method() === 'GET'
        ) {
          await route.fulfill({ json: respostaProdutos });
          return;
        }
        if (
          url.origin === 'https://dummyjson.com' &&
          url.pathname === '/carts/add' &&
          request.method() === 'POST'
        ) {
          const corpo: unknown = request.postDataJSON();
          const resultado = pedidoRemotoSchema.safeParse(corpo);
          if (!resultado.success)
            throw new Error('O checkout enviou um carrinho incompatível com o contrato.');
          await route.fulfill({
            json: { id: 900, ...resultado.data, total: 999, discountedTotal: 900 },
          });
          return;
        }
        if (
          url.origin === origem &&
          url.pathname === '/api/clientes' &&
          request.method() === 'GET'
        ) {
          const cpf = url.searchParams.get('cpf');
          await route.fulfill({
            json: !cpf || cpf === clienteConhecido.cpf ? [clienteConhecido] : [],
          });
          return;
        }
        if (
          url.origin === 'https://dummyjson.com' &&
          /^\/users\/[12]$/.test(url.pathname) &&
          request.method() === 'GET'
        ) {
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
        // Somente arquivos e páginas locais podem seguir para o servidor Vite.
        if (url.origin === origem && !url.pathname.startsWith('/api/')) {
          await route.continue();
          return;
        }
        inesperadas.push(`${request.method()} ${request.url()}`);
        await route.abort('blockedbyclient');
      });
      await use();
      expect(inesperadas, 'Todas as APIs do E2E devem ter respostas determinísticas.').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
