const { test, expect } = require('../../fixtures');

test.describe('Gold Token – API', () => {
  test('TC_GT_037 - Token list API refuses requests without a token @regression', async ({ page, gt, apiHits, record }) => {
    const hit = apiHits.find((h) => /GetGoldLoanCustomerDetails/i.test(h.url));
    const headers = { ...hit.headers };
    delete headers.authorization;
    const r = await page.request.get(hit.url, { headers });
    record(`No token → ${r.status()}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_GT_038 - A used token\'s estimate details report it as used @regression', async ({ page, gt, apiHits, record }) => {
    const list = JSON.parse(apiHits.filter((h) => /GetGoldLoanCustomerDetails/i.test(h.url) && h.text).pop().text);
    const used = list.find((t) => t.isTokenUsed);
    test.skip(!used, 'no used token in the list');
    const hit = apiHits.find((h) => /GetGoldLoanCustomerDetails/i.test(h.url));
    const r = await page.request.get(hit.url.replace(/GetGoldLoanCustomerDetails.*/, `GetGoldEstimationDetailsbyToken?token=${used.puniqueid}`), { headers: hit.headers });
    const d = await r.json();
    record(`${used.puniqueid}: isTokenUsed ${d[0] && d[0].isTokenUsed}`);
    expect(d[0].isTokenUsed).toBe(true);
  });
});
