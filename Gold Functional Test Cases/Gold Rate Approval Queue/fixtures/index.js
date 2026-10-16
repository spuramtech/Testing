// Fixtures for Gold Rate Approval Queue.
//   queue   – page logged in as the Checker (CHECKER_BH) with the queue open
//   apiHits – every loanmaster API call the app makes: [{ url, method, headers, body, status, text }]
//   blockWrites() – abort every non-GET API call (Approve / Reject never reach the server)
//   mockWrite(endpoint, response, { removeDay }) – answer Approve/Reject with a SIMULATED response and,
//        when removeDay is set, hide that day from the next queue reload – no server data changes
//   record(text) – stores the observed (actual) result for the report
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { GoldRateApprovalQueuePage } = require('../pages/GoldRateApprovalQueuePage');

const CHECKER = process.env.CHECKER_ROLE || 'CHECKER_BH';
const MAKER = process.env.MAKER_ROLE || 'INT_APPRAISER1';
const WRITE_API = /ApproveGoldRate|RejectGoldRate/i;

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /loanmaster/i));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
  },
  blockWrites: async ({ page }, use) => {
    await use(async () => {
      await page.route('**/api/**', (route) => (route.request().method() !== 'GET' ? route.abort('failed') : route.fallback()));
    });
  },
  mockWrite: async ({ page }, use) => {
    await use(async (endpoint, response, { removeDay = null, status = 200 } = {}) => {
      const sent = [];
      await page.route(new RegExp(endpoint, 'i'), async (route) => {
        sent.push(JSON.parse(route.request().postData() || '{}'));
        if (response === 'abort') return route.abort('failed');
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) });
      });
      if (removeDay) {
        await page.route(/GetPendingGoldRateApprovals/i, async (route) => {
          if (!sent.length) return route.fallback();
          const res = await route.fetch();
          const list = (await res.json()).filter((r) => !String(r.ptransdate).startsWith(removeDay));
          return route.fulfill({ response: res, json: list });
        });
      }
      return sent;
    });
  },
  queue: async ({ page, apiHits }, use) => {
    const q = new GoldRateApprovalQueuePage(page);
    await base.test.step(`Login as ${CHECKER}`, () => new LoginPage(page).login(CHECKER));
    await base.test.step('Open Gold Loan Configuration → Gold Rate Approval', () => q.open());
    await use(q);
  },
});

function blocked(testInfo, reason) {
  testInfo.annotations.push({ type: 'blocked', description: reason });
  base.test.skip(true, `BLOCKED: ${reason}`);
}

module.exports = { test, expect: base.expect, CHECKER, MAKER, WRITE_API, blocked };
