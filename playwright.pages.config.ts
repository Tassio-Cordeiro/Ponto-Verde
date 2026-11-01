import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './pages-tests',
  testMatch: '**/*.spec.ts',
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: 'test-results-pages',
  reporter: [['list'], ['html', { outputFolder: 'playwright-pages-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4176/Ponto-Verde/',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'pages-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'yarn build:pages && yarn serve:pages',
    url: 'http://127.0.0.1:4176/Ponto-Verde/',
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
