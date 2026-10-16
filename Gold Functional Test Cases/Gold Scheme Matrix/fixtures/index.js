// Fixtures for Gold Scheme Matrix.
//   gsm         – admin (CHECKER_BH) logged in, Gold Scheme Matrix open
//   apiHits     – app API calls [{ url, method, headers, body, status, text }]
//   blockWrites – abort every non-GET API call (nothing is saved)
//   mockWrite(endpoint, json|'abort', {status}) – answer one write endpoint with a SIMULATED response
//   created     – register a scheme code this test created; it is DELETED after the test (pass or fail)
//   record      – stores the observed (actual) result for the report
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { GoldSchemeMatrixPage } = require('../pages/GoldSchemeMatrixPage');

const ADMIN = process.env.SCHEME_ROLE || 'CHECKER_BH';
const MAKER = process.env.MAKER_ROLE || 'INT_APPRAISER1';
const WRITE_API = /savegoldschemeconfiguration|savegoldschemeslabrates|deletegoldschemeconfiguration/i;

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /goldscheme|loanmaster/i));
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
  gsm: async ({ page, apiHits }, use) => {
    const gsm = new GoldSchemeMatrixPage(page);
    await base.test.step(`Login as ${ADMIN}`, () => new LoginPage(page).login(ADMIN));
    await base.test.step('Open Gold Loan Configuration → Gold Scheme Matrix', () => gsm.open());
    await use(gsm);
  },
  // Clean-up: every code pushed here is deleted after the test through the screen (fresh login)
  created: async ({ browser }, use, testInfo) => {
    const codes = [];
    await use(codes);
    if (!codes.length) return;
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: testInfo.project.use.baseURL });
    page.on('dialog', (d) => d.accept());
    const gsm = new GoldSchemeMatrixPage(page);
    const done = [];
    try {
      await new LoginPage(page).login(ADMIN);
      await gsm.open();
      for (const code of [...new Set(codes)]) {
        for (let i = 0; i < 3; i++) { // duplicates with the same code are deleted one by one
          const row = await gsm.findRow(code);
          if (!row) break;
          await row.locator('[title=Delete]').click();
          await page.waitForTimeout(2000);
          done.push(code);
          await gsm.reopen();
        }
      }
    } catch (e) {
      testInfo.annotations.push({ type: 'cleanup', description: `Clean-up failed for ${codes.join(', ')}: ${e.message.slice(0, 120)}` });
    } finally {
      testInfo.annotations.push({ type: 'cleanup', description: `Deleted ${done.join(', ') || 'nothing'} (created ${codes.join(', ')})` });
      await page.close();
    }
  },
});

// Unique throwaway scheme data – code prefix AT-T marks test data
function testScheme(over = {}) {
  const tag = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`;
  return { loan: 'New Gold (GLNG)', code: `AT-T${tag}`, name: `AUTOTEST FT ${tag}`, tenure: 6, type: 'BULLET', rate: 20, active: false, ...over };
}

module.exports = { test, expect: base.expect, ADMIN, MAKER, WRITE_API, testScheme };
