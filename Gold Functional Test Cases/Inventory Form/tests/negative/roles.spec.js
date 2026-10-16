const { test, expect } = require('../../fixtures');
const { go } = require('../../../common/utils/nav');

// Non-Branch-Head users. Every write is blocked after login.
const block = (page) => page.route(/\/api\//, (r) => (r.request().method() !== 'GET' ? r.abort('failed') : r.fallback()));

test.describe('Inventory Form – roles', () => {
  for (const [id, role] of [['049', 'INT_APPRAISER1'], ['050', 'EXT_APPRAISER1']]) {
    test(`TC_IF_${id} - ${role} has no Inventory Form in the menu @regression`, async ({ page, loginAs, record }) => {
      await loginAs(role);
      await block(page);
      const err = await go(page, 'Inventory Form', ['Loans', 'Gold']).then(() => null).catch((e) => e.message.split('\n')[0]);
      record(err ? `Menu entry not reachable: ${err.slice(0, 100)}` : `Opened ${page.url()}`);
      expect(page.url()).not.toMatch(/InventoryForm/);
    });
  }

  test('TC_IF_051 - INT_APPRAISER1 opening the Inventory Form URL directly cannot use it @regression', async ({ page, loginAs, record }) => {
    await loginAs('INT_APPRAISER1');
    await block(page);
    await page.goto('/#/Loans/InventoryForm');
    await page.waitForTimeout(4000);
    const n = await page.locator('select[formcontrolname=ploantypeid]:visible').count();
    let loans = 0;
    if (n) {
      await page.locator('select[formcontrolname=ploantypeid]').selectOption({ label: 'Gold Loan' }).catch(() => {});
      await page.locator('ng-select[formcontrolname=pLoanid]').click().catch(() => {});
      await page.waitForTimeout(1500);
      loans = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).filter((t) => /GLNG/.test(t)).length;
    }
    record(`URL ${page.url()}; form shown ${n > 0}; loans offered ${loans}`);
    expect(n === 0 || loans === 0).toBe(true);
  });
});
