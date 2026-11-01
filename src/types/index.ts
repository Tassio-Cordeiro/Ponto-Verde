import { z } from 'zod';
import {
  produtoSchema,
  produtoApiSchema,
  clienteSchema,
  perfilSchema,
  tokensSchema,
  itemCarrinhoSchema,
  itemVendaSchema,
  resumoSchema,
  vendaSchema,
  atendimentoSchema,
  ajustesSchema,
} from '../schemas/dominio.ts';
export type Produto = z.infer<typeof produtoSchema>;
export type ProdutoApi = z.infer<typeof produtoApiSchema>;
export type Cliente = z.infer<typeof clienteSchema>;
export type Perfil = z.infer<typeof perfilSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
export type ItemCarrinho = z.infer<typeof itemCarrinhoSchema>;
export type ItemVenda = z.infer<typeof itemVendaSchema>;
export type Resumo = z.infer<typeof resumoSchema>;
export type Venda = z.infer<typeof vendaSchema>;
export type Atendimento = z.infer<typeof atendimentoSchema>;
export type Ajustes = z.infer<typeof ajustesSchema>;
