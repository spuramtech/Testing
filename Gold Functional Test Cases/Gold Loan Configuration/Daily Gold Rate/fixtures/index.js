// Shared fixtures: `grp` = Daily Gold Rate page, logged in as the maker (INT_APPRAISER1 by default) and opened.
// `loginAs(role)` logs the current page in as another role. `record(text)` stores the observed (actual) result for the report.
const base = require('@playwright/test');
const { LoginPage } = require('../../../common/pages/LoginPage');
const { DailyGoldRatePage } = require('../pages/DailyGoldRatePage');
const { captureApi } = require('../../../common/utils/api');

const MAKER = process.env.MAKER_ROLE || 'INT_APPRAISER1';
const CHECKER = process.env.CHECKER_ROLE || 'CHECKER_BH';

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
  },
  // Every loanmaster API call the app makes during the test: [{ url, method, headers, body, status, text }]
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /loanmaster/i));
  },
  grp: async ({ page, apiHits }, use) => {
    const grp = new DailyGoldRatePage(page);
    await base.test.step(`Login as ${MAKER}`, () => new LoginPage(page).login(MAKER));
    await base.test.step('Open Loans → Gold → Gold Loan Configuration → Daily Gold Rate', () => grp.open());
    await use(grp);
  },
});

// Mark a test BLOCKED (reported separately from SKIPPED) and stop it
function blocked(testInfo, reason) {
  testInfo.annotations.push({ type: 'blocked', description: reason });
  base.test.skip(true, `BLOCKED: ${reason}`);
}

module.exports = { test, expect: base.expect, MAKER, CHECKER, blocked };
