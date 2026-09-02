const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { PreClosurePage } = require('../pages/PreClosurePage');

const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  preClosurePage: async ({ page }, use) => {
    await use(new PreClosurePage(page));
  },
  loggedInPage: async ({ page, baseURL }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(baseURL);
    await loginPage.login(process.env.LOGIN_USERNAME, process.env.LOGIN_PASSWORD);
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

const expect = base.expect;

module.exports = { test, expect };
