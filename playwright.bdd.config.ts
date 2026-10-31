import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { DEMO_PORT, isDemoTarget, requirePasscode, resolveBaseUrl } from './tests/env';

const testDir = defineBddConfig({
  features: 'tests/features/**/*.feature',
  steps: 'tests/features/steps/**/*.ts',
  outputDir: 'tests/.bdd-gen',
  missingSteps: 'fail-on-run',
  verbose: true,
});

export default defineConfig({
  testDir,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/bdd' }], ['github']]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/bdd' }]],
  use: {
    baseURL: resolveBaseUrl(),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
});
