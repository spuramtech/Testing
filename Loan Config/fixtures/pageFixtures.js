const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { LoansConfigurationListPage } = require('../pages/LoansConfigurationListPage');
const { LoansConfigurationWizardPage } = require('../pages/LoansConfigurationWizardPage');
const { CREDENTIALS } = require('../constants/testData');

const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  loansConfigurationListPage: async ({ page }, use) => {
    await use(new LoansConfigurationListPage(page));
  },

  wizardPage: async ({ page }, use) => {
    await use(new LoansConfigurationWizardPage(page));
  },

  // Logs in and lands on the Loans Configuration list page before the test body runs.
  authenticatedPage: async ({ page, loginPage, loansConfigurationListPage }, use) => {
    await loginPage.open();
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await loansConfigurationListPage.navigateFromMainMenu();
    await use(page);
  },
});

const expect = base.expect;

module.exports = { test, expect };
