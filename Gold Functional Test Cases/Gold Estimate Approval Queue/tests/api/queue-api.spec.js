const { test, expect, ROLES } = require('../../fixtures');
const { LoginPage } = require('../../../common/pages/LoginPage');
const { go } = require('../../../common/utils/nav');

// Write calls use a NON-EXISTENT GE number (GE0000000000) – no real estimate can change.
async function session(browser, role) {
  const page = await browser.newPage({ baseURL: test.info().project.use.baseURL });
  let h;
  page.on('request', (r) => { if (!h && r.headers().authorization && /\/api\//.test(r.url())) h = { headers: r.headers(), base: r.url().split('/api/')[0] }; });
  await new LoginPage(page).login(role);
  await go(page, 'Gold Estimate Approval Queue', ['Loans', 'Gold']);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const uid = JSON.parse((await page.evaluate(() => sessionStorage.getItem('currentUser'))) || '{}').pUserID;
  return { page, uid, headers: { ...h.headers, 'content-type': 'application/json' }, api: `${h.base}/api/loans/transactions/goldestimate` };
}
const FAKE = 'GE0000000000';

test.describe('Gold Estimate Approval Queue – API', () => {
  test('TC_EQ_044 - Queue API refuses requests without a token @regression', async ({ page, checkerQ, apiHits, record }) => {
    const hit = apiHits.find((h) => /GetGoldEstimateQueue/i.test(h.url));
    const headers = { ...hit.headers };
    delete headers.authorization;
    const r = await page.request.get(hit.url, { headers });
    record(`No token → ${r.status()}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_EQ_045 - A non-Branch-Head token cannot read the Branch Head\'s full queue @regression', async ({ browser, page, checkerQ, apiHits, record }) => {
    const hit = apiHits.find((h) => /GetGoldEstimateQueue/i.test(h.url));
    const s = await session(browser, ROLES.IA2);
    const r = await page.request.get(hit.url, { headers: { ...hit.headers, authorization: s.headers.authorization } });
    const t = await r.text();
    record(`IA2 token on ${hit.url.split('?')[1]} → ${r.status()} ${t.trim().startsWith('[') ? `${JSON.parse(t).length} estimates returned` : t.slice(0, 100)}`);
    await s.page.close();
    expect([401, 403]).toContain(r.status());
  });

  test('TC_EQ_046 - ApproveGoldEstimate by a non-Branch-Head is refused (non-existent GE) @regression', async ({ browser, record }) => {
    const s = await session(browser, ROLES.IA2);
    const r = await s.page.request.post(`${s.api}/ApproveGoldEstimate`, { headers: s.headers, data: { pGenumber: FAKE, pSelectedEntryId: 1, pCheckeruserid: s.uid } });
    const t = await r.text();
    record(`IA2 ApproveGoldEstimate → ${r.status()} ${t.slice(0, 160)}`);
    await s.page.close();
    expect(r.ok()).toBe(false);
  });

  test('TC_EQ_047 - ApproveInternalAppraisal for an unknown GE is refused @regression', async ({ browser, record }) => {
    const s = await session(browser, ROLES.IA2);
    const r = await s.page.request.post(`${s.api}/ApproveInternalAppraisal`, { headers: s.headers, data: { pGenumber: FAKE, pInternalAppraiser2UserId: s.uid, pAction: 'APPROVE' } });
    const t = await r.text();
    record(`ApproveInternalAppraisal unknown GE → ${r.status()} ${t.slice(0, 160)}`);
    await s.page.close();
    expect(r.ok()).toBe(false);
  });

  test('TC_EQ_048 - RevertGoldEstimate without remarks is refused by the server (unknown GE) @regression', async ({ browser, record }) => {
    const s = await session(browser, ROLES.CHECKER);
    const r = await s.page.request.post(`${s.api}/RevertGoldEstimate`, { headers: s.headers, data: { pGenumber: FAKE, pRemarks: '', pCheckeruserid: s.uid } });
    const t = await r.text();
    record(`RevertGoldEstimate empty remarks → ${r.status()} ${t.slice(0, 160)}`);
    await s.page.close();
    expect(r.ok()).toBe(false);
  });
});
