import { z } from 'zod';
import { api } from '../services/api.ts';
import { clienteSchema, validar } from '../schemas/dominio.ts';
import { gravarStorage, lerStorage } from '../utils/armazenamento.ts';
import type { Cliente } from '../types/index.ts';

export const cpfsDemonstracao = [
  { cpf: '52998224725', dummyJsonId: 1 },
  { cpf: '11144477735', dummyJsonId: 2 },
];
export const clientesSchema = z.array(clienteSchema);
const perfilPublicoSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
});
let carregamento: Promise<Cliente[]> | null = null;
export async function obterClientes(): Promise<Cliente[]> {
  if (carregamento) return carregamento;
  carregamento = (async () => {
    const atuais = lerStorage('clientes', clientesSchema, []);
    const faltantes = cpfsDemonstracao.filter(
      (seed) => !atuais.some((cliente) => cliente.cpf === seed.cpf),
    );
    const novos = await Promise.all(
      faltantes.map(async (seed): Promise<Cliente> => {
        const resposta = await api.get<unknown>(`/users/${seed.dummyJsonId}`);
        const perfil = validar(perfilPublicoSchema, resposta.data, 'perfil fictício de cliente');
        return {
          id: `cliente-demo-${perfil.id}`,
          dummyJsonId: perfil.id,
          cpf: seed.cpf,
          nome: `${perfil.firstName} ${perfil.lastName}`,
          email: perfil.email,
        };
      }),
    );
    const recentes = lerStorage('clientes', clientesSchema, []);
    const clientes = [
      ...recentes,
      ...novos.filter((novo) => !recentes.some((atual) => atual.cpf === novo.cpf)),
    ];
    if (novos.length) gravarStorage('clientes', clientes);
    return clientes;
  })();
  try {
    return await carregamento;
  } finally {
    carregamento = null;
  }
}
