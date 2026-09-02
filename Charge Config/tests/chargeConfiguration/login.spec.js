const { test, expect } = require('../../fixtures/pageFixtures');
const { CREDENTIALS } = require('../../constants/testData');

test.describe('Charge Configuration - Login & Navigation @smoke @sanity', () => {
  test('user can log in and navigate to the Charge Configuration screen', async ({ loginPage, chargeConfigurationPage }) => {
    await loginPage.open();
    await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
    await chargeConfigurationPage.navigateFromMainMenu();

    await expect(chargeConfigurationPage.pageHeading).toBeVisible();
    await expect(chargeConfigurationPage.loanTypeDropdown).toBeVisible();
    await expect(chargeConfigurationPage.loanNameDropdown).toBeVisible();
    await expect(chargeConfigurationPage.chargeNameDropdown).toBeVisible();
  });

  test('invalid credentials do not reach the Charge Configuration screen @negative', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('invalid.user@kapilit.com', 'wrongPassword123');
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('submitting the login form with empty credentials keeps the user on the login screen @negative', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('', '');
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('valid username with an empty password does not log in @negative', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(CREDENTIALS.username, '');
    await expect(loginPage.signInButton).toBeVisible();
  });
});
