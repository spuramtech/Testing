const { test, expect } = require('../../fixtures');

test.describe('Gold Estimates – usability, accessibility, responsive', () => {
  test('TC_GE_056 - At tablet width (768px) the grid scrolls inside its box and Save stays reachable @regression', async ({ page, geContact, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    await geContact.saveBtn.scrollIntoViewIfNeeded();
    const box = await geContact.saveBtn.boundingBox();
    record(`Page scrollWidth ${sw}; Save right edge ${box && Math.round(box.x + box.width)}`);
    expect(box && box.x + box.width).toBeLessThanOrEqual(768);
  });

  test('TC_GE_057 - Header fields and grid inputs have accessible names @regression', async ({ geContact, record }) => {
    const fields = { Date: geContact.date, 'Loan Name': geContact.loanName, Scheme: geContact.scheme, Remarks: geContact.remarks, Quantity: geContact.cell(0, 3), 'Gross weight': geContact.cell(0, 4) };
    const missing = [];
    for (const [n, loc] of Object.entries(fields)) {
      const ok = await loc.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')));
      if (!ok) missing.push(n);
    }
    record(`Without accessible name: ${missing.join(', ') || 'none'}`);
    expect(missing).toEqual([]);
  });

  test('TC_GE_058 - Eligible Loan Amount explains its formula in a tooltip @regression', async ({ page, geContact, record }) => {
    await geContact.scheme.selectOption({ label: 'GL-quick — 3 mo' });
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    const title = await page.locator('#GoldEstimateValue').getAttribute('title');
    record(`Tooltip "${title}"`);
    expect(title).toMatch(/Appraisal Value x Internal LTV %/);
  });
});
