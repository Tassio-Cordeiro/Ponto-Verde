import type { Ajustes, ItemCarrinho, Produto } from '../types/index.ts';
export function aplicarAjustes(originais: Produto[], ajustes: Ajustes): Produto[] {
  const mapa = new Map(originais.map((produto) => [produto.id, produto]));
  ajustes.produtos.forEach((produto) => mapa.set(produto.id, produto));
  return [...mapa.values()].filter((produto) => !ajustes.excluidos.includes(produto.id));
}
export function ajustarCarrinho(carrinho: ItemCarrinho[], produtos: Produto[]): ItemCarrinho[] {
  return carrinho.flatMap((item) => {
    const produto = produtos.find((p) => p.id === item.produtoId);
    return produto && produto.estoque > 0
      ? [{ ...item, quantidade: Math.min(item.quantidade, produto.estoque) }]
      : [];
  });
}
