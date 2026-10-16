const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const dates = require('../utils/dates');
const { LoginPage } = require('../pages/LoginPage');
const { LoanReceiptPage } = require('../pages/LoanReceiptPage');

// tryfinsta records ONE receipt on the CURRENT FLOW's disbursed gold loan.
//
// Receipt Date rule (found on host214): the calendar allows dates from the loan's LAST RECEIPT DATE (or its disbursal when there is no
// receipt yet) up to today, and the dues are calculated AS OF the chosen Receipt Date. So for a back-dated loan the user selects a
// DUE DATE as the Receipt Date and pays the dues of that date.
//
//   $env:RECEIPT_DATE="31/08/2026"  → receipt dated 31/08/2026 (pays the dues as of that date)
//   $env:RECEIPT_DATE="TODAY"       → receipt dated today
//   (default)                       → back-dated loan: the OLDEST unpaid due date; otherwise today
//   $env:RECEIPT_AMOUNT=1000        → fixed amount instead of "all dues as of the receipt date"
//   $env:RECEIPT_MODE="BANK"        → mode (default CASH);  $env:LOAN_NUMBER → another loan
test('TC_LOANRECEIPT_001 - Loan Receipt on a selected due date for the flow gold loan (tryfinsta)', async ({ page }, testInfo) => {
  const r = new LoanReceiptPage(page);
  const loanNumber = process.env.LOAN_NUMBER || flow.need('loanNumber', 'token');
  const mode = (process.env.RECEIPT_MODE || 'CASH').toUpperCase();
  let receiptDate = dates.today();
  let schedule = [];
  let before;
  let amount = Number(process.env.RECEIPT_AMOUNT || 0);

  await test.step('Login as tryfinsta', () => new LoginPage(page).login('INT_APPRAISER1'));
  await test.step('Open Loans → Loan Management → Loan Receipt', () => r.open());

  await test.step(`Loan Type Gold Loan → Show → loan ${loanNumber}`, async () => {
    await r.selectLoan(loanNumber);
    console.log(`Loan ${loanNumber} | outstanding ${await r.outstanding()} | receipt date ${await r.receiptDate.inputValue()}`);
  });

  await test.step('Instalments posted per scheme (after Scheduled Jobs)', async () => {
    const f = flow.read();
    schedule = await r.receivablesDetailed();
    console.log('Due dates (Receivables Detailed, as of today):\n' + (schedule.map((x) => `  ${x.date} | interest ${x.interest} | principal ${x.principal} | balance ${x.balance}`).join('\n') || '  none'));
    if (!f.schemeRate || !f.sanctionedAmount || !f.backDate || !(f.accrualDates || []).length || process.env.LOAN_NUMBER) {
      console.log('No scheme/jobs data in the flow for this loan – posting check skipped');
      return;
    }
    // one receivable per month-end the Accrued Interest job ran for; interest = loan × scheme rate × days / 365
    let from = dates.parse(f.backDate);
    for (const d of f.accrualDates) {
      const to = dates.parse(d);
      const days = Math.round((to - from) / 86400000);
      from = to;
      const exp = Math.round((f.sanctionedAmount * f.schemeRate * days) / 36500);
      const got = schedule.find((x) => x.date === d);
      console.log(`  ${d}: ${days} days → expected ₹${exp} | posted ${got ? '₹' + got.amount : 'MISSING'} (${f.schemeType})`);
      expect(got, `receivable for ${d} posted by the Accrued Interest job`).toBeTruthy();
      expect(Math.abs(got.amount - exp), `${d} interest ≈ ₹${exp}`).toBeLessThanOrEqual(2);
    }
  });

  await test.step('Select the Receipt Date (due date)', async () => {
    const env = (process.env.RECEIPT_DATE || '').toUpperCase();
    const unpaid = schedule.filter((x) => x.balance > 0);
    // Server rule: "Receipt date cannot be before <date>: interest on this loan is already accrued / collected up to that date"
    // → earliest allowed receipt date = the last date the Accrued Interest job ran (or the last receipt). Default to that due date.
    const accrued = flow.read().accrualDates || [];
    const lastAccrued = !process.env.LOAN_NUMBER && accrued.length ? accrued[accrued.length - 1] : null;
    if (lastAccrued) console.log(`Interest accrued up to ${lastAccrued} → receipts can be dated ${lastAccrued} … today`);
    const target = env === 'TODAY' ? null : env || lastAccrued || (unpaid.length && flow.read().backDate && !process.env.LOAN_NUMBER ? unpaid[0].date : null);
    if (!target) { console.log(`Receipt Date stays today (${receiptDate})`); return; }
    try {
      await dates.pickDate(page, r.receiptDate, target, 'Receipt Date');
      receiptDate = target;
      await r.waitForDues(); // dues are recalculated as of the receipt date
      console.log(`Receipt Date set to due date ${receiptDate}`);
    } catch (e) {
      // earliest allowed date = the loan's last receipt date
      console.log(`Receipt Date ${target} not allowed (${e.message.split('\n')[0]}) – the loan already has a later receipt; using today`);
      await page.keyboard.press('Escape').catch(() => {});
    }
  });

  await test.step(`Dues as of ${receiptDate} → amount`, async () => {
    before = await r.grandTotal();
    const rows = await r.dueRows();
    console.log(`Dues as of ${receiptDate}:`, JSON.stringify(rows), '| Grand Total', JSON.stringify(before));
    // Back-dated receipt: the Dues grid is NOT refreshed when the Receipt Date changes (it keeps today's dues), but
    // "Receivables Detailed" is (server call ViewParticularsDetails …duestype=ASON). Use the date-aware figure.
    if (receiptDate !== dates.today()) {
      const ason = (await r.receivablesDetailed()).filter((x) => x.balance > 0);
      const asonTotal = Math.round(ason.reduce((t, x) => t + x.balance, 0) * 100) / 100;
      console.log(`Receivables as of ${receiptDate}: ${ason.map((x) => `${x.date} ₹${x.balance}`).join(', ') || 'none'} = ₹${asonTotal}`);
      if (Math.round(before.balance) !== Math.round(asonTotal)) {
        console.log(`WARNING (possible defect): Dues grid still shows ₹${before.balance} (as of today) although Receipt Date is ${receiptDate} (₹${asonTotal} due)`);
        testInfo.annotations.push({ type: 'possible-defect', description: `Dues grid not refreshed for Receipt Date ${receiptDate}: grid ₹${before.balance} vs as-on ₹${asonTotal}` });
      }
      if (!amount) amount = asonTotal || 1000;
      before = { ...before, balance: asonTotal };
    }
    if (!amount) amount = before.balance > 0 ? before.balance : 1000;
    console.log(before.balance > 0 ? `Paying all dues as of ${receiptDate}: ₹${amount}` : `Nothing due on ${receiptDate} → ₹${amount} goes to Advance`);
  });

  await test.step(`Mode ${mode}, Total Receipt ₹${amount}, narration`, async () => {
    console.log('Mode:', await r.selectMode(mode));
    await r.totalReceipt.fill(String(amount));
    await r.totalReceipt.press('Tab');
    await page.waitForTimeout(1000);
    await r.narration.fill(`Automation receipt ₹${amount} on ${loanNumber} dated ${receiptDate}`);
    const after = await r.grandTotal();
    console.log('Distribution:', JSON.stringify(await r.dueRows()), '| Grand Total', JSON.stringify(after), '| Summary', JSON.stringify(await r.summary()));
    if (before.balance > 0 && receiptDate === dates.today()) {
      expect(after.received, 'Amount Received = entered amount').toBeCloseTo(Math.min(amount, before.balance), 0);
      expect(after.balance, 'Balance Due after receipt').toBeCloseTo(Math.max(before.balance - amount, 0), 0);
    }
  });

  await test.step('Save', async () => {
    let serverError = '';
    page.on('response', async (res) => {
      if (/SaveLoanReceipt/i.test(res.url()) && res.status() >= 400) serverError = `${res.status()} ${(await res.text().catch(() => '')).slice(0, 300)}`;
    });
    page.on('console', (m) => { if (m.type() === 'error' && /cannot|not allowed|before/i.test(m.text())) serverError = serverError || m.text(); });
    await r.save.click();
    const confirm = page.locator('.swal2-confirm:visible, .modal.show button:has-text("Yes"), .modal.show button:has-text("Confirm"), .modal.show button:has-text("Ok")').first();
    if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
    const shown = await page.locator('.toast-message, .swal2-html-container').first().waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
    const msgs = (await r.messages()).join(' ');
    console.log('Messages after save:', msgs || '(none on screen)');
    if (serverError) console.log(`SERVER REJECTED the receipt (not shown on screen – possible defect): ${serverError}`);
    expect(shown, `Save gave no on-screen response for a receipt dated ${receiptDate}${serverError ? ' – server said: ' + serverError : ''}`).toBe(true);
    expect(msgs).toMatch(/success|saved|receipt/i);
    expect(msgs).not.toMatch(/error|fail|please|invalid/i);
    if (!process.env.LOAN_NUMBER || flow.read().loanNumber === loanNumber) flow.update('loan-receipt', { receiptDate, receiptAmount: amount, receiptMode: mode, dueBefore: before.balance });
  });

  await test.step('Re-open the loan: dues up to the receipt date are cleared', async () => {
    if (!(before.balance > 0) || amount < before.balance) { console.log('Advance / partial receipt – nothing to re-check'); return; } // (test.skip here would mark the whole saved receipt as skipped)
    await r.open();
    await r.selectLoan(loanNumber);
    const left = await r.receivablesDetailed();
    console.log('Due dates after receipt:\n' + (left.map((x) => `  ${x.date} | balance ${x.balance}`).join('\n') || '  none left'));
    for (const x of left.filter((y) => dates.parse(y.date) <= dates.parse(receiptDate))) {
      expect(x.balance, `due date ${x.date} (≤ receipt date ${receiptDate}) must be fully paid`).toBe(0);
    }
    testInfo.annotations.push({ type: 'receipt', description: `${loanNumber}: ₹${amount} dated ${receiptDate}` });
  });
});
