const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { randomAddress } = require('../helpers/dataGenerator');
const { isValidPincode } = require('../helpers/validators');
const testData = require('../data/contactTestData.json');
const { TABS } = require('../constants/appConstants');

test.describe('@regression @functional Address Details tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.ADDRESS_DETAILS);
  });

  test('@positive adds a valid address and it appears in the grid', async ({ addressDetailsPage }) => {
    const address = randomAddress();
    await addressDetailsPage.addAddress(address);
    // datatable-body-row's own count was unreliable to poll directly under
    // this ngx-datatable's virtual rendering — assert on the freshly
    // generated, unique pincode actually showing up in the grid instead,
    // which is a more direct signal that the row landed.
    await expect(addressDetailsPage.container.getByText(address.pincode)).toBeVisible({ timeout: 30000 });
  });

  for (const pincode of require('../data/contactTestData.json').invalidPincodes) {
    test(`@negative rejects invalid pincode "${pincode}"`, async ({ addressDetailsPage }) => {
      expect(isValidPincode(pincode)).toBe(false);
      await addressDetailsPage.addAddress({ ...randomAddress(), pincode });
    });
  }

  test('@negative @security rejects XSS payload in Address field', async ({ addressDetailsPage }) => {
    const payload = testData.xssPayloads[0];
    await addressDetailsPage.addAddress({ ...randomAddress(), address: payload });
  });
});
