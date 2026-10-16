// One config for every form. FORM_DIR (set by common/utils/run-form.js) selects the form folder;
// results, screenshots and the Playwright HTML report are written inside that form's folder.
const path = require('path');
const env = require('./common/config/env');
const { defineConfig, devices } = require('@playwright/test');

const BROWSERS = { chromium: devices['Desktop Chrome'], firefox: devices['Desktop Firefox'], webkit: devices['Desktop Safari'] };
const FORM_DIR = process.env.FORM_DIR ? path.resolve(process.env.FORM_DIR) : null;
const OUT = FORM_DIR || path.join(__dirname, 'all-forms');

module.exports = defineConfig({
  testDir: FORM_DIR ? path.join(FORM_DIR, 'tests') : __dirname,
  testMatch: '**/tests/**/*.spec.js',
  testIgnore: '**/node_modules/**',
  outputDir: path.join(OUT, 'test-results', 'artifacts'),
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: 0, // failures are reported as found – no blind retries
  workers: env.workers,
  // results.json (the report's base) is written only by a full run of `npm run form` / form scripts – ad-hoc
  // `npx playwright test` runs and --rerun runs must not replace it
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(OUT, 'reports', 'playwright-html') }],
    ...(process.env.FORM_FULL_RUN === '1' ? [['json', { outputFile: path.join(OUT, 'test-results', 'results.json') }]] : []),
  ],
  use: {
    baseURL: env.baseURL,
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: env.browser, use: { ...BROWSERS[env.browser], viewport: { width: 1440, height: 900 } } }],
});
