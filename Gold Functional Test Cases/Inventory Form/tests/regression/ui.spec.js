const { test, expect } = require('../../fixtures');

test.describe('Inventory Form – usability, accessibility, responsive', () => {
  test('TC_IF_056 - At tablet width (768px) the form has no page-level horizontal scroll @regression', async ({ inv, page, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    record(`scrollWidth ${sw}`);
    expect(sw).toBeLessThanOrEqual(768);
  });

  test('TC_IF_057 - Form fields have accessible names @regression', async ({ inv, page, record }) => {
    const res = await page.evaluate(() => {
      const named = (e) => !!e && !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label'));
      const q = (s) => document.querySelector(s);
      return {
        loanType: named(q('select[formcontrolname=ploantypeid]')),
        loan: named(q('ng-select[formcontrolname=pLoanid] input')),
        scan: named(q('input[placeholder="Scan barcode here"]')),
        vault: named(q('ng-select[formcontrolname=pVaultid] input')),
        safe: named(q('select[formcontrolname=pCabinetid]')),
        locker: named(q('select[formcontrolname=pLockerno]')),
        remarks: named(q('textarea[formcontrolname=pRemarks]')),
      };
    });
    record(JSON.stringify(res));
    expect(Object.entries(res).filter(([, v]) => !v).map(([k]) => k)).toEqual([]);
  });

});
