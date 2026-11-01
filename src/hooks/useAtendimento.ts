import { useContext } from 'react';
import { AtendimentoContext } from '../contexts/AtendimentoContext.tsx';
export function useAtendimento() {
  const contexto = useContext(AtendimentoContext);
  if (!contexto)
    throw new Error('useAtendimento deve ser utilizado dentro de AtendimentoProvider.');
  return contexto;
}
