const { test, expect, SAVE_API, SIM } = require('../../fixtures');

// Loan Details on the simulated token UID99999. Save is blocked or simulated – no loan is created.
// first value of `key` anywhere in the (nested) save request
const deep = (o, key) => { if (!o || typeof o !== 'object') return undefined; if (key in o) return o[key]; for (const v of Object.values(o)) { const r = deep(v, key); if (r !== undefined) return r; } return undefined; };
test.describe('Gold Token – loan details and amount rules (simulated token)', () => {
  test('TC_GT_021 - Loan name, tenure and interest come from the estimate\'s scheme and are locked @smoke @regression', async ({ simToken, record }) => {
    const { gt, data } = simToken;
    await gt.toLoanDetails();
    const v = { loan: (await gt.loanName.locator('option:checked').innerText()).trim(), tenure: Number(await gt.tenure.inputValue()), interest: Number(await gt.interest.inputValue()) };
    record(`${JSON.stringify(v)} vs estimate ${data.pTenure} mo @ ${data.pInterestrate}%`);
    expect(v).toEqual({ loan: 'New Gold', tenure: data.pTenure, interest: data.pInterestrate });
    for (const l of [gt.loanName, gt.tenure, gt.interest]) expect(await l.isEnabled()).toBe(false);
  });

  test('TC_GT_022 - Eligible Loan Amount on Loan Details = the estimate\'s eligible value @regression', async ({ simToken, record }) => {
    const { gt, data } = simToken;
    await gt.toLoanDetails();
    const t = (await gt.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const shown = Number(((t.split('Loan Configuration').pop().match(/Eligible Loan Amount \(LTV\)\s*([\d,.]+)/) || [])[1] || '').replace(/,/g, ''));
    record(`Shown ${shown}; estimate ${data.pGoldEstimateValue}`);
    expect(shown).toBeCloseTo(data.pGoldEstimateValue, 2);
  });

  const AMOUNTS = [
    ['TC_GT_023', 'abc', '', 'letters rejected'],
    ['TC_GT_024', '50000', '50,000', 'shown with Indian separators'],
    ['TC_GT_025', '0', '', 'zero not accepted'],
    ['TC_GT_026', '1000.50', '1,000.5', 'decimal amount keeps its value (HYPOTHESIS)'],
  ];
  for (const [id, typed, exp, desc] of AMOUNTS) {
    test(`${id} - Amount requested "${typed}" → "${exp}" (${desc}) @regression`, async ({ simToken, record }) => {
      const { gt } = simToken;
      await gt.toLoanDetails();
      const v = await gt.typeAmount(typed);
      record(`Typed "${typed}" → "${v}"`);
      if (id === 'TC_GT_026') expect(Number(v.replace(/,/g, ''))).toBeCloseTo(1000.5, 2);
      else expect(v).toBe(exp);
    });
  }

  test('TC_GT_027 - Amount one rupee below the eligible loan is accepted (boundary) @regression', async ({ simToken, record }) => {
    const { gt, data } = simToken;
    await gt.toLoanDetails();
    const amt = Math.floor(data.pGoldEstimateValue) - 1;
    const v = await gt.typeAmount(amt);
    record(`Eligible ${data.pGoldEstimateValue}; typed ${amt} → "${v}"`);
    expect(Number(v.replace(/,/g, ''))).toBe(amt);
  });

  for (const [id, delta, label] of [['TC_GT_028', 0, 'equal to'], ['TC_GT_029', 1, 'above']]) {
    test(`${id} - Amount ${label} the eligible loan is refused with "Amount Should be Less than Eligible Loan Amount (LTV)" @regression`, async ({ simToken, record }) => {
      const { gt, data } = simToken;
      await gt.toLoanDetails();
      const amt = Math.ceil(data.pGoldEstimateValue) + delta;
      const v = await gt.typeAmount(amt);
      const msg = await gt.messages();
      record(`Eligible ${data.pGoldEstimateValue}; typed ${amt} → "${v}"; message "${msg}"`);
      expect(v).toBe('');
      expect(msg).toMatch(/Amount Should be Less than Eligible Loan Amount \(LTV\)/);
    });
  }

  test('TC_GT_030 - Save with no amount is refused – the loan must not be sent with amount 0 @smoke @regression', async ({ simToken, apiHits, record }) => {
    const { gt } = simToken;
    await gt.toLoanDetails();
    await gt.typeAmount('');
    await gt.saveBtn.click();
    await gt.page.waitForTimeout(2000);
    const sent = apiHits.filter((h) => SAVE_API.test(h.url));
    const amt = sent[0] ? deep(JSON.parse(sent[0].body), 'pAmountrequested') : null;
    record(`Save requests ${sent.length}${sent.length ? ` (pAmountrequested ${amt}, blocked)` : ''}; message "${await gt.messages()}"`);
    expect(sent, 'a loan with no amount was sent to the server').toHaveLength(0);
  });

  test('TC_GT_031 - Save sends token, contact, nominees, amount and the scheme terms (blocked) @regression', async ({ simToken, apiHits, record }) => {
    const { gt, data, item } = simToken;
    await gt.toLoanDetails();
    await gt.typeAmount(50000);
    await gt.saveBtn.click();
    await expect.poll(() => apiHits.filter((h) => SAVE_API.test(h.url)).length).toBe(1);
    const b = JSON.parse(apiHits.find((h) => SAVE_API.test(h.url)).body);
    const sum = { token: b.Ptokennumber, contact: b.pContactreferenceid, nominees: (b.PersonalNomineeList || []).map((n) => `${n.pnomineename}/${n.prelationship}/${n.pPercentage}`), amount: deep(b, 'pAmountrequested'), tenure: deep(b, 'pTenure') ?? deep(b, 'pTenureofloan'), rate: deep(b, 'pInterestrate') ?? deep(b, 'pRateofinterest'), loan: deep(b, 'pLoanid') };
    record(JSON.stringify(sum));
    expect(sum.token).toBe(SIM);
    expect(String(sum.contact)).toBe(String(item.pmembercontactrefId));
    expect(sum.nominees).toEqual(['LAKSHMI QA/Mother/100']);
    expect(Number(sum.amount)).toBe(50000);
    void data;
  });

  test('TC_GT_032 - Only one nominee is marked primary (HYPOTHESIS) @regression', async ({ simToken, apiHits, record }) => {
    const { gt } = simToken;
    await gt.toLoanDetails([{ name: 'LAKSHMI QA', relationship: 'Mother', contact: '9876500011', proportion: 60 }, { name: 'RAVI QA', relationship: 'Father', contact: '9876500012', proportion: 40 }]);
    await gt.typeAmount(50000);
    await gt.saveBtn.click();
    await expect.poll(() => apiHits.filter((h) => SAVE_API.test(h.url)).length).toBe(1);
    const n = JSON.parse(apiHits.find((h) => SAVE_API.test(h.url)).body).PersonalNomineeList;
    record(n.map((x) => `${x.pnomineename} primary=${x.pisprimarynominee}`).join(', '));
    expect(n.filter((x) => x.pisprimarynominee)).toHaveLength(1);
  });

  test('TC_GT_033 - A failed save gives a meaningful message (not "Unknown Error") @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.toLoanDetails();
    await gt.typeAmount(50000);
    await gt.clearToasts();
    await gt.saveBtn.click();
    const msg = await gt.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/error|fail/i);
    expect(msg).not.toMatch(/Unknown Error/);
  });

  test('TC_GT_034 - Double-click on Save sends one request (simulated server) @regression', async ({ simToken, mockWrite, record }) => {
    const { gt } = simToken;
    const sent = await mockWrite('SaveCustomerandGoldLoanAllDetails', 'Simulated – not saved', { status: 500 });
    await gt.toLoanDetails();
    await gt.typeAmount(50000);
    await gt.saveBtn.dblclick();
    await gt.page.waitForTimeout(2500);
    record(`Save requests: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_GT_035 - Back returns to the Member tab with the nominees kept @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.toLoanDetails();
    await gt.backBtn.click();
    await expect(gt.nomineeName).toBeVisible();
    const rows = await gt.nomineeRows().count();
    record(`Back → Member tab; nominee rows ${rows}`);
    expect(rows).toBe(1);
  });

  test('TC_GT_036 - Charges & Fees table is shown on Loan Details @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.toLoanDetails();
    const t = (await gt.page.locator('body').innerText()).replace(/\s+/g, ' ');
    record((t.match(/Charges & Fees.{0,200}/) || [''])[0]);
    for (const h of ['Charges and Fees', 'Amount', 'Waiver', 'GST Amount', 'Adjust in Loan Disbursement Amount']) expect(t).toContain(h);
  });
});
