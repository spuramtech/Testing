const { test, expect, ROLES } = require('../../fixtures');
const env = require('../../../common/config/env');
const { LoginPage } = require('../../../common/pages/LoginPage');
const { GoldEstimatesPage } = require('../../../Gold Estimates/pages/GoldEstimatesPage');
const path = require('path');

// REAL end-to-end: maker saves a ₹1.38 lakh estimate → IA2 verifies → Branch Head approves → pledge token.
// Permanent data (GE number + token), so it runs only with ALLOW_DATA_CREATION=1.
test.describe('Gold Estimate Approval Queue – real approval chain (opt-in)', () => {
  test.skip(!env.allowDataCreation, 'ALLOW_DATA_CREATION=1 not set – creates a permanent estimate and pledge token');

  test('TC_EQ_051 - Maker → IA2 Verify → Branch Head Approve gives Approved status and a pledge token @regression', async ({ page, context, q, record }) => {
    // 1. maker
    await new LoginPage(page).login(ROLES.IA1);
    const ge = new GoldEstimatesPage(page);
    await ge.open();
    await ge.selectContact('Autotest');
    await ge.scheme.selectOption({ label: 'GL-quick — 3 mo' });
    await ge.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    await ge.uploadImage(path.resolve(__dirname, '../../../Gold Estimates/test-data/gold-article.png'));
    await ge.remarks.fill('Automation approval chain');
    await ge.saveBtn.click();
    await ge.confirmBtn.click();
    const saved = await ge.waitMessage();
    const gen = (saved.match(/GE\d{10}/) || [])[0];
    expect(gen, `GE number in "${saved}"`).toBeTruthy();
    // 2. IA2
    await new LoginPage(page).login(ROLES.IA2);
    await q.open();
    await q.openAction(gen, 'Verify');
    await q.approveBtn.click();
    const m2 = await q.waitMessage();
    // 3. Branch Head
    await new LoginPage(page).login(ROLES.CHECKER);
    await q.open();
    await q.openAction(gen, 'Review');
    await q.approveBtn.click();
    await q.promptButton('Confirm Approve').click();
    const m3 = await q.waitMessage();
    for (const p of context.pages()) if (p !== page) await p.close();
    await q.open();
    const row = (await q.rows()).find((r) => r.ge === gen);
    record(`${gen}: "${saved}" → IA2 "${m2}" → BH "${m3}" → ${JSON.stringify(row)}`);
    expect(m3).toContain('Gold Estimate approved.');
    expect(row.status).toBe('Approved');
    expect(row.token).toMatch(/^UID\d+$/);
  });
});
