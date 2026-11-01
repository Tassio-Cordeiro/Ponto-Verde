import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Button, MantineProvider, Stack } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import App from './App.tsx';

async function inicializar() {
  const elemento = document.getElementById('root');
  if (!elemento) throw new Error('Elemento de montagem da aplicação não encontrado.');
  const raiz = createRoot(elemento);
  try {
    // No E2E, o Playwright controla toda a fronteira HTTP e bloqueia Service Workers.
    // Nos demais modos, a API de clientes continua ativa, inclusive no build/preview.
    if (import.meta.env.MODE !== 'e2e') {
      const { worker } = await import('./mocks/browser.ts');
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      });
    }
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch {
    raiz.render(
      <MantineProvider>
        <Stack p="xl">
          <Alert color="red" title="Não foi possível iniciar a API de demonstração">
            Abra a aplicação em localhost ou HTTPS e permita os Service Workers no navegador.
          </Alert>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </Stack>
      </MantineProvider>,
    );
  }
}
void inicializar();
