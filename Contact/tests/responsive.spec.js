const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.describe('@regression Responsive layout', () => {
  for (const vp of VIEWPORTS) {
    test(`@positive Contact List usable at ${vp.name} (${vp.width}x${vp.height})`, async ({ page, contactListPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsDefaultUser(page);
      await contactListPage.open();
      await expect(contactListPage.newButton).toBeVisible();
      const overflowPx = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflowPx).toBeLessThan(20);
    });

    test(`@positive New Contact form usable at ${vp.name} (${vp.width}x${vp.height})`, async ({ page, contactListPage, contactInfoPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsDefaultUser(page);
      await contactListPage.open();
      await contactListPage.clickNew();
      await expect(contactInfoPage.firstNameInput).toBeVisible();
      const overflowPx = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflowPx).toBeLessThan(20);
    });
  }
});
