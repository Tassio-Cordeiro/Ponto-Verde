import { api, salvarTokens, encerrarSessao } from './api.ts';
import { perfilSchema, tokensSchema, validar } from '../schemas/dominio.ts';

export async function buscarPerfil(signal?: AbortSignal) {
  const resposta = await api.get<unknown>('/auth/me', { signal });
  const perfil = validar(perfilSchema, resposta.data, 'perfil administrativo');
  if (perfil.role !== 'admin') {
    encerrarSessao();
    throw new Error('Este usuário não possui perfil administrativo.');
  }
  return perfil;
}
export async function autenticar(username: string, password: string) {
  const resposta = await api.post<unknown>('/auth/login', {
    username,
    password,
    expiresInMins: 30,
  });
  salvarTokens(validar(tokensSchema, resposta.data, 'autenticação'));
  try {
    return await buscarPerfil();
  } catch (erro: unknown) {
    encerrarSessao();
    throw erro;
  }
}
