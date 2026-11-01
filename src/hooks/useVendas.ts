import { useAtendimento } from './useAtendimento.ts';
export type Periodo = 'hoje' | '7dias' | '30dias' | 'todos';
export function useVendas(periodo: Periodo = 'todos') {
  const { vendas } = useAtendimento();
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  if (periodo === '7dias') inicio.setDate(inicio.getDate() - 6);
  if (periodo === '30dias') inicio.setDate(inicio.getDate() - 29);
  const filtradas = vendas.filter(
    (venda) =>
      venda.pagamento === 'aprovado' && (periodo === 'todos' || new Date(venda.data) >= inicio),
  );
  const total = filtradas.reduce((soma, venda) => soma + venda.total, 0);
  const ranking = new Map<string, { nome: string; quantidade: number; total: number }>();
  filtradas.forEach((venda) =>
    venda.itens.forEach((item) => {
      const anterior = ranking.get(item.produtoId);
      ranking.set(item.produtoId, {
        nome: item.nome,
        quantidade: (anterior?.quantidade ?? 0) + item.quantidade,
        total:
          (anterior?.total ?? 0) +
          (item.precoCentavos - item.descontoUnitarioCentavos) * item.quantidade,
      });
    }),
  );
  return {
    vendas: filtradas,
    total,
    quantidade: filtradas.length,
    ticketMedio: filtradas.length ? Math.round(total / filtradas.length) : 0,
    maisVendidos: [...ranking.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, 5),
    aguardando: filtradas.filter((v) => v.preparacao === 'aguardando').length,
    emPreparacao: filtradas.filter((v) => v.preparacao === 'em_preparacao').length,
  };
}
