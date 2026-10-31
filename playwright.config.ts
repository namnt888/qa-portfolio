import { defineConfig, devices } from '@playwright/test';
import { DEMO_PORT, isDemoTarget, requirePasscode, resolveBaseUrl } from './tests/env';

const authFile = 'tests/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/.bdd-gen/**', '**/features/**'],
  globalSetup: './tests/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: resolveBaseUrl(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: isDemoTarget()
    ? {
        command: 'node demo/server.mjs',
        url: `http://127.0.0.1:${DEMO_PORT}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 20_000,
        env: { DEMO_PORT: String(DEMO_PORT), DEMO_PASSCODE: requirePasscode() },
      }
    : undefined,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'smoke',
      testDir: './tests/specs/smoke',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'regression',
      testDir: './tests/specs/regression',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'nonfunctional',
      testDir: './tests/specs/nonfunctional',
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: authFile },
    },
    { name: 'api', testDir: './tests/specs/api' },
  ],
});
