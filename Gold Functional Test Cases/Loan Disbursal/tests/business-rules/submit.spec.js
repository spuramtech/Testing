const { test, expect, SUBMIT } = require('../../fixtures');
const { today, addMonths } = require('../../../common/utils/dates');

// Submit For Approval. Replies are SIMULATED (mockApi); the real server is not written.
const OK = 'Disbursal submitted for Branch Head approval.';
const amt = (s) => Number(String(s).replace(/,/g, ''));
const ddmmyyyy = (iso) => { const d = new Date(iso); return d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }); };

async function trySubmit(ld, page) {
  await ld.clearToasts();
  await ld.submit.click();
  await page.waitForTimeout(2500);
  return ld.messageText();
}

test.describe('Loan Disbursal – Submit For Approval: required fields', () => {
  test('TC_LD_032 - Bank without Cheque/Online/Debit Card: "Please Select Bank", nothing sent @smoke @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await mockApi(SUBMIT, true);
    await loan.ld.selectPaymentMode('BANK');
    const m = await trySubmit(loan.ld, page);
    record(`Message "${m}"; requests ${sent.length}`);
    expect(m).toMatch(/Please Select Bank/);
    expect(sent).toHaveLength(0);
  });

  for (const [id, missing, fill] of [
    ['033', 'bank name', async (ld) => { await ld.chooseVia('Online'); }],
    ['034', 'type of payment', async (ld, page) => { await ld.chooseVia('Online'); const b = await ld.optionTexts('pbankid'); await page.locator('select[formcontrolname=pbankid]').selectOption({ label: b[0] }); }],
    ['035', 'reference no', async (ld, page) => { await ld.chooseVia('Online'); const b = await ld.optionTexts('pbankid'); await page.locator('select[formcontrolname=pbankid]').selectOption({ label: b[0] }); await page.locator('select[formcontrolname=ptypeofpayment]').selectOption({ label: 'NEFT' }); }],
  ]) {
    test(`TC_LD_${id} - Online without ${missing} is refused with a message @regression`, async ({ loan, mockApi, page, record }) => {
      const sent = await mockApi(SUBMIT, true);
      await loan.ld.selectPaymentMode('BANK');
      await fill(loan.ld, page);
      const m = await trySubmit(loan.ld, page);
      record(`Requests ${sent.length}; message "${m}"`);
      expect(sent).toHaveLength(0);
      expect(m).not.toBe('');
    });
  }

  test('TC_LD_036 - Cheque with no cheque number cannot be submitted @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await mockApi(SUBMIT, true);
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.chooseVia('Cheque');
    const b = await loan.ld.optionTexts('pbankid');
    await page.locator('select[formcontrolname=pbankid]').selectOption({ label: b[0] });
    await page.waitForTimeout(1000);
    const m = await trySubmit(loan.ld, page);
    record(`Requests ${sent.length}; message "${m}"`);
    expect(sent).toHaveLength(0);
  });

  test('TC_LD_037 - Submitting without choosing a mode of payment asks for one (HYPOTHESIS) @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await mockApi(SUBMIT, true);
    const m = await trySubmit(loan.ld, page);
    record(`Requests ${sent.length} (mode ${sent[0]?.pDisbursement?.pmodofpayment}); message "${m}"`);
    expect(sent).toHaveLength(0);
  });
});

