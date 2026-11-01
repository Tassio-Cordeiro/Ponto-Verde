import { z } from 'zod';
import { normalizarCpf, validarCpf } from '../utils/cpf.ts';
import { grupoSchema } from './dominio.ts';
export const cpfFormSchema = z.object({
  cpf: z.string().refine(validarCpf, 'Digite um CPF válido com 11 dígitos.'),
});
export const clienteFormSchema = cpfFormSchema.extend({
  nome: z.string().trim().min(3, 'Informe seu nome com pelo menos 3 caracteres.'),
  email: z.string().trim().email('Informe um e-mail válido.').or(z.literal('')),
});
export const cadastroClienteSchema = clienteFormSchema.extend({
  cpf: z.string().transform(normalizarCpf).refine(validarCpf, 'CPF inválido.'),
});
export const loginFormSchema = z.object({
  username: z.string().trim().min(1, 'Informe o usuário.'),
  password: z.string().min(1, 'Informe a senha.'),
});
export const emailFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
});
export const produtoFormSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.'),
  descricao: z.string().trim().min(5, 'Descreva o produto.'),
  preco: z.number().positive('Informe um preço maior que zero.').max(100_000, 'Preço muito alto.'),
  desconto: z.number().min(0).max(100, 'O desconto máximo é 100%.'),
  estoque: z.number().int('Use uma quantidade inteira.').min(0),
  imagem: z
    .string()
    .url('Informe uma URL válida.')
    .refine((url) => /^https?:\/\//.test(url), 'Use uma imagem HTTP ou HTTPS.')
    .or(z.literal('')),
  grupo: grupoSchema,
  codigoBarras: z.string().regex(/^\d{8,14}$|^$/, 'Use de 8 a 14 dígitos ou deixe vazio.'),
});
