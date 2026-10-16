const { test, expect } = require('../../fixtures');
const { LoginPage } = require('../../../common/pages/LoginPage');

// API checks. The only write sent is without a token, for a loan number that does not exist.
test.describe('Loan Disbursal – API', () => {
  test('TC_LD_050 - Disbursal list and loan APIs refuse requests without a token @regression', async ({ ld, api, page, record }) => {
    const headers = { ...api.hit.headers };
    delete headers.authorization;
    const out = [];
    for (const p of [api.hit.url.split('/api/')[1], 'loans/Transactions/Disbursement/GetApprovedApplicationsByID?vchapplicationid=GLNG0126060000001&pbranchschema=public']) {
      out.push(`${p.split('?')[0].split('/').pop()} → ${(await page.request.get(api.apiBase + p, { headers })).status()}`);
    }
    record(out.join('; '));
    for (const o of out) expect(o).toMatch(/→ (401|403)$/);
  });

  test('TC_LD_051 - SubmitDisbursal refuses a request without a token @regression', async ({ ld, api, page, record }) => {
    const headers = { ...api.hit.headers, 'content-type': 'application/json' };
    delete headers.authorization;
    const r = await page.request.post(api.apiBase + 'loans/transactions/golddisbursal/SubmitDisbursal', { headers, data: { pDisbursement: { pvchapplicationid: 'GLNG_AUTOTEST_NONE', ptypeofoperation: 'CREATE' } } });
    record(`No token → ${r.status()} ${(await r.text()).slice(0, 120)}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_LD_052 - Gold loans require Branch Head approval (RequiresApproval = true) @regression', async ({ ld, api, record }) => {
    const loan = (await ld.approvedLoans())[0];
    const r = await api.get(`loans/transactions/golddisbursal/RequiresApproval?branchschema=public&vchapplicationid=${loan.appNo}`);
    record(`${loan.appNo}: RequiresApproval ${r}`);
    expect(r).toBe(true);
  });

  test('TC_LD_053 - An external appraiser cannot read the disbursal list through the API (HYPOTHESIS) @regression', async ({ ld, api, page, browser, baseURL, record }) => {
    const ctx = await browser.newContext({ baseURL });
    const other = await ctx.newPage();
    let auth = null;
    other.on('request', (r) => { if (!auth && /\/api\//.test(r.url()) && r.headers().authorization) auth = r.headers().authorization; });
    await new LoginPage(other).login('EXT_APPRAISER1');
    await other.waitForTimeout(3000);
    await ctx.close();
    test.skip(!auth, 'could not capture the token');
    const r = await page.request.get(api.hit.url, { headers: { ...api.hit.headers, authorization: auth } });
    const n = await r.json().then((x) => (x.papprovedloanslist || []).length).catch(() => null);
    record(`External appraiser token → ${r.status()}, ${n} loans`);
    expect([401, 403].includes(r.status()) || n === 0).toBe(true);
  });
});
