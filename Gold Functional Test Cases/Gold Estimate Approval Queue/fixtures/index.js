// Fixtures for the Gold Estimate Approval Queue.
//   q           – page object (not logged in yet); use loginAs(role) then q.open()
//   checkerQ    – CHECKER_BH (Branch Head) logged in, queue open (real data, read-only)
//   apiHits     – goldestimate API calls [{ url, method, headers, body, status, text }]
//   blockWrites – abort every non-GET API call
//   mockWrite(endpoint, json|'abort', {status}) – answer one write endpoint with a SIMULATED response; returns sent bodies
//   simulate(role, opts) – serve a SIMULATED pending estimate to this role (see utils/simulate.js); returns it
//   uid()       – current user's id (from sessionStorage)
//   record      – stores the observed (actual) result for the report
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { GoldEstimateApprovalQueuePage } = require('../pages/GoldEstimateApprovalQueuePage');
const sim = require('../utils/simulate');

const ROLES = { CHECKER: process.env.CHECKER_ROLE || 'CHECKER_BH', IA1: 'INT_APPRAISER1', IA2: 'INT_APPRAISER2', EXT1: 'EXT_APPRAISER1' };
const WRITE_API = /ApproveInternalAppraisal|ApproveGoldEstimate|RevertGoldEstimate|SaveMakerEntry/i;

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /goldestimate/i));
  },
  q: async ({ page }, use) => {
    await use(new GoldEstimateApprovalQueuePage(page));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
  },
  uid: async ({ page }, use) => {
    await use(async () => JSON.parse((await page.evaluate(() => sessionStorage.getItem('currentUser'))) || '{}').pUserID);
  },
  blockWrites: async ({ page }, use) => {
    // login is a POST too – it is always allowed
    await use(() => page.route(/\/api\//, (route) => (route.request().method() !== 'GET' && !/\/api\/login/i.test(route.request().url()) ? route.abort('failed') : route.fallback())));
  },
  mockWrite: async ({ page }, use) => {
    await use(async (endpoint, response, { status = 200 } = {}) => {
      const sent = [];
      await page.route(new RegExp(endpoint, 'i'), (route) => {
        sent.push(JSON.parse(route.request().postData() || '{}'));
        if (response === 'abort') return route.abort('failed');
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) });
      });
      return sent;
    });
  },
  checkerQ: async ({ page, q, apiHits }, use) => {
    await base.test.step(`Login as ${ROLES.CHECKER}`, () => new LoginPage(page).login(ROLES.CHECKER));
    await base.test.step('Open Gold Estimate Approval Queue', () => q.open());
    await use(q);
  },
  // Login as `role`, serve a simulated estimate, open the queue. role 'IA2' → Verify; 'CHECKER' → Review (Ready for Approval)
  simulate: async ({ page, q }, use) => {
    await use(async (role, { entries = 2, makerId } = {}) => {
      await new LoginPage(page).login(ROLES[role]);
      const me = JSON.parse((await page.evaluate(() => sessionStorage.getItem('currentUser'))) || '{}').pUserID;
      const est = role === 'IA2'
        ? sim.buildEstimate({ ge: sim.SIM_IA2_GE, status: 'PENDING_IA_APPROVAL', entries: 1, ia2Id: me, makerId: makerId ?? 15 })
        : sim.buildEstimate({ ge: sim.SIM_CHECKER_GE, status: 'PENDING_CHECKER', entries, makerId: makerId ?? 15 });
      await sim.serve(page, est, role === 'IA2' ? ['GetPendingInternalApprovalForUser'] : ['GetGoldEstimateQueue']);
      await q.open();
      return est;
    });
  },
});

module.exports = { test, expect: base.expect, ROLES, WRITE_API, sim };
