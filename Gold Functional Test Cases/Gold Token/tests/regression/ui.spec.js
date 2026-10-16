const { test, expect } = require('../../fixtures');

test.describe('Gold Token – usability, accessibility, responsive', () => {
  test('TC_GT_039 - At tablet width (768px) the token page has no page-level horizontal scroll @regression', async ({ page, gt, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    record(`scrollWidth ${sw}`);
    expect(sw).toBeLessThanOrEqual(768);
  });

  test('TC_GT_040 - Nominee and amount fields have accessible names @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    const named = async (loc) => loc.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')));
    const res = { name: await named(gt.nomineeName), contact: await named(gt.nomineeContact), proportion: await named(gt.proportion) };
    record(JSON.stringify(res));
    expect(res).toEqual({ name: true, contact: true, proportion: true });
  });
});
