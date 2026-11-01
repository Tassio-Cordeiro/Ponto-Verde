import { createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { atendimentoSchema, vendaSchema } from '../schemas/dominio.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { useLoja } from '../hooks/useLoja.ts';
import { lerStorage } from '../utils/armazenamento.ts';
import { incluirVendaUnica } from '../utils/vendas.ts';
import type { Atendimento, Cliente, Resumo, Venda } from '../types/index.ts';

const atendimentoPersistidoSchema = atendimentoSchema.nullable();
const vendasSchema = z.array(vendaSchema);
const vendasIniciais: Venda[] = [];
interface AtendimentoContexto {
  atendimento: Atendimento | null;
  vendas: Venda[];
  vendaAtual: Venda | null;
  iniciar: () => void;
  identificar: (cliente: Cliente | null) => boolean;
  confirmarPagamento: (resumo: Resumo) => Resumo;
  falharPagamento: (atendimentoId: string) => void;
  aprovarPagamento: (atendimentoId: string) => Promise<Venda>;
  concluir: (tipo: 'impresso' | 'email', email?: string) => void;
  limparAtendimento: () => void;
  atualizarPreparacao: (id: string, status: Venda['preparacao']) => void;
}
export const AtendimentoContext = createContext<AtendimentoContexto | undefined>(undefined);
export function AtendimentoProvider({ children }: { children: ReactNode }) {
  const [atendimento, setAtendimento] = useLocalStorage<Atendimento | null>(
    'atendimento',
    atendimentoPersistidoSchema,
    null,
  );
  const [vendas, setVendas] = useLocalStorage('vendas', vendasSchema, vendasIniciais);
  const { limparCarrinho } = useLoja();
  const vendaAtual = vendas.find((venda) => venda.atendimentoId === atendimento?.id) ?? null;
  function iniciar() {
    limparCarrinho();
    setAtendimento({
      id: crypto.randomUUID(),
      identificacao: 'pendente',
      cliente: null,
      etapa: 'comprando',
      pagamento: 'pendente',
      confirmado: null,
      comprovante: null,
    });
  }
  function identificar(cliente: Cliente | null) {
    const atual = lerStorage<Atendimento | null>('atendimento', atendimentoPersistidoSchema, null);
    // Uma resposta atrasada de CPF não pode identificar outro atendimento nem desfazer a opção Visitante.
    if (!atual || atual.id !== atendimento?.id || atual.identificacao !== 'pendente') return false;
    setAtendimento({ ...atual, cliente, identificacao: cliente ? 'identificado' : 'visitante' });
    return true;
  }
  function confirmarPagamento(resumo: Resumo) {
    const atual = lerStorage<Atendimento | null>('atendimento', atendimentoPersistidoSchema, null);
    if (!atual || atual.identificacao === 'pendente')
      throw new Error('Inicie e identifique o atendimento antes do pagamento.');
    if (!resumo.itens.length && !atual.confirmado)
      throw new Error('Adicione produtos antes de pagar.');
    const confirmado = atual.confirmado ?? resumo;
    // A primeira confirmação congela os valores. Retomar não recalcula o que já foi confirmado.
    setAtendimento({ ...atual, confirmado, etapa: 'pagando', pagamento: 'processando' });
    return confirmado;
  }
  const falharPagamento = useCallback(
    (atendimentoId: string) => {
      setAtendimento((anterior) =>
        anterior?.id === atendimentoId ? { ...anterior, pagamento: 'falhou' } : anterior,
      );
    },
    [setAtendimento],
  );
  const aprovarPagamento = useCallback(
    async (atendimentoId: string): Promise<Venda> => {
      // Web Locks serializa a aprovação entre abas; a chave de negócio é o atendimento.
      const registrar = () => {
        const existentes = lerStorage('vendas', vendasSchema, vendasIniciais);
        const existente = existentes.find((venda) => venda.atendimentoId === atendimentoId);
        if (existente) return existente;
        const atual = lerStorage<Atendimento | null>(
          'atendimento',
          atendimentoPersistidoSchema,
          null,
        );
        if (!atual || atual.id !== atendimentoId || !atual.confirmado)
          throw new Error('O atendimento mudou. Confira a compra antes de continuar.');
        const nova: Venda = {
          ...atual.confirmado,
          id: crypto.randomUUID(),
          atendimentoId,
          numero: `PV-${String(existentes.length + 1).padStart(4, '0')}`,
          data: new Date().toISOString(),
          cliente: atual.cliente,
          pagamento: 'aprovado',
          preparacao: 'aguardando',
        };
        // Gravar a venda primeiro permite recuperá-la mesmo se a próxima escrita for interrompida.
        setVendas((anteriores) => incluirVendaUnica(anteriores, nova));
        setAtendimento({ ...atual, etapa: 'aprovado', pagamento: 'aprovado' });
        return nova;
      };
      if (!navigator.locks)
        throw new Error(
          'Use um navegador atualizado com suporte a Web Locks em localhost ou HTTPS para concluir a compra com segurança.',
        );
      return navigator.locks.request('ponto-verde:aprovar-venda', registrar);
    },
    [setVendas, setAtendimento],
  );
  function concluir(tipo: 'impresso' | 'email', email?: string) {
    if (!vendaAtual) throw new Error('Não existe uma venda aprovada.');
    setAtendimento((anterior) =>
      anterior?.id === vendaAtual.atendimentoId
        ? { ...anterior, etapa: 'concluido', comprovante: tipo, emailComprovante: email }
        : anterior,
    );
  }
  const limparAtendimento = useCallback(() => {
    limparCarrinho();
    setAtendimento(null);
  }, [limparCarrinho, setAtendimento]);
  function atualizarPreparacao(id: string, status: Venda['preparacao']) {
    setVendas((anteriores) =>
      anteriores.map((venda) => {
        if (venda.id !== id) return venda;
        const agora = new Date().toISOString();
        if (status === 'em_preparacao' && venda.preparacao === 'aguardando')
          return { ...venda, preparacao: status, inicioPreparacao: agora };
        if (status === 'concluido' && venda.preparacao === 'em_preparacao')
          return { ...venda, preparacao: status, fimPreparacao: agora };
        return venda;
      }),
    );
  }
  return (
    <AtendimentoContext.Provider
      value={{
        atendimento,
        vendas,
        vendaAtual,
        iniciar,
        identificar,
        confirmarPagamento,
        falharPagamento,
        aprovarPagamento,
        concluir,
        limparAtendimento,
        atualizarPreparacao,
      }}
    >
      {children}
    </AtendimentoContext.Provider>
  );
}
