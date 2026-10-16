const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { GoldRateApprovalPage } = require('../pages/GoldRateApprovalPage');

// Gold Rate Approval is a Checker-only screen: admin (Checker/BH) approves submissions made by others.
// Approve a specific day with:  $env:APPROVE_DATE="10 Oct 2026"; npm run approval

test('TC_GRAPPROVAL_001 - Checker/BH approves one pending gold rate submission', async ({ page }, testInfo) => {
  const queue = new GoldRateApprovalPage(page);
  let target;

  await test.step('Login as Checker/BH (admin)', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Loan Configuration → Gold Rate Approval', () => queue.open());

  await test.step('Pick one submission that admin is allowed to approve', async () => {
    const subs = await queue.submissions();
    console.log('Pending submissions:\n' + subs.map((s) => `  ${s.date} | by ${s.submittedBy} | 24K ${s.rate24k} | ${s.enabled ? 'can approve' : 'blocked: ' + s.title}`).join('\n'));
    const allowed = subs.filter((s) => s.enabled);
    test.skip(!allowed.length, 'No pending submission that admin may approve (submit one as tryfinsta via npm run goldrate)');
    target = process.env.APPROVE_DATE ? allowed.find((s) => s.date === process.env.APPROVE_DATE) : allowed[0];
    expect(target, `No approvable submission for ${process.env.APPROVE_DATE}`).toBeTruthy();
    testInfo.annotations.push({ type: 'test-data', description: `Approved ${target.date} submitted by ${target.submittedBy}, 24K ${target.rate24k}` });
  });

  await test.step(`Approve All for ${target?.date}`, async () => {
    await queue.approve(target.index);
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await queue.messages()).join(' ');
    console.log('Messages after approve:', msgs);
    expect(msgs).toMatch(/approv|success/i);
    expect(msgs).not.toMatch(/error|fail|cannot/i);
  });

  await test.step('Verify the submission left the queue', async () => {
    await page.waitForTimeout(1500);
    const remaining = await queue.submissions();
    expect(remaining.map((s) => s.date)).not.toContain(target.date);
    console.log(`Approved ${target.date} (by ${target.submittedBy}, 24K ${target.rate24k}). Remaining: ${remaining.map((s) => s.date).join(', ') || 'none'}`);
  });
});

test('TC_GRAPPROVAL_002 - Maker cannot approve: tryfinsta has no approval action on the queue', async ({ page }) => {
  const queue = new GoldRateApprovalPage(page);
  await new LoginPage(page).login('INT_APPRAISER1');
  await page.getByText('Loans', { exact: true }).first().click();
  await page.getByText('Gold', { exact: true }).locator('visible=true').first().click();
  await page.getByText('Gold Loan Configuration', { exact: true }).click();

  const card = page.getByText('Gold Rate Approval', { exact: true }).locator('xpath=ancestor::*[contains(normalize-space(.),"Checker approval")][1]');
  const cardText = (await card.innerText()).replace(/\s+/g, ' ');
  console.log('tryfinsta sees card:', cardText);

  if (/no view permission/i.test(cardText)) return; // blocked at the card level

  await page.getByText('Gold Rate Approval', { exact: true }).click();
  await page.waitForTimeout(2000);
  const subs = await queue.submissions();
  console.log('tryfinsta queue:', subs.map((s) => `${s.date} by ${s.submittedBy} → ${s.enabled ? 'ENABLED' : 'disabled'}`).join(' | ') || 'no access / empty');
  expect(subs.filter((s) => s.enabled), 'tryfinsta should not be able to approve any gold rate').toHaveLength(0);
});
