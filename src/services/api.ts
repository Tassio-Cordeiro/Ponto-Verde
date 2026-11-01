import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { tokensSchema, validar } from '../schemas/dominio.ts';
import type { Tokens } from '../types/index.ts';
import { chaveStorage, gravarStorage, lerStorage } from '../utils/armazenamento.ts';

export const api = axios.create({ baseURL: 'https://dummyjson.com', timeout: 15_000 });
export const lerTokens = () => lerStorage('sessao', tokensSchema.nullable(), null, sessionStorage);
export function salvarTokens(tokens: Tokens | null) {
  gravarStorage('sessao', tokens, sessionStorage);
  window.dispatchEvent(new Event('ponto-verde:sessao'));
}
export function encerrarSessao() {
  sessionStorage.removeItem(chaveStorage('sessao'));
  window.dispatchEvent(new Event('ponto-verde:sessao'));
}
let renovacao: Promise<Tokens> | null = null;
export async function renovarTokens(): Promise<Tokens> {
  if (renovacao) return renovacao;
  renovacao = (async () => {
    const tokens = lerTokens();
    if (!tokens) throw new Error('Sessão expirada. Entre novamente.');
    const resposta = await api.post<unknown>('/auth/refresh', {
      refreshToken: tokens.refreshToken,
      expiresInMins: 30,
    });
    const novos = validar(tokensSchema, resposta.data, 'renovação da sessão');
    salvarTokens(novos);
    return novos;
  })();
  try {
    return await renovacao;
  } catch {
    encerrarSessao();
    throw new Error('Sessão expirada. Entre novamente.');
  } finally {
    renovacao = null;
  }
}
const protegida = (url = '') =>
  url.startsWith('/auth/') && !['/auth/login', '/auth/refresh'].includes(url);
api.interceptors.request.use((requisicao) => {
  const tokens = lerTokens();
  if (tokens && protegida(requisicao.url))
    requisicao.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return requisicao;
});
type RequisicaoRepetivel = InternalAxiosRequestConfig & { tentouRenovar?: boolean };
// Instalados uma única vez, fora do ciclo de renderização do React.
api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: unknown) => {
    if (!axios.isAxiosError(erro)) return Promise.reject(erro);
    if (axios.isCancel(erro)) return Promise.reject(erro);
    const requisicao: RequisicaoRepetivel | undefined = erro.config;
    if (erro.response?.status === 401 && requisicao && protegida(requisicao.url)) {
      if (!requisicao.tentouRenovar) {
        requisicao.tentouRenovar = true;
        try {
          await renovarTokens();
          return api.request(requisicao);
        } catch {
          return Promise.reject(new Error('Sessão expirada. Entre novamente.'));
        }
      }
      encerrarSessao();
      return Promise.reject(new Error('Sessão expirada. Entre novamente.'));
    }
    let mensagem = 'Não foi possível concluir a operação. Tente novamente.';
    if (erro.code === 'ECONNABORTED') mensagem = 'A solicitação demorou demais. Tente novamente.';
    else if (!erro.response)
      mensagem = 'Sem conexão com a API. Verifique a internet e tente novamente.';
    else if (
      erro.response.status === 401 ||
      (requisicao?.url === '/auth/login' && erro.response.status === 400)
    )
      mensagem = 'Usuário ou senha incorretos.';
    else if (erro.response.status === 403) mensagem = 'Você não tem permissão para esta operação.';
    else if (erro.response.status === 404) mensagem = 'O recurso solicitado não foi encontrado.';
    return Promise.reject(new Error(mensagem));
  },
);
