import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './theme.ts';
import { AuthProvider } from '../contexts/AuthContext.tsx';
import { LojaProvider } from '../contexts/LojaContext.tsx';
import { AtendimentoProvider } from '../contexts/AtendimentoContext.tsx';
import { avisosArmazenamento } from '../utils/armazenamento.ts';

function AvisosPersistencia() {
  useEffect(() => {
    const timer = window.setInterval(() => {
      avisosArmazenamento.forEach((message) =>
        notifications.show({
          color: 'orange',
          title: 'Armazenamento local',
          message,
          autoClose: false,
        }),
      );
      avisosArmazenamento.clear();
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <AvisosPersistencia />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <LojaProvider>
            <AtendimentoProvider>{children}</AtendimentoProvider>
          </LojaProvider>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}
