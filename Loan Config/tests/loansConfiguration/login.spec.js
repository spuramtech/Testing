const { test, expect } = require('../../fixtures/pageFixtures');
const { CREDENTIALS } = require('../../constants/testData');

test.describe('Login @smoke @sanity', () => {
  test('user can log in with valid credentials', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await expect(page).not.toHaveURL(/login/i);
  });

  test('login fails with invalid password @negative', async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(CREDENTIALS.username, 'wrong-password');
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });
});
