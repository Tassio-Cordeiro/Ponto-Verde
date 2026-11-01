import { test } from 'vitest';
import assert from 'node:assert/strict';
import { http, HttpResponse, delay } from 'msw';
import { servidor } from './mocks/server.ts';
import { api, lerTokens, salvarTokens } from '../src/services/api.ts';
import { autenticar, buscarPerfil } from '../src/services/authService.ts';
import {
  listarProdutos,
  salvarProdutoRemoto,
  excluirProdutoRemoto,
} from '../src/services/produtosService.ts';
import { listarClientes, cadastrarCliente } from '../src/services/clientesService.ts';
import { integrarCarrinho } from '../src/services/carrinhoService.ts';
import { clienteSchema } from '../src/schemas/dominio.ts';
import { chaveStorage, lerStorage } from '../src/utils/armazenamento.ts';
import type { Produto, Resumo } from '../src/types/index.ts';

const perfil = {
  id: 1,
  username: 'emilys',
  firstName: 'Emily',
  lastName: 'Johnson',
  email: 'emily@example.com',
  role: 'admin',
};
const tokens = { accessToken: 'token-valido', refreshToken: 'refresh-valido' };
const produto: Produto = {
  id: 'api-16',
  dummyJsonId: 16,
  origem: 'dummyjson',
  nome: 'Maçã',
  descricao: 'Maçã fresca',
  precoCentavos: 199,
  desconto: 10,
  estoque: 8,
  imagem: '',
  grupo: 'Hortifruti',
};
const resumo: Resumo = {
  itens: [
    {
      produtoId: 'api-16',
      dummyJsonId: 16,
      nome: 'Maçã',
      quantidade: 2,
      precoCentavos: 199,
      descontoUnitarioCentavos: 20,
      imagem: '',
    },
    {
      produtoId: 'local-1',
      nome: 'Produto local',
      quantidade: 1,
      precoCentavos: 100,
      descontoUnitarioCentavos: 0,
      imagem: '',
    },
  ],
  subtotal: 498,
  descontos: 40,
  total: 458,
};

