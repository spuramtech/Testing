const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { NavigationPage } = require('../../pages/NavigationPage');
const { ChargePage } = require('../../pages/ChargePage');
const { config } = require('../../utils/envConfig');

/**
 * Session/authorization tests need their own fresh browser context (not the
 * shared authenticated worker page from fixtures/pageFixtures.js) because
 * they deliberately corrupt or clear the session.
 */
test.describe('Charge screen - session & access control @security @regression', () => {
  test('an expired/cleared session redirects away from the Charge screen on reload @negative @security', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigationPage = new NavigationPage(page);

    await loginPage.open(config.baseUrl);
    await loginPage.login(config.loginUsername, config.loginPassword);
    await page.getByText(/bank balance/i).waitFor({ state: 'visible', timeout: 15000 });

    await navigationPage.goToChargeScreen();
    await expect(new ChargePage(page).searchBox).toBeVisible();

    // Simulate session expiry: this app persists its token in sessionStorage.
    await page.evaluate(() => window.sessionStorage.clear());
    await page.reload();

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 15000 });
  });

  test('navigating directly to the Charge screen route without logging in redirects to login @negative @security', async ({ page }) => {
    await page.goto(`${config.baseUrl}#/loan-configuration/charge`);

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 15000 });
  });

  test('a tampered/invalid auth token is rejected and the user is signed out @negative @security', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open(config.baseUrl);
    await loginPage.login(config.loginUsername, config.loginPassword);
    await page.getByText(/bank balance/i).waitFor({ state: 'visible', timeout: 15000 });

    // Corrupt whatever auth token the app stored under sessionStorage.
    await page.evaluate(() => {
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (/token|auth/i.test(key)) {
          window.sessionStorage.setItem(key, 'tampered-invalid-token');
        }
      }
    });
    await page.reload();

    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 15000 });
  });

  // Requires a second, lower-privileged user's credentials. Not present in
  // .env.* today, so skipped by default; set the two vars to enable.
  test(
    'a read-only/restricted role cannot see Charge create/edit/delete actions @negative @security',
    async ({ page }) => {
      test.skip(
        !process.env.RESTRICTED_USERNAME || !process.env.RESTRICTED_PASSWORD,
        'Set RESTRICTED_USERNAME and RESTRICTED_PASSWORD to run role-based access tests'
      );

      const loginPage = new LoginPage(page);
      const navigationPage = new NavigationPage(page);

      await loginPage.open(config.baseUrl);
      await loginPage.login(process.env.RESTRICTED_USERNAME, process.env.RESTRICTED_PASSWORD);
      await page.getByText(/bank balance/i).waitFor({ state: 'visible', timeout: 15000 });

      await navigationPage.goToChargeScreen();
      const chargePage = new ChargePage(page);

      await expect(chargePage.newButton).toBeHidden();
      const row = chargePage.gridRows.first();
      await expect(row.locator('#icon-edit, .k-grid-edit-command')).toBeHidden();
      await expect(row.locator('#icon-delete, .k-grid-remove-command')).toBeHidden();
    }
  );
});
