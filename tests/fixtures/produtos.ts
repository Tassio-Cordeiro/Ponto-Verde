import type { Produto, ProdutoApi } from '../../src/types/index.ts';

// Contrato externo: os IDs e títulos são os usados pelo adaptador real do catálogo.
export const produtosApi: ProdutoApi[] = [
  {
    id: 38,
    title: 'Rice',
    description: 'Arroz de demonstração.',
    price: 10,
    discountPercentage: 0,
    stock: 3,
    thumbnail: '/Ponto-Verde/favicon.svg',
    images: ['/Ponto-Verde/favicon.svg'],
    category: 'groceries',
    meta: { barcode: '7890000000038' },
  },
  {
    id: 32,
    title: 'Milk',
    description: 'Leite de demonstração.',
    price: 5,
    discountPercentage: 0,
    stock: 4,
    thumbnail: '/Ponto-Verde/favicon.svg',
    images: ['/Ponto-Verde/favicon.svg'],
    category: 'groceries',
    meta: { barcode: '7890000000032' },
  },
  {
    id: 34,
    title: 'Nescafe Coffee',
    description: 'Café de demonstração.',
    price: 8,
    discountPercentage: 10,
    stock: 2,
    thumbnail: '/Ponto-Verde/favicon.svg',
    images: ['/Ponto-Verde/favicon.svg'],
    category: 'groceries',
    meta: { barcode: '7890000000034' },
  },
];
export const respostaProdutos = { products: produtosApi, total: 3, skip: 0, limit: 3 };

// Modelo interno: separado da resposta HTTP para permitir testes diretos das regras.
export const arroz: Produto = {
  id: 'api-38',
  dummyJsonId: 38,
  origem: 'dummyjson',
  nome: 'Arroz',
  descricao: 'Arroz de demonstração.',
  precoCentavos: 1000,
  desconto: 0,
  estoque: 3,
  imagem: '/Ponto-Verde/favicon.svg',
  grupo: 'Mercearia',
  codigoBarras: '7890000000038',
};
export const leite: Produto = {
  ...arroz,
  id: 'api-32',
  dummyJsonId: 32,
  nome: 'Leite',
  precoCentavos: 500,
  estoque: 4,
  grupo: 'Refrigerados',
  codigoBarras: '7890000000032',
};
export const cafe: Produto = {
  ...arroz,
  id: 'api-34',
  dummyJsonId: 34,
  nome: 'Café solúvel',
  precoCentavos: 800,
  desconto: 10,
  estoque: 2,
  codigoBarras: '7890000000034',
};
export const produtoLocal: Produto = {
  id: 'produto-local-teste',
  origem: 'local',
  nome: 'Pão local',
  descricao: 'Produto criado no navegador.',
  precoCentavos: 350,
  desconto: 0,
  estoque: 2,
  imagem: '/Ponto-Verde/favicon.svg',
  grupo: 'Mercearia',
};
