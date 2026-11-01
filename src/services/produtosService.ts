import { z } from 'zod';
import { api } from './api.ts';
import { listagemProdutosSchema, validar } from '../schemas/dominio.ts';
import type { Produto, ProdutoApi } from '../types/index.ts';

// Metadados traduzem a apresentação; IDs e valores continuam vindo da API.
const metadados: Record<string, { nome: string; grupo: Produto['grupo'] }> = {
  Apple: { nome: 'Maçã', grupo: 'Hortifruti' },
  'Beef Steak': { nome: 'Bife bovino', grupo: 'Carnes' },
  'Cat Food': { nome: 'Ração para gatos', grupo: 'Outros' },
  'Chicken Meat': { nome: 'Carne de frango', grupo: 'Carnes' },
  'Cooking Oil': { nome: 'Óleo de cozinha', grupo: 'Mercearia' },
  Cucumber: { nome: 'Pepino', grupo: 'Hortifruti' },
  'Dog Food': { nome: 'Ração para cães', grupo: 'Outros' },
  Eggs: { nome: 'Ovos', grupo: 'Refrigerados' },
  'Fish Steak': { nome: 'Filé de peixe', grupo: 'Carnes' },
  'Green Bell Pepper': { nome: 'Pimentão verde', grupo: 'Hortifruti' },
  'Green Chili Pepper': { nome: 'Pimenta verde', grupo: 'Hortifruti' },
  'Honey Jar': { nome: 'Mel', grupo: 'Mercearia' },
  'Ice Cream': { nome: 'Sorvete', grupo: 'Refrigerados' },
  Juice: { nome: 'Suco', grupo: 'Bebidas' },
  Kiwi: { nome: 'Kiwi', grupo: 'Hortifruti' },
  Lemon: { nome: 'Limão', grupo: 'Hortifruti' },
  Milk: { nome: 'Leite', grupo: 'Refrigerados' },
  Mulberry: { nome: 'Amora', grupo: 'Hortifruti' },
  'Nescafe Coffee': { nome: 'Café solúvel', grupo: 'Mercearia' },
  Potatoes: { nome: 'Batatas', grupo: 'Hortifruti' },
  'Protein Powder': { nome: 'Proteína em pó', grupo: 'Mercearia' },
  'Red Onions': { nome: 'Cebola roxa', grupo: 'Hortifruti' },
  Rice: { nome: 'Arroz', grupo: 'Mercearia' },
  'Soft Drinks': { nome: 'Refrigerante', grupo: 'Bebidas' },
  Strawberry: { nome: 'Morango', grupo: 'Hortifruti' },
  'Tissue Paper Box': { nome: 'Lenços de papel', grupo: 'Outros' },
  Water: { nome: 'Água mineral', grupo: 'Bebidas' },
};
export function adaptarProduto(produto: ProdutoApi): Produto {
  const meta = metadados[produto.title];
  return {
    id: `api-${produto.id}`,
    dummyJsonId: produto.id,
    origem: 'dummyjson',
    nome: meta?.nome ?? produto.title,
    descricao: meta
      ? `${meta.nome} para o seu dia a dia. Produto vendido por unidade neste minimercado de demonstração.`
      : produto.description,
    precoCentavos: Math.round(produto.price * 100),
    desconto: produto.discountPercentage,
    estoque: produto.stock,
    imagem: produto.thumbnail,
    grupo: meta?.grupo ?? 'Outros',
    codigoBarras: produto.meta?.barcode,
  };
}
export async function listarProdutos(signal?: AbortSignal) {
  const resposta = await api.get<unknown>('/products/category/groceries?limit=0', { signal });
  return validar(listagemProdutosSchema, resposta.data, 'catálogo').products.map(adaptarProduto);
}
const operacaoSchema = z.object({ id: z.number().int().positive() });
export async function salvarProdutoRemoto(produto: Produto, novo: boolean) {
  const corpo = {
    title: produto.nome,
    description: produto.descricao,
    price: produto.precoCentavos / 100,
    discountPercentage: produto.desconto,
    stock: produto.estoque,
    thumbnail: produto.imagem,
    category: 'groceries',
  };
  const resposta = novo
    ? await api.post<unknown>('/auth/products/add', corpo)
    : await api.patch<unknown>(`/auth/products/${produto.dummyJsonId}`, corpo);
  validar(operacaoSchema, resposta.data, 'gravação do produto');
}
export async function excluirProdutoRemoto(id: number) {
  const resposta = await api.delete<unknown>(`/auth/products/${id}`);
  validar(
    operacaoSchema.extend({ isDeleted: z.literal(true) }),
    resposta.data,
    'exclusão do produto',
  );
}
