const path = require('path');
const { test, expect } = require('@playwright/test');
const dates = require('../utils/dates');
const flow = require('../utils/flow');
const { LoanDisbursalPage } = require('../pages/LoanDisbursalPage');
const { LoginPage } = require('../pages/LoginPage');
const { GoldTokenPage } = require('../pages/GoldTokenPage');

// Uses one available token (from an APPROVED gold estimate) to create the gold loan request.
// Default: first AUTOTEST token. Override: $env:TOKEN="UID00041"; amount: $env:LOAN_AMOUNT=90000
const NOMINEE = {
  name: 'LAKSHMI QA',
  relationship: 'Mother',
  contact: '9876500011',
  proportion: 100,
  kyc: { type: 'PAN / FORM 60', name: 'PAN CARD', reference: 'ABCPL1234K', file: path.resolve(__dirname, '../test-data/gold-article.png') },
};

test('TC_GOLDTOKEN_001 - Generate gold loan from one token (nominee + loan details) as tryfinsta', async ({ page }, testInfo) => {
  const token = new GoldTokenPage(page);
  let target;
  let overview;

  await test.step('Login as tryfinsta', () => new LoginPage(page).login('INT_APPRAISER1'));
  await test.step('Open Loans → Gold → Gold Token', () => token.open());

  await test.step('Pick one available token', async () => {
    const list = await token.tokens();
    console.log('Available tokens:\n' + list.map((t) => `  ${t.token} | ${t.customer} | ${t.mobile} | ${t.type} | ${t.value}`).join('\n'));
    // Only the current flow's contact (matched by mobile); its token comes from the flow's approved estimate
    const mobile = flow.need('mobile', 'contact');
    flow.need('geNumber', 'estimate');
    const mine = list.filter((t) => t.mobile === mobile);
    target = process.env.TOKEN ? list.find((t) => t.token === process.env.TOKEN) : mine[mine.length - 1];
    expect(target, `No token for the flow contact (mobile ${mobile}) – approve the flow estimate first: npm run estimate-checker`).toBeTruthy();
    if (mine.length > 1) console.log(`Flow contact has ${mine.length} tokens – using the newest ${target.token}`);
    await token.selectToken(target.token);
    const bd = dates.backDate(flow);
    if (bd) {
      await dates.pickDate(page, page.locator('[formcontrolname=ptodayDate]:visible').first(), bd, 'Gold Token Date');
      console.log(`Token Date set to ${bd}`);
    }
    overview = await token.overview();
    console.log(`Token ${target.token} overview:`, JSON.stringify(overview));
  });

  await test.step('Member tab: add nominee (with KYC)', () => token.addNominee(NOMINEE));
  await test.step('Next → Loan Details', () => token.next());

  let amount;
  let savedLoan = null;
  await test.step('Loan Details: enter Amount Requested', async () => {
    // Limit = Eligible Loan Amount (LTV) / Estimate Value – NOT the appraisal value shown in the token list.
    // Above the limit the app silently clears the box and would save the loan with amount 0.
    expect(overview.estimateValue, 'eligible loan amount must be readable from Token Overview').toBeTruthy();
    const estimate = GoldTokenPage.num(overview.estimateValue);
    amount = Number(process.env.LOAN_AMOUNT || Math.floor((estimate * 0.9) / 1000) * 1000);
    expect(amount, 'requested amount must be > 0').toBeGreaterThan(0);
    expect(amount).toBeLessThanOrEqual(estimate);
    // The Loan Details tab keeps loading (scheme → tenure / interest / charges) just after "Next"; typing too early gets
    // wiped by that late load and the app then saves the loan with amount 0. Wait for the scheme values first.
    await expect(token.tenure).not.toHaveValue('');
    await expect(token.interest).not.toHaveValue('');
    // Loan terms must come from the flow's scheme (Gold Scheme Matrix → Gold Estimate)
    const fs_ = flow.read();
    if (fs_.schemeTenure) {
      expect(Number(await token.tenure.inputValue()), `tenure = scheme ${fs_.schemeName}`).toBe(Number(fs_.schemeTenure));
      expect(Number(await token.interest.inputValue()), `interest = scheme ${fs_.schemeName}`).toBe(Number(fs_.schemeRate));
      console.log(`Loan terms match scheme ${fs_.schemeName}: ${fs_.schemeTenure} mo @ ${fs_.schemeRate}% (${fs_.schemeType})`);
    }
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await token.amountRequested.fill(String(amount));
    await token.amountRequested.press('Tab');
    await page.waitForTimeout(1000);
    await expect(token.amountRequested, 'amount box still holds the amount just before Save').toHaveValue(new RegExp(amount.toLocaleString('en-IN').replace(/,/g, ',?')));
    console.log(`Estimate ₹${estimate} → requesting ₹${amount} (box shows ${await token.amountRequested.inputValue()}) | tenure ${await token.tenure.inputValue()} mo | ${await token.interest.inputValue()}%`);
    testInfo.annotations.push({ type: 'test-data', description: `${target.token} ${target.customer} – requested ₹${amount}` });
  });

  await test.step('Save (and check the amount actually sent)', async () => {
    const saveReq = page.waitForRequest((r) => r.method() === 'POST' && /SaveCustomerandGoldLoanAllDetails/i.test(r.url()), { timeout: 20_000 }).catch(() => null);
    await token.save();
    const req = await saveReq;
    const res = req ? await req.response().catch(() => null) : null;
    const resBody = res ? await res.text().catch(() => '') : '';
    savedLoan = (resBody.match(/[A-Z]{4}\d{10,}/) || [])[0] || null;
    console.log('Save response loan no:', savedLoan || '(not in response)', '|', resBody.slice(0, 160));
    if (req) {
      const sent = Number(((req.postData() || '').match(/"pAmountrequested"\s*:\s*([\d.]+)/) || [])[1]);
      console.log('Amount sent to server (pAmountrequested):', sent);
      expect(sent, 'the app must not save the loan with amount 0').toBe(amount);
    }
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await token.messages()).join(' ');
    console.log('Messages after save:', msgs);
    expect(msgs).toMatch(/success|saved|generated|created/i);
    expect(msgs).not.toMatch(/error|fail|please/i);
  });

  await test.step('Verify token moved to Used Tokens', async () => {
    await page.waitForTimeout(1500);
    if (!/GoldLoanToken/.test(page.url())) await token.open();
    const left = (await token.tokens()).map((t) => t.token);
    console.log('Remaining new tokens:', left.join(', ') || 'none');
    expect(left).not.toContain(target.token);
  });

  await test.step('Record the new loan number in the flow', async () => {
    let loanNumber = savedLoan;
    if (!loanNumber) {
      // Not in the save response → the newest approved loan of the flow contact with this exact amount (Loan Disbursal list)
      const d = new LoanDisbursalPage(page);
      await d.open();
      const mine = (await d.approvedLoans(target.mobile)).filter((l) => l.contact === target.mobile && Math.round(l.sanctioned) === amount);
      loanNumber = mine.map((l) => l.appNo).sort().pop();
    }
    expect(loanNumber, 'loan number of the token just saved').toBeTruthy();
    flow.update('token', { token: target.token, loanNumber, sanctionedAmount: amount });
    console.log(`Flow: token ${target.token} → loan ${loanNumber} (₹${amount})`);
  });
});
