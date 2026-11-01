import { z } from 'zod';
import { validarCpf } from '../utils/cpf.ts';

export const grupoSchema = z.enum([
  'Hortifruti',
  'Mercearia',
  'Bebidas',
  'Refrigerados',
  'Carnes',
  'Outros',
]);
export const produtoApiSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100),
  stock: z.number().int().nonnegative(),
  thumbnail: z.string(),
  images: z.array(z.string()),
  category: z.string(),
  sku: z.string().optional(),
  meta: z.object({ barcode: z.string().optional() }).optional(),
});
export const listagemProdutosSchema = z.object({
  products: z.array(produtoApiSchema),
  total: z.number(),
});
export const produtoSchema = z.object({
  id: z.string().min(1),
  dummyJsonId: z.number().int().positive().optional(),
  origem: z.enum(['dummyjson', 'local']),
  nome: z.string().min(2),
  descricao: z.string(),
  precoCentavos: z.number().int().nonnegative(),
  desconto: z.number().min(0).max(100),
  estoque: z.number().int().nonnegative(),
  imagem: z.string(),
  grupo: grupoSchema,
  codigoBarras: z.string().optional(),
});
export const clienteSchema = z.object({
  id: z.string(),
  dummyJsonId: z.number().int().positive().optional(),
  nome: z.string().min(2),
  cpf: z
    .string()
    .regex(/^\d{11}$/)
    .refine(validarCpf, 'CPF inválido.'),
  email: z.string().email().or(z.literal('')),
});
export const perfilSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.string(),
  image: z.string().optional(),
});
export const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export const itemCarrinhoSchema = z.object({
  produtoId: z.string(),
  quantidade: z.number().int().positive(),
});
export const itemVendaSchema = z.object({
  produtoId: z.string(),
  dummyJsonId: z.number().int().positive().optional(),
  nome: z.string(),
  quantidade: z.number().int().positive(),
  precoCentavos: z.number().int().nonnegative(),
  descontoUnitarioCentavos: z.number().int().nonnegative(),
  imagem: z.string(),
});
export const resumoSchema = z.object({
  itens: z.array(itemVendaSchema).min(1),
  subtotal: z.number().int().nonnegative(),
  descontos: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export const pagamentoSchema = z.enum(['pendente', 'processando', 'aprovado', 'falhou']);
export const preparacaoSchema = z.enum(['aguardando', 'em_preparacao', 'concluido']);
export const vendaSchema = resumoSchema.extend({
  id: z.string(),
  atendimentoId: z.string(),
  numero: z.string(),
  data: z.string().datetime(),
  cliente: clienteSchema.nullable(),
  pagamento: z.literal('aprovado'),
  preparacao: preparacaoSchema,
  inicioPreparacao: z.string().datetime().optional(),
  fimPreparacao: z.string().datetime().optional(),
});
export const atendimentoSchema = z.object({
  id: z.string(),
  identificacao: z.enum(['pendente', 'identificado', 'visitante']),
  cliente: clienteSchema.nullable(),
  etapa: z.enum(['comprando', 'pagando', 'aprovado', 'concluido']),
  pagamento: pagamentoSchema,
  confirmado: resumoSchema.nullable(),
  comprovante: z.enum(['impresso', 'email']).nullable(),
  emailComprovante: z.string().optional(),
});
export const ajustesSchema = z.object({
  produtos: z.array(produtoSchema),
  excluidos: z.array(z.string()),
});
export const respostaCarrinhoSchema = z.object({
  id: z.number(),
  userId: z.number(),
  products: z.array(z.object({ id: z.number(), quantity: z.number() })),
  total: z.number(),
  discountedTotal: z.number(),
});
export function validar<T>(schema: z.ZodType<T>, dados: unknown, recurso: string): T {
  const resultado = schema.safeParse(dados);
  if (!resultado.success)
    throw new Error(`Dados inválidos recebidos em ${recurso}. Tente novamente.`);
  return resultado.data;
}
