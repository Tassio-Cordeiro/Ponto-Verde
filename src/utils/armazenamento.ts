import type { z } from 'zod';
import { config } from '../app/config.ts';
export const avisosArmazenamento = new Set<string>();
export const chaveStorage = (nome: string) => `${config.prefixoStorage}${nome}`;
export function lerStorage<T>(
  nome: string,
  schema: z.ZodType<T>,
  inicial: T,
  storage: Storage = localStorage,
): T {
  try {
    const bruto = storage.getItem(chaveStorage(nome));
    if (bruto === null) return inicial;
    const resultado = schema.safeParse(JSON.parse(bruto));
    if (resultado.success) return resultado.data;
    avisosArmazenamento.add(
      `O registro “${nome}” estava inválido e foi recuperado. Os outros dados foram preservados.`,
    );
    storage.removeItem(chaveStorage(nome));
  } catch {
    avisosArmazenamento.add(
      `Não foi possível ler “${nome}”. Verifique o armazenamento do navegador.`,
    );
    try {
      storage.removeItem(chaveStorage(nome));
    } catch {
      /* O navegador pode bloquear todo o armazenamento. */
    }
  }
  return inicial;
}
export function gravarStorage<T>(nome: string, valor: T, storage: Storage = localStorage) {
  try {
    storage.setItem(chaveStorage(nome), JSON.stringify(valor));
  } catch {
    throw new Error(
      'Não foi possível salvar os dados. Libere espaço ou habilite o armazenamento do navegador.',
    );
  }
  window.dispatchEvent(new CustomEvent('ponto-verde:storage', { detail: chaveStorage(nome) }));
}
