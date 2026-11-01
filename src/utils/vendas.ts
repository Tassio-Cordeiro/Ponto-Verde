import type { Venda } from '../types/index.ts';
// A chave de unicidade é o atendimento, não o ID aleatório de cada tentativa.
export function incluirVendaUnica(vendas: Venda[], nova: Venda): Venda[] {
  return vendas.some((venda) => venda.atendimentoId === nova.atendimentoId)
    ? vendas
    : [...vendas, nova];
}
