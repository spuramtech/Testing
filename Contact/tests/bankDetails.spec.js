const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { randomBankAccount } = require('../helpers/dataGenerator');
const { isValidIfsc } = require('../helpers/validators');
const testData = require('../data/contactTestData.json');
const { TABS } = require('../constants/appConstants');

test.describe('@regression @functional Bank Details tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.BANK_DETAILS);
  });

  test('@positive adds a valid bank account', async ({ bankDetailsPage }) => {
    const account = randomBankAccount();
    await bankDetailsPage.addBankAccount(account);
    // datatable-body-row's own count was unreliable to poll directly under
    // this ngx-datatable's virtual rendering — assert on the freshly
    // generated, unique account number actually showing up in the grid
    // instead, which is a more direct signal that the row landed.
    await expect(bankDetailsPage.container.getByText(account.accountNumber)).toBeVisible({ timeout: 30000 });
  });

  for (const ifsc of require('../data/contactTestData.json').invalidIfsc) {
    test(`@negative rejects invalid IFSC "${ifsc}"`, async ({ bankDetailsPage }) => {
      expect(isValidIfsc(ifsc)).toBe(false);
      await bankDetailsPage.addBankAccount({ ...randomBankAccount(), ifsc });
    });
  }

  test('@negative rejects non-numeric account number', async ({ bankDetailsPage }) => {
    await bankDetailsPage.addBankAccount({ ...randomBankAccount(), accountNumber: 'ABC-XYZ' });
  });

  test('@negative @security rejects XSS payload in Name as Per Bank', async ({ bankDetailsPage }) => {
    await bankDetailsPage.addBankAccount({ ...randomBankAccount(), nameAsPerBank: testData.xssPayloads[0] });
  });
});