test.describe('Loan Disbursal – Submit For Approval: payload and outcome (simulated server)', () => {
  async function online(loan, mockApi, page, reply = true, opts) {
    const sent = await mockApi(SUBMIT, reply, opts);
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.fillBankDetails({ via: 'Online', paymentType: 'NEFT', reference: 'AUTOTESTREF1' });
    return sent;
  }

  test('TC_LD_038 - Online submit sends BANK / ONLINE / NEFT, the reference, the bank and the full amount @smoke @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await online(loan, mockApi, page);
    const a = await loan.ld.amounts();
    await trySubmit(loan.ld, page);
    const d = sent[0]?.pDisbursement || {};
    record(JSON.stringify({ mode: d.pmodofpayment, via: d.ptranstype, type: d.ptypeofpayment, ref: d.pChequenumber, bank: d.pbankname, loan: d.pvchapplicationid, payout: d.ploandisbusableamount, disbursal: d.ploandisbusalamount, status: d.pdisbursestatus }));
    expect(sent).toHaveLength(1);
    expect(d).toMatchObject({ pmodofpayment: 'BANK', ptranstype: 'ONLINE', ptypeofpayment: 'NEFT', pChequenumber: 'AUTOTESTREF1', pvchapplicationid: loan.appNo, ptypeofoperation: 'CREATE' });
    expect(d.pbankname).toMatch(/BANK/);
    expect(amt(d.ploandisbusableamount)).toBeCloseTo(a.available, 2);
    expect(amt(d.ploandisbusalamount)).toBeCloseTo(a.disbursed, 2);
  });

  test('TC_LD_039 - Cash submit sends CASH with no bank details @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await mockApi(SUBMIT, true);
    await loan.ld.selectPaymentMode('CASH');
    await trySubmit(loan.ld, page);
    const d = sent[0]?.pDisbursement || {};
    record(JSON.stringify({ mode: d.pmodofpayment, bank: d.pbankname, via: d.ptranstype, bankid: d.pbankid }));
    expect(d.pmodofpayment).toBe('CASH');
    expect(d.pbankname || null).toBeNull();
    expect(d.ptranstype || null).toBeNull();
  });

  test('TC_LD_040 - Submit sends today as payment date and the shown installment start date @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await online(loan, mockApi, page);
    await trySubmit(loan.ld, page);
    const d = sent[0].pDisbursement;
    record(`payment ${d.ppaymentdate} → ${ddmmyyyy(d.ppaymentdate)}; installment ${d.pinstallmentstartdate} → ${ddmmyyyy(d.pinstallmentstartdate)}`);
    expect(ddmmyyyy(d.ppaymentdate)).toBe(today());
    expect(ddmmyyyy(d.pinstallmentstartdate)).toBe(addMonths(today(), 1));
  });

  test('TC_LD_041 - Submit sends the borrower\'s primary bank account @regression', async ({ loan, mockApi, page, apiHits, record }) => {
    const sent = await online(loan, mockApi, page);
    await trySubmit(loan.ld, page);
    const d = sent[0].pDisbursement;
    const hit = apiHits.find((h) => /getDisbursementbankDetails/i.test(h.url));
    const banks = hit ? await (await page.request.get(hit.url, { headers: hit.headers })).json() : [];
    record(`sent account ${d.pselectedBankaccountno}, contact ${d.pSelectedBankContactId}; borrower accounts ${banks.map((b) => b.pBankAccountNo).join(', ')}`);
    expect(banks.map((b) => String(b.pBankAccountNo))).toContain(String(d.pselectedBankaccountno));
  });

  test('TC_LD_042 - Successful submit: "Disbursal submitted for Branch Head approval." and back to the list @regression', async ({ loan, mockApi, page, record }) => {
    await online(loan, mockApi, page);
    const m = await trySubmit(loan.ld, page);
    record(`Message "${m}"; URL ${page.url()}`);
    expect(m).toContain(OK);
    expect(page.url()).toMatch(/DisbursementView/);
  });

  test('TC_LD_043 - Network failure on submit: no success, stays on the form @regression', async ({ loan, mockApi, page, record }) => {
    await online(loan, mockApi, page, 'abort');
    const m = await trySubmit(loan.ld, page);
    record(`Message "${m}"; URL ${page.url()}`);
    expect(m).not.toContain(OK);
    expect(m).toMatch(/error|fail|could not/i);
    expect(page.url()).toMatch(/DisbursementNew/);
  });

  test('TC_LD_044 - Server error 500 on submit is shown as an error, not success @regression', async ({ loan, mockApi, page, record }) => {
    await online(loan, mockApi, page, { message: 'Internal error' }, { status: 500 });
    const m = await trySubmit(loan.ld, page);
    record(`Message "${m}"; URL ${page.url()}`);
    expect(m).not.toContain(OK);
    expect(page.url()).toMatch(/DisbursementNew/);
  });

  test('TC_LD_045 - Double-clicking Submit For Approval sends only one request @regression', async ({ loan, mockApi, page, record }) => {
    const sent = await online(loan, mockApi, page);
    await loan.ld.submit.dblclick();
    await page.waitForTimeout(3000);
    record(`Requests ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_LD_046 - A loan already submitted for approval cannot be submitted again @regression', async ({ ld, api, record }) => {
    const list = await ld.approvedLoans();
    let pending = null;
    for (const l of list) {
      const x = await api.get(`loans/transactions/golddisbursal/GetLatestForApplication?branchschema=public&vchapplicationid=${l.appNo}`);
      if (x) { pending = l; break; }
    }
    test.skip(!pending, 'no loan is waiting for Branch Head approval today');
    await ld.openLoan(pending.appNo);
    const enabled = await ld.submit.isEnabled();
    record(`${pending.appNo}: Submit enabled ${enabled}`);
    expect(enabled).toBe(false);
  });
});
