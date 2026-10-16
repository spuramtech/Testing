const { test, expect } = require('../../fixtures');
const { LoanDisbursalPage } = require('../../pages/LoanDisbursalPage');

// Other users. Every write is blocked after login.
const block = (page) => page.route(/\/api\//, (r) => (r.request().method() !== 'GET' ? r.abort('failed') : r.fallback()));

test.describe('Loan Disbursal – roles', () => {
  test('TC_LD_047 - EXT_APPRAISER1 has no Loan Disbursal in the menu @regression', async ({ page, loginAs, record }) => {
    await loginAs('EXT_APPRAISER1');
    await block(page);
    const err = await new LoanDisbursalPage(page).open().then(() => null).catch((e) => e.message.split('\n')[0]);
    record(err ? `Not reachable: ${err.slice(0, 100)}` : `Opened ${page.url()}`);
    expect(page.url()).not.toMatch(/DisbursementView/);
  });

  test('TC_LD_048 - EXT_APPRAISER1 opening the URL directly is sent back to the Dashboard @regression', async ({ page, loginAs, record }) => {
    await loginAs('EXT_APPRAISER1');
    await block(page);
    await page.goto('/#/Loans/DisbursementView');
    await page.waitForTimeout(4000);
    const n = await page.locator('button:visible').filter({ hasText: /Show Loans/ }).count();
    record(`URL ${page.url()}; Show Loans buttons ${n}`);
    expect(page.url()).not.toMatch(/DisbursementView/);
    expect(n).toBe(0);
  });

  test('TC_LD_049 - Branch Head (CHECKER_BH) can open the Loan Disbursal list @regression', async ({ page, loginAs, record }) => {
    await loginAs('CHECKER_BH');
    await block(page);
    const ld = new LoanDisbursalPage(page);
    await ld.open();
    const rows = await ld.approvedLoans();
    record(`URL ${page.url()}; ${rows.length} rows`);
    expect(page.url()).toMatch(/DisbursementView/);
  });
});
