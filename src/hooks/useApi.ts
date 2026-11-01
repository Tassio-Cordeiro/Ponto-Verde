import { useCallback, useRef, useState } from 'react';
import axios from 'axios';
export const mensagemErro = (erro: unknown) =>
  erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado. Tente novamente.';
export function useApi<T>() {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const ultimaRequisicao = useRef(0);
  const executar = useCallback(async (requisicao: () => Promise<T>) => {
    const numero = ++ultimaRequisicao.current;
    setCarregando(true);
    setErro(null);
    setSucesso(false);
    try {
      const resultado = await requisicao();
      if (numero === ultimaRequisicao.current) {
        setDados(resultado);
        setSucesso(true);
      }
      return resultado;
    } catch (falha: unknown) {
      if (numero === ultimaRequisicao.current && !axios.isCancel(falha))
        setErro(mensagemErro(falha));
      return null;
    } finally {
      if (numero === ultimaRequisicao.current) setCarregando(false);
    }
  }, []);
  return { dados, carregando, erro, sucesso, executar };
}
