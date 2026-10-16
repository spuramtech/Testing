const { test, expect, MAKER, CHECKER } = require('../../fixtures');
const data = require('../../test-data/approval-data');
const { LoginPage } = require('../../../common/pages/LoginPage');
const { GoldRateApprovalQueuePage } = require('../../pages/GoldRateApprovalQueuePage');

// Write calls in this file use a NON-EXISTENT record id (999999999) only – no real submission can be changed.

// Logs `role` in on a fresh page and returns { headers, apiBase, uid } taken from the app's own API traffic
async function session(browser, role) {
  const page = await browser.newPage({ baseURL: test.info().project.use.baseURL });
  let headers;
  page.on('request', (r) => { if (!headers && r.headers().authorization && /\/api\//.test(r.url())) headers = { h: r.headers(), base: r.url().split('/api/')[0] }; });
  await new LoginPage(page).login(role);
  await new GoldRateApprovalQueuePage(page).openConfiguration();
  const uid = JSON.parse((await page.evaluate(() => sessionStorage.getItem('currentUser'))) || '{}').pUserID;
  return { page, headers: { ...headers.h, 'content-type': 'application/json' }, apiBase: `${headers.base}/api/loans/masters/loanmaster`, uid };
}

const fakeBody = (uid, extra = {}) => ({ precordid: data.fakeRecordId, pApprovedby: uid, ...extra, pItems: [{ precordid: data.fakeRecordId, pVersionstamp: '2000-01-01 00:00:00' }] });

test.describe('Gold Rate Approval Queue – API', () => {
  test('TC_GQ_036 - Queue API returns well-formed PENDING records @regression', async ({ queue, apiHits, record }) => {
    const list = JSON.parse(apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url) && h.text).text);
    const bad = list.filter((r) => !/^\d{4}-\d{2}-\d{2}/.test(r.ptransdate) || !/^\d+K/.test(r.pgoldtype) || !(r.pgoldrate > 0) || r.pstatus !== 'PENDING' || !r.pVersionstamp || !r.precordid || !r.pCreatedbyname);
    record(`${list.length} records; malformed ${bad.length}`);
    expect(bad).toEqual([]);
  });

  test('TC_GQ_037 - Queue API refuses requests without a token @regression', async ({ page, queue, apiHits, record }) => {
    const hit = apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url));
    const headers = { ...hit.headers };
    delete headers.authorization;
    const r = await page.request.get(hit.url, { headers });
    record(`No token → ${r.status()}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_GQ_038 - Queue API refuses a non-checker (maker) token @regression', async ({ browser, page, queue, apiHits, record }) => {
    const hit = apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url));
    const maker = await session(browser, MAKER);
    const r = await page.request.get(hit.url, { headers: { ...hit.headers, authorization: maker.headers.authorization } });
    const t = await r.text();
    record(`Maker token → ${r.status()}; ${t.trim().startsWith('[') ? `${JSON.parse(t).length} pending records returned` : t.slice(0, 120)}`);
    await maker.page.close();
    expect([401, 403]).toContain(r.status());
  });

  for (const [id, ep] of [['TC_GQ_039', 'ApproveGoldRate'], ['TC_GQ_040', 'RejectGoldRate']]) {
    test(`${id} - ${ep} by a non-checker is refused by the server (non-existent record) @regression`, async ({ browser, record }) => {
      const s = await session(browser, MAKER);
      const r = await s.page.request.post(`${s.apiBase}/${ep}`, { headers: s.headers, data: fakeBody(s.uid, { pRemarks: 'automation probe' }) });
      const body = await r.json().catch(async () => ({ raw: await r.text() }));
      record(`${MAKER} ${ep} → HTTP ${r.status()} ${JSON.stringify(body).slice(0, 160)}`);
      await s.page.close();
      expect(body.success).toBe(false);
      expect(body.message).toMatch(data.notChecker);
    });
  }

  test('TC_GQ_041 - Approving a stale / unknown version is refused ("already processed by someone else") @regression', async ({ browser, record }) => {
    const s = await session(browser, CHECKER);
    const r = await s.page.request.post(`${s.apiBase}/ApproveGoldRate`, { headers: s.headers, data: fakeBody(s.uid) });
    const body = await r.json();
    record(`${CHECKER} ApproveGoldRate (unknown id) → HTTP ${r.status()} ${JSON.stringify(body)}`);
    await s.page.close();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(data.alreadyProcessed);
  });

  test('TC_GQ_042 - Server rejects a Reject request without remarks @regression', async ({ browser, record }) => {
    const s = await session(browser, CHECKER);
    const r = await s.page.request.post(`${s.apiBase}/RejectGoldRate`, { headers: s.headers, data: fakeBody(s.uid, { pRemarks: '' }) });
    const body = await r.json();
    record(`RejectGoldRate empty remarks → HTTP ${r.status()} ${JSON.stringify(body)}`);
    await s.page.close();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(data.serverRemarkRequired);
  });

  test('TC_GQ_043 - Refused writes use an HTTP error status, not 200 (HYPOTHESIS: REST convention) @regression', async ({ browser, record }) => {
    const s = await session(browser, MAKER);
    const r = await s.page.request.post(`${s.apiBase}/ApproveGoldRate`, { headers: s.headers, data: fakeBody(s.uid) });
    record(`Non-checker approve → HTTP ${r.status()} ${(await r.text()).slice(0, 120)}`);
    await s.page.close();
    expect(r.status()).toBeGreaterThanOrEqual(400);
  });
});