test('login consulta o perfil, guarda tokens somente na sessão e libera apenas admin', async () => {
  servidor.use(
    http.post('https://dummyjson.com/auth/login', () => HttpResponse.json(tokens)),
    http.get('https://dummyjson.com/auth/me', ({ request }) => {
      assert.equal(request.headers.get('authorization'), 'Bearer token-valido');
      return HttpResponse.json(perfil);
    }),
  );
  const usuario = await autenticar('emilys', 'emilyspass');
  assert.equal(usuario.role, 'admin');
  assert.deepEqual(lerTokens(), tokens);
  assert.equal(localStorage.getItem(chaveStorage('sessao')), null);
});
test('credencial incorreta (HTTP 400 do DummyJSON) não tenta renovar a sessão', async () => {
  let renovacoes = 0;
  servidor.use(
    http.post('https://dummyjson.com/auth/login', () =>
      HttpResponse.json({ message: 'Invalid credentials' }, { status: 400 }),
    ),
    http.post('https://dummyjson.com/auth/refresh', () => {
      renovacoes++;
      return HttpResponse.json(tokens);
    }),
  );
  await assert.rejects(() => autenticar('errado', 'errada'), /Usuário ou senha incorretos/);
  assert.equal(renovacoes, 0);
});
test('perfil sem papel admin encerra a sessão', async () => {
  servidor.use(
    http.post('https://dummyjson.com/auth/login', () => HttpResponse.json(tokens)),
    http.get('https://dummyjson.com/auth/me', () => HttpResponse.json({ ...perfil, role: 'user' })),
  );
  await assert.rejects(() => autenticar('outro', 'senha'), /perfil administrativo/);
  assert.equal(lerTokens(), null);
});
test('token expirado renova uma vez e repete a requisição protegida', async () => {
  salvarTokens({ accessToken: 'expirado', refreshToken: 'refresh-valido' });
  let renovacoes = 0;
  servidor.use(
    http.get('https://dummyjson.com/auth/me', ({ request }) =>
      request.headers.get('authorization') === 'Bearer token-valido'
        ? HttpResponse.json(perfil)
        : HttpResponse.json({ message: 'expired' }, { status: 401 }),
    ),
    http.post('https://dummyjson.com/auth/refresh', () => {
      renovacoes++;
      return HttpResponse.json(tokens);
    }),
  );
  assert.equal((await buscarPerfil()).role, 'admin');
  assert.equal(renovacoes, 1);
});
test('renovação malsucedida não entra em loop e remove os tokens', async () => {
  salvarTokens({ accessToken: 'expirado', refreshToken: 'invalido' });
  let renovacoes = 0;
  servidor.use(
    http.get('https://dummyjson.com/auth/me', () => HttpResponse.json({}, { status: 401 })),
    http.post('https://dummyjson.com/auth/refresh', () => {
      renovacoes++;
      return HttpResponse.json({}, { status: 401 });
    }),
  );
  await assert.rejects(() => buscarPerfil(), /Sessão expirada/);
  assert.equal(renovacoes, 1);
  assert.equal(lerTokens(), null);
});
test('catálogo vazio é válido e resposta fora do contrato é rejeitada', async () => {
  servidor.use(
    http.get('https://dummyjson.com/products/category/groceries', () =>
      HttpResponse.json({ products: [], total: 0 }),
    ),
  );
  assert.deepEqual(await listarProdutos(), []);
  servidor.use(
    http.get('https://dummyjson.com/products/category/groceries', () =>
      HttpResponse.json({ products: 'inválido' }),
    ),
  );
  await assert.rejects(() => listarProdutos(), /Dados inválidos recebidos em catálogo/);
});
test('erros de rede e timeout têm mensagens diferentes', async () => {
  servidor.use(
    http.get('https://dummyjson.com/products/category/groceries', () => HttpResponse.error()),
  );
  await assert.rejects(() => listarProdutos(), /Sem conexão/);
  servidor.use(
    http.get('https://dummyjson.com/test-timeout', async () => {
      await delay(60);
      return HttpResponse.json({});
    }),
  );
  // O XHR simulado pelo jsdom/MSW não dispara timeout; o adaptador HTTP real do Axios o faz.
  await assert.rejects(
    () => api.get('/test-timeout', { timeout: 10, adapter: 'http' }),
    /demorou demais/,
  );
});
test('carrinho misto envia apenas IDs externos e conserva o total local', async () => {
  servidor.use(
    http.post('https://dummyjson.com/carts/add', async ({ request }) => {
      const corpo: unknown = await request.json();
      assert.deepEqual(corpo, { userId: 1, products: [{ id: 16, quantity: 2 }] });
      assert.equal(request.headers.get('authorization'), null);
      return HttpResponse.json({
        id: 51,
        userId: 1,
        products: [{ id: 16, quantity: 2 }],
        total: 999,
        discountedTotal: 900,
      });
    }),
  );
  salvarTokens(tokens);
  await integrarCarrinho(resumo, null);
  assert.equal(resumo.total, 458);
  assert.equal(await integrarCarrinho({ ...resumo, itens: [resumo.itens[1]] }, null), null);
});
test('operações REST protegidas de produto validam suas respostas', async () => {
  salvarTokens(tokens);
  let operacoes = 0;
  const conferir = ({ request }: { request: Request }) => {
    assert.equal(request.headers.get('authorization'), 'Bearer token-valido');
    operacoes++;
    return HttpResponse.json({ id: 16, isDeleted: true });
  };
  servidor.use(
    http.post('https://dummyjson.com/auth/products/add', conferir),
    http.patch('https://dummyjson.com/auth/products/16', conferir),
    http.delete('https://dummyjson.com/auth/products/16', conferir),
  );
  await salvarProdutoRemoto(produto, true);
  await salvarProdutoRemoto(produto, false);
  await excluirProdutoRemoto(16);
  assert.equal(operacoes, 3);
});
test('MSW associa CPFs aos perfis da API e persiste um novo cliente sem duplicar CPF', async () => {
  servidor.use(
    http.get('https://dummyjson.com/users/:id', ({ params }) =>
      HttpResponse.json({ ...perfil, id: Number(params.id) }),
    ),
  );
  const conhecidos = await listarClientes('52998224725');
  assert.equal(conhecidos[0]?.dummyJsonId, 1);
  const novo = await cadastrarCliente({ cpf: '12345678909', nome: 'Cliente de Teste', email: '' });
  assert.ok(novo.id);
  assert.equal(novo.dummyJsonId, undefined);
  const recuperados = await listarClientes('12345678909');
  assert.equal(recuperados[0]?.id, novo.id);
  await assert.rejects(
    () => cadastrarCliente({ cpf: '12345678909', nome: 'Duplicado', email: '' }),
    /já está cadastrado/,
  );
});
test('MSW rejeita formulário inválido e não recebe o token administrativo', async () => {
  salvarTokens(tokens);
  servidor.use(
    http.get('http://localhost/api/clientes', ({ request }) => {
      assert.equal(request.headers.get('authorization'), null);
      return HttpResponse.json([]);
    }),
  );
  assert.deepEqual(await listarClientes(), []);
  await assert.rejects(
    () => cadastrarCliente({ cpf: '11111111111', nome: 'Teste', email: '' }),
    /Confira CPF/,
  );
});
test('registro inválido no armazenamento recupera apenas a chave afetada', () => {
  localStorage.setItem(chaveStorage('cliente-invalido'), '{"nome":42}');
  localStorage.setItem(chaveStorage('preservar'), 'histórico');
  assert.equal(lerStorage('cliente-invalido', clienteSchema.nullable(), null), null);
  assert.equal(localStorage.getItem(chaveStorage('preservar')), 'histórico');
  assert.equal(localStorage.getItem(chaveStorage('cliente-invalido')), null);
});
