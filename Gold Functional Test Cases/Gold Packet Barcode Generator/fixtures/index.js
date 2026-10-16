// Fixtures for the Gold Packet Barcode Generator.
//   bc        – Branch Head (CHECKER_BH) logged in, generator open, EVERY write blocked, browser print stubbed,
//               extra windows (print preview) closed automatically
//   bcReal    – same login and page but writes NOT blocked (only for the opt-in real test)
//   register  – bc on the Barcode Register page (writes blocked)
//   apiHits   – API calls [{ url, method, headers, body, status, text }]
//   mockWrite(endpoint, json|'abort', {status}) – SIMULATED reply for one write endpoint; returns the sent bodies
//   record    – stores the observed (actual) result for the report
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { GoldBarcodePage } = require('../pages/GoldBarcodePage');

const ROLE = process.env.BARCODE_ROLE || 'CHECKER_BH';
const WRITE_API = /goldpacketbarcode\/(generatebarcode|cancelbarcode|cancelandgenerate|regenerate)/i;

async function prepare(page, context, block) {
  await page.addInitScript(() => { window.print = () => {}; });
  context.on('page', (p) => { if (p !== page) p.close().catch(() => {}); });
  await new LoginPage(page).login(ROLE);
  if (block) await page.route(/\/api\//, (route) => (route.request().method() !== 'GET' ? route.abort('failed') : route.fallback()));
  return new GoldBarcodePage(page);
}

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /goldpacketbarcode|goldestimate/i));
  },
  loginAs: async ({ page }, use) => {
    await use((role) => new LoginPage(page).login(role));
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
  bc: async ({ page, context, apiHits }, use) => {
    const bc = await base.test.step(`Login as ${ROLE} (writes blocked)`, () => prepare(page, context, true));
    await base.test.step('Open Loans → Gold → Gold Packet Barcode Generator', () => bc.open());
    await use(bc);
  },
  register: async ({ page, context, apiHits }, use) => {
    const bc = await base.test.step(`Login as ${ROLE} (writes blocked)`, () => prepare(page, context, true));
    await base.test.step('Open Barcode Register', () => bc.openRegister());
    await use(bc);
  },
  bcReal: async ({ page, context, apiHits }, use) => {
    const bc = await prepare(page, context, false);
    await bc.open();
    await use(bc);
  },
});

module.exports = { test, expect: base.expect, ROLE, WRITE_API };
