import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularResumo, descontoUnitario, moeda } from '../src/utils/moeda.ts';
import { normalizarCpf, validarCpf } from '../src/utils/cpf.ts';
import { incluirVendaUnica } from '../src/utils/vendas.ts';
import { aplicarAjustes, ajustarCarrinho } from '../src/utils/catalogo.ts';
import { produtoSchema, tokensSchema, vendaSchema } from '../src/schemas/dominio.ts';
import type { Produto, Venda } from '../src/types/index.ts';

const produto: Produto = {
  id: 'local-1',
  origem: 'local',
  nome: 'Arroz',
  descricao: 'Arroz',
  precoCentavos: 199,
  desconto: 10,
  estoque: 10,
  imagem: '',
  grupo: 'Mercearia',
};
const itens = [
  {
    produtoId: produto.id,
    nome: produto.nome,
    quantidade: 3,
    precoCentavos: produto.precoCentavos,
    descontoUnitarioCentavos: descontoUnitario(produto),
    imagem: '',
  },
];
const resumo = calcularResumo(itens);
const venda: Venda = {
  ...resumo,
  id: 'venda-1',
  atendimentoId: 'atendimento-1',
  numero: 'PV-0001',
  data: new Date().toISOString(),
  cliente: null,
  pagamento: 'aprovado',
  preparacao: 'aguardando',
};

test('calcula centavos e arredonda desconto por unidade antes da multiplicação', () => {
  assert.equal(descontoUnitario(produto), 20);
  assert.equal(resumo.subtotal, 597);
  assert.equal(resumo.descontos, 60);
  assert.equal(resumo.total, 537);
  assert.match(moeda(resumo.total), /5,37/);
});
test('não acumula erros de ponto flutuante em somas monetárias', () => {
  const soma = calcularResumo([
    { ...itens[0], precoCentavos: 10, quantidade: 3, descontoUnitarioCentavos: 0 },
  ]);
  assert.equal(soma.total, 30);
});
test('uma segunda tentativa do mesmo atendimento preserva exatamente a primeira venda', () => {
  const existentes = [venda];
  const resultado = incluirVendaUnica(existentes, { ...venda, id: 'outra-tentativa', total: 999 });
  assert.equal(resultado, existentes);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].total, 537);
});
test('atendimentos diferentes podem gerar novas vendas sem mutar o histórico', () => {
  const existentes = [venda];
  const resultado = incluirVendaUnica(existentes, {
    ...venda,
    id: 'venda-2',
    atendimentoId: 'atendimento-2',
  });
  assert.equal(resultado.length, 2);
  assert.equal(existentes.length, 1);
});
test('snapshot da venda conserva o preço mesmo após alteração no produto', () => {
  const alterado = { ...produto, precoCentavos: 999 };
  assert.equal(alterado.precoCentavos, 999);
  assert.equal(venda.itens[0].precoCentavos, 199);
});
test('normaliza e valida os dois CPFs fictícios documentados', () => {
  assert.equal(normalizarCpf('529.982.247-25'), '52998224725');
  assert.ok(validarCpf('529.982.247-25'));
  assert.ok(validarCpf('111.444.777-35'));
  assert.equal(validarCpf('111.111.111-11'), false);
  assert.equal(validarCpf('52998224724'), false);
});
test('Zod rejeita contratos inválidos de produto, token e venda', () => {
  assert.equal(produtoSchema.safeParse({ ...produto, estoque: -1 }).success, false);
  assert.equal(tokensSchema.safeParse({ accessToken: '', refreshToken: 'x' }).success, false);
  assert.equal(vendaSchema.safeParse({ ...venda, total: '537' }).success, false);
  assert.equal(vendaSchema.safeParse(venda).success, true);
});
test('o catálogo efetivo reaplica preços locais, inclui produtos novos e respeita exclusões', () => {
  const original: Produto = { ...produto, id: 'api-1', dummyJsonId: 1, origem: 'dummyjson' };
  const ajustado = { ...original, precoCentavos: 500 };
  const resultado = aplicarAjustes([original], { produtos: [ajustado, produto], excluidos: [] });
  assert.equal(resultado.length, 2);
  assert.equal(resultado.find((p) => p.id === 'api-1')?.precoCentavos, 500);
  assert.equal(original.precoCentavos, 199);
  assert.equal(aplicarAjustes([original], { produtos: [produto], excluidos: ['api-1'] }).length, 1);
});
test('estoque reduzido limita quantidades e produtos removidos saem da sacola', () => {
  const carrinho = [
    { produtoId: produto.id, quantidade: 9 },
    { produtoId: 'removido', quantidade: 2 },
  ];
  assert.deepEqual(ajustarCarrinho(carrinho, [{ ...produto, estoque: 3 }]), [
    { produtoId: produto.id, quantidade: 3 },
  ]);
  assert.equal(carrinho.length, 2);
  assert.equal(carrinho[0].quantidade, 9);
  assert.deepEqual(ajustarCarrinho(carrinho, [{ ...produto, estoque: 0 }]), []);
});
