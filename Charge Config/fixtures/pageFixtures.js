const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ChargeConfigurationPage } = require('../pages/ChargeConfigurationPage');
const { CREDENTIALS } = require('../constants/testData');

const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  chargeConfigurationPage: async ({ page }, use) => {
    await use(new ChargeConfigurationPage(page));
  },

  // Logs in and lands on the Charge Configuration page before the test body runs.
  authenticatedPage: async ({ page, loginPage, chargeConfigurationPage }, use) => {
    await loginPage.open();
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await chargeConfigurationPage.navigateFromMainMenu();
    await use(page);
  },
});

const expect = base.expect;

module.exports = { test, expect };
