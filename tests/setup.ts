import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import { servidor } from './mocks/server.ts';
import { avisosArmazenamento } from '../src/utils/armazenamento.ts';

const chamadasInesperadas = new Set<string>();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
  }),
});
class ObservadorDeTamanho {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ObservadorDeTamanho);
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value() {} });
// O jsdom não implementa Web Locks. Os cenários deste ambiente são sequenciais;
// o Chromium dos E2E utiliza a implementação real do navegador.
Object.defineProperty(navigator, 'locks', {
  configurable: true,
  value: { request: async (_nome: string, tarefa: () => unknown) => tarefa() },
});

beforeAll(() =>
  servidor.listen({
    onUnhandledRequest(request, imprimir) {
      chamadasInesperadas.add(`${request.method} ${request.url}`);
      imprimir.error();
    },
  }),
);
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  avisosArmazenamento.clear();
  chamadasInesperadas.clear();
});
afterEach(() => {
  cleanup();
  notifications.clean();
  servidor.resetHandlers();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
  avisosArmazenamento.clear();
  expect([...chamadasInesperadas], 'Toda chamada HTTP precisa de um handler de teste.').toEqual([]);
});
afterAll(() => servidor.close());
