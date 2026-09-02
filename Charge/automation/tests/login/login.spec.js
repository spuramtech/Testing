const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { config } = require('../../utils/envConfig');

// Login must be exercised in its own fresh, unauthenticated context — not
// the shared authenticated page the rest of the suite reuses (see
// fixtures/pageFixtures.js), so this file uses the plain Playwright test.
test.describe('Login @smoke @sanity @functional', () => {
  test('valid credentials log the user into the application @positive', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open(config.baseUrl);
    await loginPage.login(config.loginUsername, config.loginPassword);
    await expect(page.getByText(/bank balance/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /sign in/i })).toHaveCount(0);
  });

  test('invalid credentials show an error and do not log in @negative', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open(config.baseUrl);
    await loginPage.login('invalid@user.com', 'wrongPassword');
    await expect(loginPage.invalidCredentialsDialog).toBeVisible({ timeout: 10000 });
  });
});
