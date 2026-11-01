import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../src/app/theme.ts';
import { AuthProvider } from '../src/contexts/AuthContext.tsx';
import { LojaProvider } from '../src/contexts/LojaContext.tsx';
import { AtendimentoProvider } from '../src/contexts/AtendimentoContext.tsx';
import { gravarStorage } from '../src/utils/armazenamento.ts';
import type { Ajustes, Atendimento, ItemCarrinho, Venda } from '../src/types/index.ts';

interface OpcoesRender {
  rota?: string;
  contextos?: 'visuais' | 'loja' | 'compra' | 'aplicacao';
  notificacoes?: boolean;
  estadoInicial?: {
    catalogo?: Ajustes;
    atendimento?: Atendimento | null;
    carrinho?: ItemCarrinho[];
    vendas?: Venda[];
  };
}
export function renderComProviders(
  ui: ReactNode,
  {
    rota = '/produtos',
    contextos = 'compra',
    notificacoes = true,
    estadoInicial = {},
  }: OpcoesRender = {},
) {
  // Apenas valores explícitos são gravados. Uma remontagem sem estadoInicial preserva o storage.
  Object.entries(estadoInicial).forEach(([chave, valor]) => gravarStorage(chave, valor));
  function ProvidersNegocio({ children }: { children: ReactNode }) {
    if (contextos === 'visuais') return children;
    if (contextos === 'loja') return <LojaProvider>{children}</LojaProvider>;
    const compra = (
      <LojaProvider>
        <AtendimentoProvider>{children}</AtendimentoProvider>
      </LojaProvider>
    );
    return contextos === 'aplicacao' ? <AuthProvider>{compra}</AuthProvider> : compra;
  }
  return render(
    <StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="light">
        {notificacoes && <Notifications />}
        <MemoryRouter initialEntries={[rota]}>
          <ProvidersNegocio>{ui}</ProvidersNegocio>
        </MemoryRouter>
      </MantineProvider>
    </StrictMode>,
  );
}
