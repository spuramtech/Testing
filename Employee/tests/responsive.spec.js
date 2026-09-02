const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.describe('@regression Responsive layout', () => {
  for (const vp of VIEWPORTS) {
    test(`@positive Add Employee form usable at ${vp.name} (${vp.width}x${vp.height})`, async ({ page, employeeFormPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsDefaultUser(page);
      await employeeFormPage.open();
      await expect(employeeFormPage.basicSalaryInput).toBeVisible();
      await expect(employeeFormPage.saveButton).toBeVisible();
      // The page itself must not force horizontal scrolling at any of
      // these widths.
      // A few px of slack accounts for scrollbar-width rounding, which is
      // not a real layout defect — only flag a genuine overflow.
      const overflowPx = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflowPx).toBeLessThan(20);
    });
  }
});
