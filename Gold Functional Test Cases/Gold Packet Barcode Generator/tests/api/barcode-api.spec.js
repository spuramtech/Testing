const { test, expect } = require('../../fixtures');
const { LoginPage } = require('../../../common/pages/LoginPage');

// API checks. The only write sent is without a token, for a loan number that does not exist.
const hitOf = (hits, re) => hits.find((h) => re.test(h.url) && h.headers.authorization);

test.describe('Gold Packet Barcode Generator – API', () => {
  test('TC_PB_053 - Loan list and register APIs refuse requests without a token @regression', async ({ register, page, apiHits, record }) => {
    const out = [];
    for (const re of [/getbarcoderegister/i, /getloansforbarcode/i]) {
      const hit = hitOf(apiHits, re);
      const headers = { ...hit.headers };
      delete headers.authorization;
      out.push(`${re.source} → ${(await page.request.get(hit.url, { headers })).status()}`);
    }
    record(out.join('; '));
    for (const o of out) expect(o).toMatch(/→ (401|403)$/);
  });

  test('TC_PB_054 - generatebarcode refuses a request without a token @regression', async ({ bc, page, apiHits, record }) => {
    const hit = hitOf(apiHits, /getloansforbarcode/i);
    const headers = { ...hit.headers, 'content-type': 'application/json' };
    delete headers.authorization;
    const url = hit.url.replace(/getloansforbarcode.*/i, 'generatebarcode');
    const r = await page.request.post(url, { headers, data: { pType: 'New', pLoanid: 'GLNG_AUTOTEST_NONE', pEmployeeid: 0, pBranchid: 0 } });
    record(`No token → ${r.status()} ${(await r.text()).slice(0, 120)}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_PB_055 - Register API Status filter returns only that status @regression', async ({ register, page, apiHits, record }) => {
    const hit = hitOf(apiHits, /getbarcoderegister/i);
    const out = {};
    for (const s of ['Not Used', 'Used', 'Cancelled']) {
      const list = await (await page.request.get(hit.url.replace(/Status=[^&]*/, `Status=${encodeURIComponent(s)}`), { headers: hit.headers })).json();
      out[s] = [list.length, [...new Set(list.map((r) => r.pStatus))]];
    }
    record(JSON.stringify(out));
    for (const [s, [, statuses]] of Object.entries(out)) expect(statuses.every((x) => x === s)).toBe(true);
  });

  test('TC_PB_056 - A non-Branch-Head user cannot read the loans-for-barcode list through the API (HYPOTHESIS) @regression', async ({ bc, page, browser, baseURL, apiHits, record }) => {
    const hit = hitOf(apiHits, /getloansforbarcode\?Type=New/i);
    // log in as the maker in a separate browser context and take its token
    const ctx = await browser.newContext({ baseURL });
    const maker = await ctx.newPage();
    let auth = null;
    maker.on('request', (r) => { if (!auth && /\/api\//.test(r.url()) && r.headers().authorization) auth = r.headers().authorization; });
    await new LoginPage(maker).login('INT_APPRAISER1');
    await maker.waitForTimeout(3000);
    await ctx.close();
    test.skip(!auth, 'could not capture the maker token');
    const r = await page.request.get(hit.url, { headers: { ...hit.headers, authorization: auth } });
    const body = await r.text();
    const n = (() => { try { return JSON.parse(body).length; } catch { return null; } })();
    record(`Maker token → ${r.status()}, ${n} loans returned`);
    expect([401, 403].includes(r.status()) || n === 0).toBe(true);
  });
});
