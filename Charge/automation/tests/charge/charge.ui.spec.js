const AxeBuilder = require('@axe-core/playwright').default;
const { test, expect } = require('../../fixtures/pageFixtures');

test.describe('Charge screen - UI, accessibility & cross-browser @ui @crossbrowser', () => {
  test('Charge screen breadcrumb reflects the navigation path @ui @sanity', async ({ page, chargeScreen }) => {
    await expect(page.getByText(/loans/i).first()).toBeVisible();
    await expect(page.getByText(/loan configuration/i).first()).toBeVisible();
    await expect(page.getByText(/^charge$/i).first()).toBeVisible();
  });

  test('grid displays Charge, Type Of Ledger and Applicable columns @ui @sanity', async ({ page, chargeScreen }) => {
    await expect(page.getByText(/^charge$/i).first()).toBeVisible();
    await expect(page.getByText(/type of ledger/i).first()).toBeVisible();
    await expect(page.getByText(/^applicable$/i).first()).toBeVisible();
  });

  test('Charge screen has no critical accessibility violations @accessibility', async ({ page, chargeScreen }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test('page renders correctly at a mobile viewport width @responsive', async ({ page, chargeScreen }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: /\+?\s*new/i })).toBeVisible();
  });

  test('page renders correctly at a tablet viewport width @responsive', async ({ page, chargeScreen }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('button', { name: /\+?\s*new/i })).toBeVisible();
  });
});
