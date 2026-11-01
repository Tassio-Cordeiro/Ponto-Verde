import type { ItemVenda, Produto } from '../types/index.ts';
export const moeda = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
// O desconto é arredondado por unidade, em centavos, antes de multiplicar a quantidade.
export const descontoUnitario = (produto: Produto) =>
  Math.round((produto.precoCentavos * produto.desconto) / 100);
export const precoFinal = (produto: Produto) => produto.precoCentavos - descontoUnitario(produto);
export function calcularResumo(itens: ItemVenda[]) {
  const subtotal = itens.reduce((soma, item) => soma + item.precoCentavos * item.quantidade, 0);
  const descontos = itens.reduce(
    (soma, item) => soma + item.descontoUnitarioCentavos * item.quantidade,
    0,
  );
  return { itens, subtotal, descontos, total: subtotal - descontos };
}
