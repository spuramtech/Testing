const { test, expect } = require('../../fixtures');
const { today, addMonths } = require('../../../common/utils/dates');

// Disbursement form of an AUTOTEST approved loan. Read-only.
const last = (hits, re) => { const h = hits.filter((x) => re.test(x.url) && x.text).pop(); try { return JSON.parse(h.text); } catch { return null; } };

test.describe('Loan Disbursal – loan details', () => {
  test('TC_LD_011 - Amounts: available = sanctioned − previous; amount disbursed = available − adjustments @smoke @regression', async ({ loan, record }) => {
    const a = await loan.ld.amounts();
    record(JSON.stringify(a));
    expect(a.sanctioned).toBe(loan.sanctioned);
    expect(a.available).toBeCloseTo(a.sanctioned - a.previous, 2);
    expect(a.disbursed).toBeCloseTo(a.available - a.adjustments - a.broken - a.advanceEmi, 2);
  });

  test('TC_LD_012 - Loan terms come from the approved application @regression', async ({ loan, apiHits, record }) => {
    const app = last(apiHits, /GetApprovedApplicationsByID/i);
    const a = await loan.ld.amounts();
    record(`API: approved ${app.papprovedloanamount}, tenure ${app.ptenureofloan}, ROI ${app.prateofinterest}, ${app.pdisbursedtype}; screen sanctioned ${a.sanctioned}`);
    expect(Number(String(app.papprovedloanamount).replace(/,/g, ''))).toBeCloseTo(a.sanctioned, 2);
  });

  test('TC_LD_013 - Borrower bank details = the contact\'s bank account @regression', async ({ loan, page, apiHits, record }) => {
    const banks = last(apiHits, /getDisbursementbankDetails/i) || [];
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const b = banks[0];
    record(b ? `${b.pBankName} ${b.pBankAccountNo} ${b.pIfscCode || b.pIfsccode || ''}` : 'no bank rows');
    test.skip(!b, 'borrower has no bank account');
    expect(text).toContain(b.pBankName);
    expect(text).toContain(String(b.pBankAccountNo));
  });

  test('TC_LD_014 - Disburse Date is today and read-only @regression', async ({ loan, record }) => {
    const v = await loan.ld.disburseDate.inputValue();
    const ro = await loan.ld.disburseDate.evaluate((e) => e.readOnly || e.disabled);
    record(`"${v}", read-only ${ro}`);
    expect(v).toBe(today());
    expect(ro).toBe(true);
  });

  test('TC_LD_015 - Installment Start Date is one month after the disburse date @regression', async ({ loan, record }) => {
    const v = await loan.ld.installmentStart.inputValue();
    record(`Installment start "${v}", disburse ${await loan.ld.disburseDate.inputValue()}`);
    expect(v).toBe(addMonths(today(), 1));
  });

  test('TC_LD_016 - A loan with nothing disbursed shows no disbursal history @regression', async ({ loan, page, record }) => {
    const a = await loan.ld.amounts();
    test.skip(a.previous !== 0, 'loan already part disbursed');
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const hist = (text.match(/Date Disbursed by Voucher No\. Mode of Payment (.{0,40})/) || [])[1];
    record(`History: "${hist}"`);
    expect(hist).toMatch(/^No records available/);
  });

  test('TC_LD_017 - Mode of Payment shows Cash and Bank with balances from the books; Cash is pre-selected @regression', async ({ loan, page, apiHits, record }) => {
    const cash = (await page.getByText(/^\s*Cash\s*[:–-]/i).locator('visible=true').first().innerText()).trim();
    const bank = (await page.getByText(/^\s*Bank\s*[:–-]/i).locator('visible=true').first().innerText()).trim();
    const bal = last(apiHits, /getbankbalances/i) || [];
    const checked = await page.locator('input[formcontrolname=pmodofpayment]:checked').getAttribute('value');
    record(`"${cash}" | "${bank}" | API bank book ${bal.map((b) => b.pbankbookbalance).join(', ')} | checked ${checked}`);
    expect(cash).toMatch(/Cash\s*-\s*[\d,]+\.\d{2}\s*(Dr|Cr)/);
    expect(bank).toMatch(/Bank\s*:\s*[\d,]+\.\d{2}\s*(Dr|Cr)/);
    const total = bal.reduce((s, b) => s + b.pbankbookbalance, 0);
    expect(Number(bank.match(/[\d,]+\.\d{2}/)[0].replace(/,/g, ''))).toBeCloseTo(Math.abs(total), 2);
    expect(checked).toBe('CASH');
  });

  test('TC_LD_018 - Bank → Online offers the company bank and RTGS / NEFT / IMPS / UPI / INTRA BANK TRANSFER @regression', async ({ loan, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.chooseVia('Online');
    const banks = await loan.ld.optionTexts('pbankid');
    const types = await loan.ld.optionTexts('ptypeofpayment');
    record(`Banks ${banks.join(', ')}; types ${types.join(', ')}`);
    expect(banks.length).toBeGreaterThan(0);
    expect(types).toEqual(['RTGS', 'NEFT', 'IMPS', 'UPI', 'INTRA BANK TRANSFER']);
  });

  test('TC_LD_019 - Bank → Cheque offers the bank and its unused cheques @regression', async ({ loan, page, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.chooseVia('Cheque');
    const banks = await loan.ld.optionTexts('pbankid');
    await page.locator('select[formcontrolname=pbankid]').selectOption({ label: banks[0] });
    await page.waitForTimeout(1500);
    const cheques = await loan.ld.optionTexts('pChequenumber');
    record(`Banks ${banks.join(', ')}; cheques ${cheques.length} (${cheques.slice(0, 5).join(', ')})`);
    expect(banks.length).toBeGreaterThan(0);
    await expect(page.locator('select[formcontrolname=pChequenumber]')).toBeVisible();
  });

  test('TC_LD_020 - Bank → Debit Card offers a card list @regression', async ({ loan, page, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.chooseVia('Debit Card');
    const cards = await loan.ld.optionTexts('pCardNumber');
    record(`Cards ${cards.length}`);
    await expect(page.locator('select[formcontrolname=pCardNumber]')).toBeVisible();
  });

  test('TC_LD_021 - Cash hides the bank fields @regression', async ({ loan, page, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.selectPaymentMode('CASH');
    const n = await page.locator('select[formcontrolname=pbankid]:visible, select[formcontrolname=ptypeofpayment]:visible').count();
    record(`Visible bank fields after Cash: ${n}`);
    expect(n).toBe(0);
  });

  test('TC_LD_022 - Clear resets the bank choice @regression', async ({ loan, page, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.fillBankDetails({ via: 'Online', paymentType: 'NEFT', reference: 'AUTOTESTCLR' });
    await page.locator('button:visible, a:visible').filter({ hasText: /^\W*Clear\s*$/ }).last().click();
    await page.waitForTimeout(1500);
    const ref = await page.locator('input[formcontrolname=pChequenumber]:visible').inputValue().catch(() => '');
    const bank = await page.locator('select[formcontrolname=pbankid]:visible').inputValue().catch(() => '');
    record(`After Clear: reference "${ref}", bank "${bank}", mode ${await page.locator('input[formcontrolname=pmodofpayment]:checked').getAttribute('value').catch(() => 'none')}`);
    expect(ref).toBe('');
    expect(['', '0', null]).toContain(bank || '');
  });
});
