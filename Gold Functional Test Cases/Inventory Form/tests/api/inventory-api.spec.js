const { test, expect } = require('../../fixtures');
const { LoginPage } = require('../../../common/pages/LoginPage');

// API checks. The only write sent is without a token, for a loan number that does not exist.
test.describe('Inventory Form – API', () => {
  test('TC_IF_052 - Inventory read APIs refuse requests without a token @regression', async ({ inv, live, page, record }) => {
    const headers = { ...live.hit.headers };
    delete headers.authorization;
    const out = [];
    for (const p of ['loans/Transactions/Receipts/GetApplicantionid?loanname=Gold%20Loan&formname=INVENTORY', 'loans/Transactions/getloaninventory', 'loans/Transactions/goldpacketbarcode/getbarcodedetails?Barcodeno=BH9999999999']) {
      out.push(`${p.split('?')[0].split('/').pop()} → ${(await page.request.get(live.apiBase + p, { headers })).status()}`);
    }
    record(out.join('; '));
    for (const o of out) expect(o).toMatch(/→ (401|403)$/);
  });

  test('TC_IF_053 - saveloaninventory refuses a request without a token @regression', async ({ inv, live, page, record }) => {
    const headers = { ...live.hit.headers, 'content-type': 'application/json' };
    delete headers.authorization;
    const r = await page.request.post(live.apiBase + 'loans/Transactions/saveloaninventory', { headers, data: { pInventoryid: 0, pLoanid: 'GLNG_AUTOTEST_NONE', pTypeofoperation: 'CREATE', inventorydetails: [] } });
    record(`No token → ${r.status()} ${(await r.text()).slice(0, 120)}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_IF_054 - Barcode details API agrees with the register @regression', async ({ inv, live, record }) => {
    test.skip(!live.ready, 'no ready barcode');
    const d = await live.get(`loans/Transactions/goldpacketbarcode/getbarcodedetails?Barcodeno=${live.ready.pBarcodeno}`);
    const pk = await live.get(`loans/Transactions/getcheckpacketnumber?Packetnumber=${live.ready.pBarcodeno}`);
    record(`${live.ready.pBarcodeno}: loan ${d.pLoanid}, ${d.pStatus}, type ${d.pType}; packet already used: ${pk}`);
    expect(d).toMatchObject({ pBarcodeno: live.ready.pBarcodeno, pLoanid: live.ready.pLoanid, pStatus: 'Not Used', pType: 'New' });
    expect(pk).toBe(false);
  });

  test('TC_IF_055 - A non-Branch-Head user cannot read the inventory loan list through the API (HYPOTHESIS) @regression', async ({ inv, live, page, browser, baseURL, record }) => {
    const ctx = await browser.newContext({ baseURL });
    const maker = await ctx.newPage();
    let auth = null;
    maker.on('request', (r) => { if (!auth && /\/api\//.test(r.url()) && r.headers().authorization) auth = r.headers().authorization; });
    await new LoginPage(maker).login('INT_APPRAISER1');
    await maker.waitForTimeout(3000);
    await ctx.close();
    test.skip(!auth, 'could not capture the appraiser token');
    const r = await page.request.get(live.apiBase + 'loans/Transactions/Receipts/GetApplicantionid?loanname=Gold%20Loan&formname=INVENTORY', { headers: { ...live.hit.headers, authorization: auth } });
    const n = await r.json().then((x) => x.length).catch(() => null);
    record(`Appraiser token → ${r.status()}, ${n} loans`);
    expect([401, 403].includes(r.status()) || n === 0).toBe(true);
  });
});
