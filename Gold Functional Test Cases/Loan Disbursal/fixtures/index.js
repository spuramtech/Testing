// Fixtures for Loan Disbursal.
//   ld        – maker (INT_APPRAISER1 / tryfinsta) logged in, Loan Disbursal list open (Show Loans), EVERY write blocked
//   ldReal    – same login and page but writes NOT blocked (only for the opt-in real test)
//   loan      – ld with an AUTOTEST approved loan (sanctioned > 0, nothing pending) opened; skips when none
//   apiHits   – API calls [{ url, method, headers, body, status, text }]
//   mockApi(endpoint, json|'abort', {status}) – SIMULATED reply for one endpoint; returns the sent bodies
//   api       – GET helper using the app's own token: api.get('loans/...')
//   record    – stores the observed (actual) result for the report
// The list's Actions icon is "Revert to Approval" – no test clicks it.
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { LoanDisbursalPage } = require('../pages/LoanDisbursalPage');

const ROLE = process.env.DISBURSAL_ROLE || 'INT_APPRAISER1';
const SUBMIT = 'golddisbursal/SubmitDisbursal';

async function prepare(page, block) {
  await new LoginPage(page).login(ROLE);
  if (block) await page.route(/\/api\//, (route) => (route.request().method() !== 'GET' ? route.abort('failed') : route.fallback()));
  const ld = new LoanDisbursalPage(page);
  await ld.open();
  return ld;
}

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /Disbursement|golddisbursal|getbankbalances|GetReceiptsandPayments|contactmasterNew|GetBankDetailsbyId|Firstinformation/i));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
  },
  mockApi: async ({ page }, use) => {
    await use(async (endpoint, response, { status = 200 } = {}) => {
      const sent = [];
      await page.route(new RegExp(endpoint, 'i'), (route) => {
        const b = route.request().postData();
        try { sent.push(JSON.parse(b || '{}')); } catch { sent.push(b); }
        if (response === 'abort') return route.abort('failed');
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) });
      });
      return sent;
    });
  },
  ld: async ({ page, apiHits }, use) => {
    const ld = await base.test.step(`Login as ${ROLE} (writes blocked) and open Loan Disbursal`, () => prepare(page, true));
    await use(ld);
  },
  api: async ({ page, ld, apiHits }, use) => {
    const hit = apiHits.find((h) => /GetDisbursementViewData/i.test(h.url) && h.headers.authorization);
    const apiBase = hit.url.split('/api/')[0] + '/api/';
    await use({
      hit, apiBase,
      get: async (p) => { const r = await page.request.get(apiBase + p, { headers: hit.headers }); return r.status() === 204 ? null : r.json().catch(() => null); },
    });
  },
  // an AUTOTEST approved loan with sanctioned > 0 and no submission pending, opened in the form
  loan: async ({ ld, api }, use) => {
    const list = (await ld.approvedLoans('Autotest')).filter((l) => l.sanctioned > 0);
    let pick = null;
    for (const l of list) {
      const latest = await api.get(`loans/transactions/golddisbursal/GetLatestForApplication?branchschema=public&vchapplicationid=${l.appNo}`);
      if (!latest) { pick = l; break; }
    }
    base.test.skip(!pick, 'no AUTOTEST approved loan with a sanctioned amount and nothing pending');
    await base.test.step(`Open ${pick.appNo}`, () => ld.openLoan(pick.appNo));
    await ld.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await use({ ...pick, ld });
  },
  ldReal: async ({ page, apiHits }, use) => {
    await use(await prepare(page, false));
  },
});

module.exports = { test, expect: base.expect, ROLE, SUBMIT };
