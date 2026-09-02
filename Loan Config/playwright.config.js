const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.ENV_FILE || `.env.${process.env.ENV || 'qa'}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    // JUnit XML - import this file into QMetry (or any test-management tool) via its
    // "Import Automation Results" / JUnit import flow.
    ['junit', { outputFile: 'reports/junit/qmetry-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
