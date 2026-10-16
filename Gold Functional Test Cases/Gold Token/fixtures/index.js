// Fixtures for Gold Token.
//   gt          – maker (INT_APPRAISER1) logged in, Gold Token open (real list, read-only)
//   simToken    – gt + a SIMULATED available token UID99999 (copied from a used AUTOTEST token) listed and selected;
//                 every write is BLOCKED unless the test replaces it with mockWrite. Returns { page object, token data }.
//   apiHits     – API calls [{ url, method, headers, body, status, text }]
//   blockWrites / mockWrite(endpoint, json|'abort', {status}) – as in the other forms
//   record      – stores the observed (actual) result for the report
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { GoldTokenPage } = require('../pages/GoldTokenPage');
const simItem = require('../test-data/samples/token-list-item.json');
const simDetails = require('../test-data/samples/token-estimate-details.json');

const MAKER = process.env.TOKEN_ROLE || 'INT_APPRAISER1';
const SAVE_API = /SaveCustomerandGoldLoanAllDetails/i;
const SIM = 'UID99999';

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /Firstinformation|Disbursement|MultiFileUploads|loanmaster/i));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
  },
  blockWrites: async ({ page }, use) => {
    await use(() => page.route(/\/api\//, (route) => (route.request().method() !== 'GET' ? route.abort('failed') : route.fallback())));
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
  gt: async ({ page, apiHits }, use) => {
    const gt = new GoldTokenPage(page);
    await base.test.step(`Login as ${MAKER}`, () => new LoginPage(page).login(MAKER));
    await base.test.step('Open Loans → Gold → Gold Token', () => gt.open());
    await use(gt);
  },
  simToken: async ({ page, apiHits }, use) => {
    const gt = new GoldTokenPage(page);
    await base.test.step(`Login as ${MAKER}`, () => new LoginPage(page).login(MAKER));
    // every write blocked first (a later mockWrite route takes precedence for its endpoint)
    await page.route(/\/api\//, (route) => (route.request().method() !== 'GET' ? route.abort('failed') : route.fallback()));
    const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    await page.route(/Firstinformation\/GetGoldLoanCustomerDetails/i, async (route) => {
      const res = await route.fetch();
      const real = await res.json().catch(() => []);
      return json(route, [simItem, ...real.filter((r) => r.puniqueid !== SIM)]);
    });
    await page.route(new RegExp(`GetGoldEstimationDetailsbyToken\\?token=${SIM}`, 'i'), (route) => json(route, simDetails));
    await base.test.step('Open Gold Token (simulated token UID99999 added)', () => gt.open());
    await base.test.step('Select simulated token UID99999', () => gt.selectToken(SIM));
    await use({ gt, data: simDetails[0], item: simItem });
  },
});

module.exports = { test, expect: base.expect, MAKER, SAVE_API, SIM };
