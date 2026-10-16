const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const dates = require('../utils/dates');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { LoanDisbursalPage } = require('../pages/LoanDisbursalPage');
const { GoldBarcodePage } = require('../pages/GoldBarcodePage');

// tryfinsta disburses ONE approved gold loan (Manual Disbursement → Submit For Approval).
// Candidates: the loan packed in the Inventory Form (test-data/last-barcode.json) first, then other AUTOTEST approved
// loans with a sanctioned amount. A loan already submitted for Branch Head approval stays in the Approved list but its
// "Submit For Approval" button is disabled – such loans are skipped (and remembered in test-data/last-disbursal.json).
// Overrides: $env:LOAN_NUMBER="GLNG0126100000009", $env:PAY_MODE="CASH" (default BANK), $env:BANK_VIA="Cheque" (default Online),
//            $env:PAYMENT_TYPE="IMPS" (default NEFT), $env:PAYOUT=50000 (default = full amount available).
const DISBURSAL_FILE = path.resolve(__dirname, '../test-data/last-disbursal.json');
const readSubmitted = () => (fs.existsSync(DISBURSAL_FILE) ? JSON.parse(fs.readFileSync(DISBURSAL_FILE, 'utf8')).submitted || [] : []);
const writeSubmitted = (list, last) => fs.writeFileSync(DISBURSAL_FILE, JSON.stringify({ last, submitted: [...new Set(list)] }, null, 2));

test('TC_DISBURSAL_001 - Loan Disbursal of one approved gold loan as tryfinsta', async ({ page }, testInfo) => {
  const d = new LoanDisbursalPage(page);
  const submittedBefore = readSubmitted();
  const env = process.env.BASE_URL || '';
  let candidates = [];
  let done = null;

  await test.step('Login as tryfinsta', () => new LoginPage(page).login('INT_APPRAISER1'));
  await test.step('Open Loans → Loan Management → Loan Disbursal → Show Loans', () => d.open());

  await test.step('List approved AUTOTEST loans', async () => {
    const list = await d.approvedLoans(process.env.LOAN_NUMBER || flow.need('loanNumber', 'token'));
    console.log('Approved loans:\n' + list.map((l) => `  ${l.appNo} | ${l.applicant} | sanctioned ₹${l.sanctioned}${submittedBefore.includes(`${env}|${l.appNo}`) ? ' | already submitted by automation' : ''}`).join('\n'));
    // Only the current flow's loan – never another loan
    const loanNo = process.env.LOAN_NUMBER || flow.need('loanNumber', 'token');
    const mine = list.find((l) => l.appNo === loanNo);
    expect(mine, `Flow loan ${loanNo} is not in Loan Disbursal → Approved`).toBeTruthy();
    expect(mine.sanctioned, `Flow loan ${loanNo} has sanctioned amount 0 – it cannot be disbursed (start a new flow: npm run contact …)`).toBeGreaterThan(0);
    test.skip(submittedBefore.includes(`${env}|${loanNo}`), `Flow loan ${loanNo} was already submitted for Branch Head approval – next: npm run disbursal-approval`);
    candidates = [mine];
  });

  await test.step('Fill and submit the first loan that can still be submitted', async () => {
    for (const loan of candidates) {
      if (done) break;
      await d.openLoan(loan.appNo);
      console.log(`\n${loan.appNo}: header`, JSON.stringify(await d.header()), '| disburse date', await d.disburseDate.inputValue());

      const bd = dates.backDate(flow);
      if (bd) {
        await dates.pickDate(page, d.disburseDate, bd, 'Disburse Date');
        await page.waitForTimeout(800);
        const inst = dates.addMonths(bd, 1);
        await dates.pickDate(page, d.installmentStart, inst, 'Installment Start Date');
        console.log(`Back-dated: Disburse Date ${bd}, Installment Start ${inst}`);
      }
      const mode = (process.env.PAY_MODE || 'BANK').toUpperCase();
      console.log('Mode of payment:', await d.selectPaymentMode(mode));
      if (mode === 'BANK') console.log('Bank details:', JSON.stringify(await d.fillBankDetails({ via: process.env.BANK_VIA || 'Online', paymentType: process.env.PAYMENT_TYPE || 'NEFT' })));

      const available = Number(((await d.header()).available || String(loan.sanctioned)).replace(/,/g, ''));
      const amount = Number(process.env.PAYOUT || available);
      expect(amount).toBeGreaterThan(0);
      expect(amount).toBeLessThanOrEqual(available);
      const prefilled = Number((await d.payout.inputValue()).replace(/,/g, ''));
      if (prefilled !== amount) {
        // Type like a user – the field is masked (1,03,643.00); leave it alone when it already holds the amount
        await d.payout.click({ clickCount: 3 });
        await d.payout.press('Control+A');
        await d.payout.press('Backspace');
        await d.payout.pressSequentially(String(amount), { delay: 40 });
        await d.payout.press('Tab');
      }
      console.log(`Payout field: ${await d.payout.inputValue()} (₹${amount})`);

      if (!(await d.submit.isEnabled())) {
        console.log(`${loan.appNo}: "Submit For Approval" is disabled – already submitted for Branch Head approval, trying next loan`);
        writeSubmitted([...readSubmitted(), `${env}|${loan.appNo}`], null);
        await d.open();
        await d.approvedLoans('Autotest');
        continue;
      }

      await d.submit.click();
      const confirm = page.locator('.swal2-confirm:visible, .modal.show button:has-text("Yes"), .modal.show button:has-text("Confirm"), .modal.show button:has-text("Ok")').first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
      await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
      const msgs = (await d.messages()).join(' ');
      console.log('Messages after submit:', msgs);
      expect(msgs).toMatch(/success|saved|submitted|approval/i);
      expect(msgs).not.toMatch(/error|fail|please|insufficient/i);
      done = { loanNumber: loan.appNo, applicant: loan.applicant, amount, submittedAt: new Date().toISOString(), env };
      writeSubmitted([...readSubmitted(), `${env}|${loan.appNo}`], done);
      flow.update('disbursal', { disbursalAmount: amount, disbursalStatus: 'Waiting for Approval' });
      testInfo.annotations.push({ type: 'loan', description: `${loan.appNo} – ₹${amount} submitted for Branch Head approval` });
    }
    test.skip(!done, 'Every AUTOTEST approved loan is already submitted for Branch Head approval – create a new one: npm run token');
  });
});
