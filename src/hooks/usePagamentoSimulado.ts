import { useEffect, useRef, useState } from 'react';
import { config } from '../app/config.ts';
import { useAtendimento } from './useAtendimento.ts';
import { useLoja } from './useLoja.ts';
import { mensagemErro } from './useApi.ts';
import { integrarCarrinho } from '../services/carrinhoService.ts';

export function usePagamentoSimulado() {
  const { atendimento, confirmarPagamento, aprovarPagamento, falharPagamento } = useAtendimento();
  const { resumo } = useLoja();
  const [fase, setFase] = useState<'ocioso' | 'integrando' | 'simulando' | 'aprovado'>('ocioso');
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const bloqueado = useRef(false);
  const controlador = useRef<AbortController | null>(null);
  const idEmPagamento = useRef<string | null>(null);
  useEffect(
    () => () => {
      controlador.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (fase !== 'simulando') return;
    const inicio = Date.now();
    const timer = window.setInterval(
      () => setSegundos(Math.min(5, Math.floor((Date.now() - inicio) / 1000))),
      100,
    );
    return () => window.clearInterval(timer);
  }, [fase]);
  useEffect(() => {
    if (
      fase !== 'simulando' ||
      segundos * 1000 < config.duracaoPagamentoMs ||
      !idEmPagamento.current
    )
      return;
    setFase('aprovado');
    void aprovarPagamento(idEmPagamento.current).catch((falha: unknown) => {
      setErro(mensagemErro(falha));
      setFase('ocioso');
      bloqueado.current = false;
      if (idEmPagamento.current) falharPagamento(idEmPagamento.current);
    });
  }, [segundos, fase, aprovarPagamento, falharPagamento]);
  async function pagar() {
    if (bloqueado.current || !atendimento) return;
    bloqueado.current = true;
    setErro(null);
    setSegundos(0);
    controlador.current = new AbortController();
    idEmPagamento.current = atendimento.id;
    try {
      const confirmado = confirmarPagamento(resumo);
      setFase('integrando');
      await integrarCarrinho(confirmado, atendimento.cliente, controlador.current.signal);
      if (!controlador.current.signal.aborted) setFase('simulando');
    } catch (falha: unknown) {
      if (!controlador.current.signal.aborted) {
        setErro(mensagemErro(falha));
        setFase('ocioso');
        falharPagamento(atendimento.id);
        bloqueado.current = false;
      }
    }
  }
  return { pagar, fase, segundos, erro, ocupado: fase !== 'ocioso' };
}
