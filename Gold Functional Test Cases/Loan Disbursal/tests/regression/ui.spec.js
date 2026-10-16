const { test, expect } = require('../../fixtures');

test.describe('Loan Disbursal – usability, accessibility, responsive', () => {
  test('TC_LD_054 - At tablet width (768px) the disbursement form has no page-level horizontal scroll @regression', async ({ loan, page, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    record(`scrollWidth ${sw}`);
    expect(sw).toBeLessThanOrEqual(768);
  });

  test('TC_LD_055 - Payout, dates and bank fields have accessible names @regression', async ({ loan, page, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.chooseVia('Online');
    const res = await page.evaluate(() => {
      const named = (e) => !!e && !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label'));
      const q = (n) => document.querySelector(`[formcontrolname=${n}]`);
      return { payout: named(q('ploandisbusableamount')), disburseDate: named(q('ppaymentdate')), installment: named(q('pinstallmentstartdate')), bank: named(q('pbankid')), type: named(q('ptypeofpayment')), reference: named(q('pChequenumber')) };
    });
    record(JSON.stringify(res));
    expect(Object.entries(res).filter(([, v]) => !v).map(([k]) => k)).toEqual([]);
  });
});
