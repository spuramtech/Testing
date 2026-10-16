const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { GoldDisbursalApprovalPage } = require('../pages/GoldDisbursalApprovalPage');

// Branch Head (admin) approves & disburses ONE gold loan disbursal submitted by `npm run disbursal`.
// Default: oldest AUTOTEST disbursal "Waiting for Approval". Override: $env:LOAN_NUMBER="GLNG0126100000009"
test('TC_GOLDDISBAPPROVAL_001 - Branch Head approves & disburses one gold loan disbursal (admin)', async ({ page }, testInfo) => {
  const q = new GoldDisbursalApprovalPage(page);
  let target;

  await test.step('Login as admin (Branch Head)', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Disbursal Approval Queue', () => q.open());

  await test.step('Branch Head queue / Waiting for Approval → pick one AUTOTEST disbursal', async () => {
    await q.filter('Waiting for Approval', 'Branch Head queue');
    const rows = await q.rows();
    console.log('Waiting for approval:\n' + rows.map((r) => `  ${r.loanNo} | ${r.customer} | ${r.amount} | ${r.mode} | by ${r.enteredBy} ${r.enteredOn}`).join('\n'));
    const loanNo = process.env.LOAN_NUMBER || flow.need('loanNumber', 'token');
    target = rows.find((r) => r.loanNo === loanNo);
    test.skip(!target, `Flow loan ${loanNo} has no disbursal waiting for approval – run: npm run disbursal`);
    testInfo.annotations.push({ type: 'loan', description: `${target.loanNo} – ${target.customer} – ${target.amount}` });
  });

  await test.step(`Review ${target?.loanNo} and check the disbursal details`, async () => {
    await q.review(target.loanNo);
    const det = await q.details();
    console.log('Details:', JSON.stringify(det));
    expect(det.status).toMatch(/Waiting for Approval/i);
    expect(det.netPayout.replace(/\s/g, '')).toBe(target.amount.replace(/\s/g, ''));
  });

  await test.step('Approve & Disburse', async () => {
    const popup = await q.approveAndDisburse(`Approved & disbursed by automation ${new Date().toISOString().slice(0, 16)}`);
    console.log('Confirm popup:', popup);
    expect(popup).toContain(target.loanNo);
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await q.messages()).join(' ');
    console.log('Messages after approve:', msgs);
    expect(msgs).toMatch(/approv|disburs|success/i);
    expect(msgs).not.toMatch(/error|fail|cannot|please|insufficient/i);
  });

  await test.step('Verify status in the queue = Approved & Disbursed', async () => {
    await q.open();
    await q.filter('All', 'Branch Head queue');
    const row = (await q.rows()).find((r) => r.loanNo === target.loanNo);
    console.log(`${target.loanNo} now:`, row ? row.status : 'not listed');
    expect(row?.status).toMatch(/Approved|Disbursed/i);
    flow.update('disbursal-approval', { disbursalStatus: row.status });
  });
});
