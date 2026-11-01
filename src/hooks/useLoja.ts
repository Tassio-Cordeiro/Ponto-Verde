import { useContext } from 'react';
import { LojaContext } from '../contexts/LojaContext.tsx';
export function useLoja() {
  const contexto = useContext(LojaContext);
  if (!contexto) throw new Error('useLoja deve ser utilizado dentro de LojaProvider.');
  return contexto;
}
