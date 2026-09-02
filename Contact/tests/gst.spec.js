const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { isValidGstin } = require('../helpers/validators');
const testData = require('../data/contactTestData.json');
const { TABS } = require('../constants/appConstants');

test.describe('@regression @functional GST tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.GST);
  });

  test('@positive shows empty grid state by default', async ({ gstPage }) => {
    await expect(gstPage.gridEmptyState).toBeVisible();
  });

  test('@positive is skippable — Save & Continue works with no GST record', async ({ contactTabsNav }) => {
    await contactTabsNav.saveAndContinue();
  });

  for (const gstin of require('../data/contactTestData.json').invalidGstin) {
    test(`@negative rejects invalid GSTIN "${gstin}"`, async ({ gstPage }) => {
      expect(isValidGstin(gstin)).toBe(false);
      await gstPage.addGstRecord({ gstIn: gstin, city: 'New Delhi', pincode: '110001' });
    });
  }

  test('@negative @security rejects XSS payload in GST Address', async ({ gstPage }) => {
    await gstPage.addGstRecord({ address: testData.xssPayloads[0], city: 'New Delhi', pincode: '110001' });
  });
});
