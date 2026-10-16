const { test, expect, MAKER } = require('../../fixtures');
const { LoginPage } = require('../../../common/pages/LoginPage');
const { go } = require('../../../common/utils/nav');

// Write calls here use a NON-EXISTENT scheme id (999999999) – no real scheme can change.
async function session(browser, role) {
  const page = await browser.newPage({ baseURL: test.info().project.use.baseURL });
  let h;
  page.on('request', (r) => { if (!h && r.headers().authorization && /\/api\//.test(r.url())) h = { headers: r.headers(), base: r.url().split('/api/')[0] }; });
  await new LoginPage(page).login(role);
  await go(page, 'Gold Loan Configuration', ['Loans', 'Gold']);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  return { page, headers: { ...h.headers, 'content-type': 'application/json' }, api: `${h.base}/api/loans/masters/goldschememaster` };
}

test.describe('Gold Scheme Matrix – API', () => {
  test('TC_GS_060 - Scheme list API returns well-formed records @regression', async ({ gsm, apiHits, record }) => {
    const list = JSON.parse(apiHits.find((h) => /getgoldschemeconfigurationlist/i.test(h.url) && h.text).text);
    const bad = list.filter((s) => !s.precordid || !s.pSchemeCode || !(s.pTenureMonths > 0) || !(s.pRateOfInterest > 0) || !['ACTIVE', 'INACTIVE'].includes(s.pStatus) || !['BULLET', 'MONTHLY'].includes(s.pSchemeType) || !/^\d{4}-\d{2}-\d{2}/.test(s.pEffectiveFrom));
    record(`${list.length} schemes; malformed: ${bad.map((s) => s.pSchemeCode).join(', ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GS_061 - Scheme list API refuses requests without a token @regression', async ({ page, gsm, apiHits, record }) => {
    const hit = apiHits.find((h) => /getgoldschemeconfigurationlist/i.test(h.url));
    const headers = { ...hit.headers };
    delete headers.authorization;
    const r = await page.request.get(hit.url, { headers });
    record(`No token → ${r.status()}`);
    expect([401, 403]).toContain(r.status());
  });

  test(`TC_GS_062 - Scheme list API refuses a user without Scheme Matrix rights (${MAKER}) @regression`, async ({ browser, page, gsm, apiHits, record }) => {
    const hit = apiHits.find((h) => /getgoldschemeconfigurationlist/i.test(h.url));
    const m = await session(browser, MAKER);
    const r = await page.request.get(hit.url, { headers: { ...hit.headers, authorization: m.headers.authorization } });
    const t = await r.text();
    record(`${MAKER} token → ${r.status()} ${t.trim().startsWith('[') ? `${JSON.parse(t).length} schemes returned` : t.slice(0, 100)}`);
    await m.page.close();
    expect([401, 403]).toContain(r.status());
  });

  test(`TC_GS_063 - Delete API refuses a user without rights (${MAKER}) – non-existent id @regression`, async ({ browser, record }) => {
    const m = await session(browser, MAKER);
    const r = await m.page.request.post(`${m.api}/deletegoldschemeconfiguration`, { headers: m.headers, data: { pSchemeId: 999999999, pCompanyId: 20 } });
    const t = await r.text();
    record(`${MAKER} delete → ${r.status()} ${t.slice(0, 160)}`);
    await m.page.close();
    expect([401, 403]).toContain(r.status());
  });

  test('TC_GS_064 - Delete API for a non-existent scheme answers "not deleted" @regression', async ({ browser, record }) => {
    const a = await session(browser, process.env.SCHEME_ROLE || 'CHECKER_BH');
    const r = await a.page.request.post(`${a.api}/deletegoldschemeconfiguration`, { headers: a.headers, data: { pSchemeId: 999999999, pCompanyId: 20 } });
    const t = await r.text();
    record(`Admin delete unknown id → ${r.status()} ${t.slice(0, 160)}`);
    await a.page.close();
    const body = JSON.parse(t);
    expect(body.pIsDeleted).toBe(false);
  });
});
