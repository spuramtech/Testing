const { test, expect } = require('../../fixtures');

test.describe('Gold Estimate Approval Queue – usability, accessibility, responsive', () => {
  test('TC_EQ_049 - At tablet width (768px) the queue fits without page-level horizontal scroll @regression', async ({ page, checkerQ, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    record(`scrollWidth ${sw}`);
    expect(sw).toBeLessThanOrEqual(768);
  });

  test('TC_EQ_050 - Search box and status filter have accessible names @regression', async ({ checkerQ, record }) => {
    const named = async (loc) => loc.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')));
    const res = { search: await named(checkerQ.search), status: await named(checkerQ.statusFilter) };
    record(JSON.stringify(res));
    expect(res).toEqual({ search: true, status: true });
  });
});
