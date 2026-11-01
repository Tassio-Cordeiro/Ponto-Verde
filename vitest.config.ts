import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      environmentOptions: { jsdom: { url: 'http://localhost/' } },
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: [
          'src/utils/**/*.ts',
          'src/services/**/*.ts',
          'src/schemas/**/*.ts',
          'src/hooks/**/*.ts',
          'src/contexts/**/*.tsx',
          'src/components/totem/**/*.tsx',
          'src/pages/totem/**/*.tsx',
          'src/routes/**/*.tsx',
        ],
      },
    },
  }),
);
