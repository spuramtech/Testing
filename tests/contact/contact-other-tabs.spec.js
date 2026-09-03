const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');

const { CREDS } = require('../../utils/config');
const TABS = ['Employees', 'Referrals', 'Party', 'Advocates'];

test.describe('Contact Module - Other Category Tabs', () => {
  for (const tabName of TABS) {
    test(`TC_CONTACT_TAB_${tabName.toUpperCase()}_01 - "${tabName}" tab loads its own list with pagination`, async ({ page }) => {
      await loginAndSelectBranch(page, '/', CREDS);
      const contact = new ContactPage(page);
      await contact.openFromDashboard();
      await page.getByText(tabName, { exact: true }).click();
      await page.waitForTimeout(1200);
      await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    });

    test(`TC_CONTACT_TAB_${tabName.toUpperCase()}_02 - "${tabName}" tab search box is present and searchable`, async ({ page }) => {
      await loginAndSelectBranch(page, '/', CREDS);
      const contact = new ContactPage(page);
      await contact.openFromDashboard();
      await page.getByText(tabName, { exact: true }).click();
      await page.waitForTimeout(1000);
      await expect(page.locator('#pSearchText')).toBeVisible();
    });
  }
});
