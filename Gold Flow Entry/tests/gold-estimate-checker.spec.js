const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { GoldEstimateQueuePage } = require('../pages/GoldEstimateQueuePage');

// Checker / Branch Head (admin) gives final approval to ONE estimate that is "Ready for Approval".
// Default: oldest AUTOTEST estimate ready for approval. Override: $env:GE_NUMBER="GE2610000015"
test('TC_GECHECKER_001 - Checker/BH (admin) approves one Gold Estimate', async ({ page }, testInfo) => {
  const queue = new GoldEstimateQueuePage(page);
  let target;

  await test.step('Login as admin (Checker / Branch Head)', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Estimate Approval Queue', () => queue.open());

  await test.step('Pick one estimate "Ready for Approval"', async () => {
    const rows = await queue.rows();
    const ready = rows.filter((r) => /Ready for Approval/i.test(r.status) && /Review/i.test(r.action));
    console.log('Ready for Approval:\n' + ready.map((r) => `  ${r.ge} | ${r.customer} | ${r.value}`).join('\n'));
    const ge = process.env.GE_NUMBER || flow.need('geNumber', 'estimate');
    target = ready.find((r) => r.ge === ge);
    expect(target, `Flow estimate ${ge} is not "Ready for Approval" (${rows.find((r) => r.ge === ge)?.status || 'not listed'}) – run npm run estimate-approval first`).toBeTruthy();
    testInfo.annotations.push({ type: 'GE', description: `${target.ge} – ${target.customer} – ${target.value}` });
  });

  await test.step('Open Review → Approval Detail and check it', async () => {
    await page.locator('tr', { hasText: target.ge }).getByRole('button', { name: /Review/ }).click();
    await expect(page.getByText('Approval Detail')).toBeVisible();
    await expect(page.getByText(target.ge, { exact: true })).toBeVisible();
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    // Each header field is a label followed by its value element
    const pick = async (label) => {
      const lab = page.getByText(new RegExp(`^\\s*${label}\\s*$`, 'i')).first();
      return (await lab.locator('xpath=following-sibling::*[1]').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    };
    const detail = {
      roi: await pick('ROI'),
      eligibleLoan: await pick('Eligible Loan Amount'),
      stages: await pick('Appraisal Stages Required/Completed'),
      status: await pick('Status'),
    };
    console.log(`${target.ge} detail:`, JSON.stringify(detail));
    expect(text).toMatch(/Ready for Approval/);
    const [req, done] = (detail.stages || '').split('/').map((n) => Number(n.trim()));
    if (req) expect(done, 'appraisal stages completed ≥ required').toBeGreaterThanOrEqual(req);
  });

  await test.step('Approve → choose final value entry → Confirm Approve', async () => {
    // Select ONE record in the popup. Default lowest value. Override: $env:FINAL_ENTRY = "highest" | "random" | "1" / "2" (position) | "External Appraiser" / "thangavel" (text)
    const res = await queue.approveFinal(process.env.FINAL_ENTRY || 'lowest');
    console.log('Entries:', res.options.join(' || '));
    console.log('Chosen final value:', res.chosen);
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await queue.messages()).join(' ');
    console.log('Messages after approve:', msgs);
    expect(msgs).toMatch(/approv|success/i);
    expect(msgs).not.toMatch(/error|fail|cannot|please/i);
  });

  await test.step('Verify status is Approved in the queue', async () => {
    await queue.open();
    const row = (await queue.rows()).find((r) => r.ge === target.ge);
    console.log(`${target.ge} now:`, row ? `${row.status} | ${row.action}` : 'not listed');
    flow.update('estimate-checker', { estimateStatus: row?.status, approvedEstimateValue: target.value });
    expect(row?.status).toMatch(/Approved/i);
  });
});
