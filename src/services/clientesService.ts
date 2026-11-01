import { z } from 'zod';
import { mockApi } from './mockApi.ts';
import { clienteSchema, validar } from '../schemas/dominio.ts';
import type { Cliente } from '../types/index.ts';
export async function listarClientes(cpf?: string, signal?: AbortSignal) {
  const resposta = await mockApi.get<unknown>('/clientes', {
    params: cpf ? { cpf } : undefined,
    signal,
  });
  return validar(z.array(clienteSchema), resposta.data, 'clientes');
}
export async function cadastrarCliente(dados: Pick<Cliente, 'cpf' | 'nome' | 'email'>) {
  const resposta = await mockApi.post<unknown>('/clientes', dados);
  return validar(clienteSchema, resposta.data, 'cadastro de cliente');
}
