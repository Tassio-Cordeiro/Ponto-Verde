import axios from 'axios';
import { z } from 'zod';
export const mockApi = axios.create({ baseURL: '/api', timeout: 15_000 });
mockApi.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    if (!axios.isAxiosError(erro)) return Promise.reject(erro);
    if (axios.isCancel(erro)) return Promise.reject(erro);
    if (erro.code === 'ECONNABORTED')
      return Promise.reject(new Error('A consulta aos clientes demorou demais. Tente novamente.'));
    const resposta = z.object({ mensagem: z.string() }).safeParse(erro.response?.data);
    return Promise.reject(
      new Error(
        resposta.success
          ? resposta.data.mensagem
          : 'Não foi possível acessar os clientes. Tente novamente.',
      ),
    );
  },
);
