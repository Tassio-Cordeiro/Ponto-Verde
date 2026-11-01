import { http, HttpResponse } from 'msw';
import { cadastroClienteSchema } from '../schemas/formularios.ts';
import { normalizarCpf } from '../utils/cpf.ts';
import { gravarStorage, lerStorage } from '../utils/armazenamento.ts';
import { clientesSchema, obterClientes } from './seeds.ts';

export const handlers = [
  http.get('/api/clientes', async ({ request }) => {
    try {
      const clientes = await obterClientes();
      const cpf = new URL(request.url).searchParams.get('cpf');
      return HttpResponse.json(
        cpf ? clientes.filter((cliente) => cliente.cpf === normalizarCpf(cpf)) : clientes,
      );
    } catch {
      return HttpResponse.json(
        {
          mensagem:
            'Não foi possível carregar os clientes de demonstração. Verifique a conexão e tente novamente.',
        },
        { status: 503 },
      );
    }
  }),
  http.post('/api/clientes', async ({ request }) => {
    try {
      const corpo: unknown = await request.json();
      const resultado = cadastroClienteSchema.safeParse(corpo);
      if (!resultado.success)
        return HttpResponse.json({ mensagem: 'Confira CPF, nome e e-mail.' }, { status: 400 });
      const cadastrar = () => {
        const clientes = lerStorage('clientes', clientesSchema, []);
        if (clientes.some((cliente) => cliente.cpf === resultado.data.cpf))
          return HttpResponse.json({ mensagem: 'Este CPF já está cadastrado.' }, { status: 409 });
        const novo = { id: crypto.randomUUID(), ...resultado.data };
        gravarStorage('clientes', [...clientes, novo]);
        return HttpResponse.json(novo, { status: 201 });
      };
      return navigator.locks
        ? await navigator.locks.request('ponto-verde:clientes', cadastrar)
        : cadastrar();
    } catch {
      return HttpResponse.json(
        { mensagem: 'Não foi possível salvar o cadastro.' },
        { status: 500 },
      );
    }
  }),
];
