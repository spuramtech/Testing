const { test, expect, IMAGE } = require('../../fixtures');
const env = require('../../../common/config/env');

// REAL estimates. A saved estimate gets a GE number, enters the approval chain and has no Cancel/Delete,
// so these tests run only with ALLOW_DATA_CREATION=1. They use an AUTOTEST contact and a ₹1.38 lakh ring.

test.describe('Gold Estimates – real save (opt-in)', () => {
  // evaluated before any fixture runs, so nothing is opened or saved when switched off
  test.skip(!env.allowDataCreation, 'ALLOW_DATA_CREATION=1 not set – a saved estimate cannot be deleted');

  test('TC_GE_052 - Maker saves an estimate: GE number issued and routed to the next approver; it appears in My Gold Estimates @regression', async ({ page, geContact, apiHits, record }) => {
    await geContact.scheme.selectOption({ label: 'GL-quick — 3 mo' });
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    await geContact.uploadImage(IMAGE);
    await geContact.remarks.fill(`Automation functional test ${new Date().toISOString().slice(0, 16)}`);
    const t = await geContact.totals();
    await geContact.saveBtn.click();
    await geContact.confirmBtn.click();
    const msg = await geContact.waitMessage();
    const ge = (msg.match(/GE\d{10}/) || [])[0];
    const slabs = JSON.parse(apiHits.find((h) => /GetSlabConfigList/i.test(h.url) && h.text).text);
    const slab = slabs.find((s) => t.value >= s.pSlabFromAmount && t.value <= s.pSlabToAmount);
    await page.locator('button:visible, a:visible').filter({ hasText: /^\s*My Saved Estimates\s*$/ }).first().click();
    await page.waitForURL(/MyGoldEstimates/);
    await page.waitForTimeout(2500);
    const row = page.locator('tr:visible', { hasText: ge || 'no-ge' }).first();
    const rowText = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ');
    record(`Message "${msg}"; GE ${ge}; value ${t.value} → slab needs ${slab && slab.pInternalAppraiserCount} internal + ${slab && slab.pExternalAppraiserCount} external; row "${rowText}"`);
    expect(msg).toMatch(/success|saved|submitted/i);
    expect(ge).toBeTruthy();
    expect(rowText).toContain(ge);
    expect(rowText).toMatch(new RegExp(`/ ${slab.pInternalAppraiserCount + slab.pExternalAppraiserCount}\\b`));
  });
});
