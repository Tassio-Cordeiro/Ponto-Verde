import type { Venda } from '../types/index.ts';
export const statusPedido: Record<Venda['preparacao'], { texto: string; cor: string }> = {
  aguardando: { texto: 'Aguardando', cor: 'orange' },
  em_preparacao: { texto: 'Em preparação', cor: 'blue' },
  concluido: { texto: 'Concluído', cor: 'verde' },
};
