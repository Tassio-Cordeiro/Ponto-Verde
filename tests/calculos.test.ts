import { describe, expect, it } from 'vitest';
import { calcularResumo, descontoUnitario, precoFinal } from '../src/utils/moeda.ts';
import type { ItemVenda, Produto } from '../src/types/index.ts';
import { arroz, cafe, leite, produtoLocal } from './fixtures/produtos.ts';

function item(produto: Produto, quantidade: number): ItemVenda {
  return {
    produtoId: produto.id,
    nome: produto.nome,
    imagem: produto.imagem,
    precoCentavos: produto.precoCentavos,
    descontoUnitarioCentavos: descontoUnitario(produto),
    quantidade,
  };
}
describe('Valores do carrinho em centavos', () => {
  it('retorna zero para um carrinho vazio', () => {
    expect(calcularResumo([])).toEqual({ itens: [], subtotal: 0, descontos: 0, total: 0 });
  });
  it('duas unidades de arroz custam R$ 20,00', () => {
    expect(calcularResumo([item(arroz, 2)]).total).toBe(2000);
  });
  it('duas unidades de arroz e uma de leite custam R$ 25,00', () => {
    expect(calcularResumo([item(arroz, 2), item(leite, 1)]).total).toBe(2500);
  });
  it('R$ 10,00 com 10% de desconto resulta em R$ 9,00', () => {
    expect(precoFinal({ ...arroz, desconto: 10 })).toBe(900);
  });
  it('duas unidades de café de R$ 8,00 com 10% de desconto custam R$ 14,40', () => {
    expect(calcularResumo([item(cafe, 2)])).toMatchObject({
      subtotal: 1600,
      descontos: 160,
      total: 1440,
    });
  });
  it('inclui um produto exclusivamente local no total da compra', () => {
    expect(calcularResumo([item(arroz, 1), item(produtoLocal, 1)]).total).toBe(1350);
  });
});
