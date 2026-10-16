const { test, expect } = require('../../fixtures');
const { go } = require('../../../common/utils/nav');

// Non-Branch-Head users. Every write is blocked after login.
const block = (page) => page.route(/\/api\//, (r) => (r.request().method() !== 'GET' ? r.abort('failed') : r.fallback()));

test.describe('Gold Packet Barcode Generator – roles', () => {
  for (const [id, role] of [['050', 'INT_APPRAISER1'], ['051', 'EXT_APPRAISER1']]) {
    test(`TC_PB_${id} - ${role} has no Gold Packet Barcode Generator in the menu @regression`, async ({ page, loginAs, record }) => {
      await loginAs(role);
      await block(page);
      const err = await go(page, 'Gold Packet Barcode Generator', ['Loans', 'Gold']).then(() => null).catch((e) => e.message.split('\n')[0]);
      record(err ? `Menu entry not reachable: ${err.slice(0, 100)}` : `Opened ${page.url()}`);
      expect(page.url()).not.toMatch(/GoldPacketBarcodeGenerate/);
    });
  }

  test('TC_PB_052 - INT_APPRAISER1 opening the generator URL directly cannot generate @regression', async ({ page, loginAs, record }) => {
    await loginAs('INT_APPRAISER1');
    await block(page);
    await page.goto('/#/Loans/GoldPacketBarcodeGenerate');
    await page.waitForTimeout(4000);
    const gen = await page.locator('button:visible').filter({ hasText: /Generate barcode/i }).count();
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(`URL ${page.url()}; Generate buttons ${gen}; ${text.split('Gold Packet Barcode').pop().slice(0, 160)}`);
    expect(gen).toBe(0);
  });
});
