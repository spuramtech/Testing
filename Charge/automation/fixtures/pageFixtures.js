const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { NavigationPage } = require('../pages/NavigationPage');
const { ChargePage } = require('../pages/ChargePage');
const { config } = require('../utils/envConfig');
const { logger } = require('../utils/logger');

/**
 * This demo server keeps its session token in sessionStorage (not cookies /
 * localStorage), so Playwright's storageState() cannot persist it, and the
 * server cannot reliably handle a fresh login for every single test. Instead
 * we log in ONCE per worker and reuse that same authenticated page for every
 * test the worker runs — this is why `page` itself is overridden below at
 * worker scope rather than using Playwright's default per-test page.
 */
const test = base.test.extend({
  workerPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      logger.executionStart('worker authentication');
      await loginPage.open(config.baseUrl);
      await loginPage.login(config.loginUsername, config.loginPassword);
      await page.getByText(/bank balance/i).waitFor({ state: 'visible', timeout: 15000 });
      logger.executionEnd('worker authentication');

      await use(page);

      await context.close();
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },

  chargePage: async ({ page }, use) => {
    await use(new ChargePage(page));
  },

  // Reuses the already-authenticated worker page and navigates in-app (no
  // page.goto/full reload — this Angular SPA reloads slowly and a hard
  // reload risks losing the sessionStorage-backed session). Any modal left
  // open by a previous test is closed first so each test starts clean.
  chargeScreen: async ({ page, navigationPage, chargePage }, use) => {
    logger.executionStart('chargeScreen fixture');
    if (await chargePage.panel.isVisible().catch(() => false)) {
      await chargePage.closePanel().catch(() => null);
    }
    await navigationPage.goToChargeScreen();
    await use(chargePage);
    logger.executionEnd('chargeScreen fixture');
  },
});

const expect = base.expect;

module.exports = { test, expect };
