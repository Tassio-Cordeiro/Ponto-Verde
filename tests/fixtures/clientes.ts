import type { Atendimento, Cliente } from '../../src/types/index.ts';

export const clienteConhecido: Cliente = {
  id: 'cliente-demo-1',
  dummyJsonId: 1,
  nome: 'Ana de Teste',
  cpf: '52998224725',
  email: 'ana@example.com',
};
export const atendimentoVisitante: Atendimento = {
  id: 'atendimento-publico-teste',
  identificacao: 'visitante',
  cliente: null,
  etapa: 'comprando',
  pagamento: 'pendente',
  confirmado: null,
  comprovante: null,
};
