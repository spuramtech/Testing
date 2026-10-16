const { test, expect } = require('../../fixtures');

// REAL write – off by default. Submits an AUTOTEST loan's disbursal for Branch Head approval (it then waits in the
// Gold Disbursal Approval Queue). Turn on with  $env:ALLOW_DATA_CREATION="1".
const ON = process.env.ALLOW_DATA_CREATION === '1';

test('TC_LD_056 - Real Online submit of an AUTOTEST loan goes to Branch Head approval (ALLOW_DATA_CREATION=1) @regression', async ({ ldReal: ld, page, apiHits, record }) => {
  test.skip(!ON, 'Submits a real disbursal for approval – set ALLOW_DATA_CREATION=1');
  const hit = apiHits.find((h) => /GetDisbursementViewData/i.test(h.url) && h.headers.authorization);
  const apiBase = hit.url.split('/api/')[0] + '/api/';
  const latest = async (no) => { const r = await page.request.get(`${apiBase}loans/transactions/golddisbursal/GetLatestForApplication?branchschema=public&vchapplicationid=${no}`, { headers: hit.headers }); return r.status() === 204 ? null : r.json().catch(() => null); };
  let pick = null;
  for (const l of (await ld.approvedLoans('Autotest')).filter((x) => x.sanctioned > 0)) if (!(await latest(l.appNo))) { pick = l; break; }
  test.skip(!pick, 'no AUTOTEST loan with a sanctioned amount and nothing pending');
  await ld.openLoan(pick.appNo);
  await ld.selectPaymentMode('BANK');
  const bank = await ld.fillBankDetails({ via: 'Online', paymentType: 'NEFT' });
  await ld.clearToasts();
  await ld.submit.click();
  await page.waitForTimeout(3000);
  const m = await ld.messageText();
  const after = await latest(pick.appNo);
  record(`${pick.appNo} ₹${pick.sanctioned} via ${JSON.stringify(bank)}: "${m}"; pending ${JSON.stringify(after).slice(0, 150)}`);
  expect(m).toContain('Disbursal submitted for Branch Head approval.');
  expect(after).toBeTruthy();
});
