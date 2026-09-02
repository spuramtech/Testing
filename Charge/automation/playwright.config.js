const { defineConfig, devices } = require('@playwright/test');
const { config } = require('./utils/envConfig');

module.exports = defineConfig({
  testDir: './tests',
  timeout: config.defaultTimeout,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    viewport: { width: 1600, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  outputDir: 'test-results/',
});
