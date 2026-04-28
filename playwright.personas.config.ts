import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, 'tests/e2e/.auth/session.json');

export default defineConfig({
  testDir: './tests/personas',
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: [['html', { outputFolder: 'tests/reports/personas-playwright' }], ['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: AUTH_FILE,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
