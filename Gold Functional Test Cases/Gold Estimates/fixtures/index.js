// Fixtures for Gold Estimates.
//   ge          – maker (INT_APPRAISER1) logged in, Gold Estimates open
//   geContact   – ge + an AUTOTEST contact selected (article rows visible)
//   apiHits     – app API calls [{ url, method, headers, body, status, text }]
//   blockSave   – abort SaveMakerEntry (the image upload is still allowed – it only stores a file)
//   blockWrites – abort every non-GET API call (image upload included)
//   mockWrite(endpoint, json|'abort', {status}) – answer one endpoint with a SIMULATED response
//   record      – stores the observed (actual) result for the report
const path = require('path');
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { GoldEstimatesPage } = require('../pages/GoldEstimatesPage');

const MAKER = process.env.ESTIMATE_ROLE || 'INT_APPRAISER1';
const IMAGE = path.resolve(__dirname, '../test-data/gold-article.png');
const SAVE_API = /SaveMakerEntry/i;

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /goldestimate|loanmaster|goldschememaster|contactmaster|deductionmaster|MultiFileUploads/i));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
  },
  blockSave: async ({ page }, use) => {
    await use(() => page.route(SAVE_API, (route) => route.abort('failed')));
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
  ge: async ({ page, apiHits }, use) => {
    const ge = new GoldEstimatesPage(page);
    await base.test.step(`Login as ${MAKER}`, () => new LoginPage(page).login(MAKER));
    await base.test.step('Open Loans → Gold → Gold Estimates', () => ge.open());
    await use(ge);
  },
  geContact: async ({ ge }, use, testInfo) => {
    const name = await base.test.step('Select an AUTOTEST contact', () => ge.selectContact(process.env.ESTIMATE_CONTACT || 'Autotest'));
    testInfo.annotations.push({ type: 'test-data', description: `Contact ${name}` });
    await use(ge);
  },
});

module.exports = { test, expect: base.expect, MAKER, IMAGE, SAVE_API };
