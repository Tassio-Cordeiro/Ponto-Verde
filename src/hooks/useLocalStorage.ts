import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';
import { chaveStorage, gravarStorage, lerStorage } from '../utils/armazenamento.ts';
export function useLocalStorage<T>(nome: string, schema: z.ZodType<T>, inicial: T) {
  const [valor, setValor] = useState<T>(() => lerStorage(nome, schema, inicial));
  const atualizar = useCallback(
    (proximo: T | ((anterior: T) => T)) => {
      // A escrita ocorre na ação, e não dentro do updater de useState, que o StrictMode pode repetir.
      const anterior = lerStorage(nome, schema, inicial);
      const novo =
        typeof proximo === 'function' ? (proximo as (anterior: T) => T)(anterior) : proximo;
      gravarStorage(nome, novo);
      setValor(novo);
      return novo;
    },
    [nome, schema, inicial],
  );
  useEffect(() => {
    // storage sincroniza outras abas; o evento próprio sincroniza consumidores desta aba.
    const sincronizar = () => setValor(lerStorage(nome, schema, inicial));
    const externo = (evento: StorageEvent) => {
      if (evento.key === chaveStorage(nome) || evento.key === null) sincronizar();
    };
    const interno = (evento: Event) => {
      if (evento instanceof CustomEvent && evento.detail === chaveStorage(nome)) sincronizar();
    };
    window.addEventListener('storage', externo);
    window.addEventListener('ponto-verde:storage', interno);
    return () => {
      window.removeEventListener('storage', externo);
      window.removeEventListener('ponto-verde:storage', interno);
    };
  }, [nome, schema, inicial]);
  return [valor, atualizar] as const;
}
