const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { GoldEstimateQueuePage } = require('../pages/GoldEstimateQueuePage');

// Internal Appraiser 2 (priya) verifies ONE estimate waiting for her.
// By default: the oldest AUTOTEST estimate awaiting Internal Appraiser 2. Override: $env:GE_NUMBER="GE2610000015"
test('TC_GEAPPROVAL_001 - Internal Appraiser 2 (priya) verifies and approves one Gold Estimate', async ({ page }, testInfo) => {
  const queue = new GoldEstimateQueuePage(page);
  let target;

  await test.step('Login as priya (Internal Appraiser 2)', () => new LoginPage(page).login('INT_APPRAISER2'));
  await test.step('Open Loans → Gold → Gold Estimate Approval Queue', () => queue.open());

  await test.step('Pick one estimate awaiting Internal Appraiser 2', async () => {
    const rows = await queue.rows();
    console.log('Queue:\n' + rows.map((r) => `  ${r.ge} | ${r.customer} | ${r.value} | ${r.status} | ${r.action}`).join('\n'));
    const mine = rows.filter((r) => /Internal Appraiser 2/i.test(r.status) && /Verify/i.test(r.action));
    const ge = process.env.GE_NUMBER || flow.need('geNumber', 'estimate');
    const routed = flow.read().routedTo || '';
    test.skip(!process.env.GE_NUMBER && /checker/i.test(routed), `Flow estimate ${ge} was routed straight to "${routed}" – Internal Appraiser 2 not needed (amount slab)`);
    target = mine.find((r) => r.ge === ge);
    expect(target, `Flow estimate ${ge} is not waiting in this queue (${rows.find((r) => r.ge === ge)?.status || 'not listed'})`).toBeTruthy();
    testInfo.annotations.push({ type: 'GE', description: `${target.ge} – ${target.customer}` });
    console.log(`Flow estimate: ${target.ge}`);
  });

  await test.step('Open Verify and check the Internal Appraiser entry', async () => {
    await queue.openVerify(target.ge);
    const s = await queue.verificationSummary();
    console.log(`Verifying ${target.ge}:`, JSON.stringify(s));
    expect(s.enteredBy).toBeTruthy();
  });

  await test.step('Approve', async () => {
    await queue.approveWithRemarks(`Verified by automation (Internal Appraiser 2) ${new Date().toISOString().slice(0, 16)}`);
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await queue.messages()).join(' ');
    console.log('Messages after approve:', msgs);
    expect(msgs).not.toMatch(/error|fail|cannot|please/i);
  });

  await test.step('Verify the estimate moved past Internal Appraiser 2', async () => {
    await queue.open();
    const row = (await queue.rows()).find((r) => r.ge === target.ge);
    console.log(`${target.ge} now:`, row ? `${row.status} | ${row.action}` : 'no longer in priya\'s queue');
    if (row) expect(row.status).not.toMatch(/Awaiting Internal Appraiser 2/i);
  });
});
