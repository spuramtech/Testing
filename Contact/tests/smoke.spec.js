const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { TABS } = require('../constants/appConstants');

test.describe('@smoke Contact module smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test('@smoke navigates to Contact List and shows the grid', async ({ contactListPage }) => {
    await contactListPage.open();
    await expect(contactListPage.newButton).toBeVisible();
    await expect(contactListPage.pageInfo).toBeVisible();
  });

  test('@smoke opens New Contact wizard with all 8 tabs visible', async ({ contactListPage, contactTabsNav }) => {
    await contactListPage.open();
    await contactListPage.clickNew();
    for (const tabName of Object.values(TABS)) {
      await expect(contactTabsNav.tab(tabName)).toBeVisible();
    }
  });
});
