const { test, expect } = require('../../fixtures');

test.describe('Gold Scheme Matrix – usability, accessibility, responsive', () => {
  test('TC_GS_065 - At tablet width (768px) the grid and the New Scheme panel are usable @regression', async ({ page, gsm, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await gsm.openNew();
    const box = await gsm.saveBtn.boundingBox();
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    record(`scrollWidth ${sw}; Save Scheme right edge ${box && Math.round(box.x + box.width)}`);
    expect(box && box.x + box.width).toBeLessThanOrEqual(768);
  });

  test('TC_GS_066 - Form fields have accessible names @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    const fields = { Loan: gsm.loan, 'Scheme Code': gsm.code, 'Scheme Name': gsm.name, Tenure: gsm.tenure, 'Scheme Type': gsm.type, 'Interest rate': gsm.rate, 'Effective From': gsm.effectiveFrom };
    const missing = [];
    for (const [n, loc] of Object.entries(fields)) {
      const ok = await loc.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')));
      if (!ok) missing.push(n);
    }
    record(`Without accessible name: ${missing.join(', ') || 'none'}`);
    expect(missing).toEqual([]);
  });

  test('TC_GS_067 - Row actions have tooltips "Edit" and "Delete" @regression', async ({ page, gsm, record }) => {
    const row = page.locator('tr:visible', { has: page.locator('[title=Edit]') }).first();
    const titles = await row.locator('button[title]').evaluateAll((b) => b.map((x) => x.title));
    record(titles.join(', '));
    expect(titles).toEqual(['Edit', 'Delete']);
    void gsm;
  });
});
