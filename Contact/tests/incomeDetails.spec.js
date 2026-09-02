const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { isNonNegativeNumber } = require('../helpers/validators');
const testData = require('../data/contactTestData.json');
const { INCOME_SOURCE_TYPE, TABS } = require('../constants/appConstants');

test.describe('@regression @functional Income Details tab', () => {
  test.beforeEach(async ({ page, contactListPage, contactTabsNav }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    await contactListPage.clickNew();
    await contactTabsNav.openTab(TABS.INCOME_DETAILS);
  });

  test('@positive fills gross/net/expenses with valid amounts', async ({ incomeDetailsPage }) => {
    await incomeDetailsPage.fillTopLevelIncome({
      grossAnnualIncome: 1200000,
      netAnnualIncome: 1000000,
      averageAnnualExpenses: 400000,
    });
  });

  test('@negative rejects negative Gross Annual Income', async ({ incomeDetailsPage }) => {
    expect(isNonNegativeNumber(testData.boundaryAmounts.negative)).toBe(false);
    await incomeDetailsPage.fillTopLevelIncome({ grossAnnualIncome: testData.boundaryAmounts.negative });
  });

  test('@boundary accepts decimal income amount', async ({ incomeDetailsPage }) => {
    await incomeDetailsPage.fillTopLevelIncome({ grossAnnualIncome: testData.boundaryAmounts.decimal });
  });

  for (const type of Object.values(INCOME_SOURCE_TYPE)) {
    test(`@positive switches Income from other sources to ${type}`, async ({ incomeDetailsPage }) => {
      await incomeDetailsPage.selectIncomeSourceType(type);
    });
  }

  test('@positive shows empty grid state by default', async ({ incomeDetailsPage }) => {
    await expect(incomeDetailsPage.gridEmptyState).toBeVisible();
  });
});
