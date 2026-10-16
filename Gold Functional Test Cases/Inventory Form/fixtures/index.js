// Fixtures for the Inventory Form.
//   inv       – Branch Head (CHECKER_BH) logged in, Inventory Form open, EVERY write blocked
//   invReal   – same login and page but writes NOT blocked (only for the opt-in real test)
//   apiHits   – API calls [{ url, method, headers, body, status, text }]
//   mockApi(endpoint, json|'abort', {status}) – SIMULATED reply for one endpoint; returns the sent bodies
//   record    – stores the observed (actual) result for the report
//   live      – today's real data: { loans, register } (loans offered by the form, barcode register rows)
const path = require('path');
const base = require('@playwright/test');
const { LoginPage } = require('../../common/pages/LoginPage');
const { captureApi } = require('../../common/utils/api');
const { InventoryPage } = require('../pages/InventoryPage');

const ROLE = process.env.INVENTORY_ROLE || 'CHECKER_BH';
const PHOTO = path.resolve(__dirname, '../test-data/gold-article.png');

async function prepare(page, block) {
  await new LoginPage(page).login(ROLE);
  if (block) await page.route(/\/api\//, (route) => (route.request().method() !== 'GET' ? route.abort('failed') : route.fallback()));
  return new InventoryPage(page);
}

const test = base.test.extend({
  record: async ({}, use, testInfo) => {
    await use((text) => testInfo.annotations.push({ type: 'actual', description: String(text) }));
  },
  apiHits: async ({ page }, use) => {
    await use(captureApi(page, /Inventory|goldpacketbarcode|getcheckpacketnumber|GetApplicantionid|GetGLDetailsById|InventoryMasters/i));
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
  // live data read through the app's own API (GET only): offered loans, barcode register, an offered loan with an unused BH barcode
  live: async ({ page, inv, apiHits }, use) => {
    const loans = (await inv.loanOptions()).map((o) => o.match(/GLNG\d+/)?.[0]).filter(Boolean);
    const hit = apiHits.find((h) => /GetApplicantionid/i.test(h.url) && h.headers.authorization);
    const apiBase = hit.url.split('/api/')[0] + '/api/';
    const get = async (p) => (await page.request.get(apiBase + p, { headers: hit.headers })).json();
    const register = await get('loans/Transactions/goldpacketbarcode/getbarcoderegister?Status=');
    const ready = register.find((r) => r.pStatus === 'Not Used' && r.pType === 'New' && loans.includes(r.pLoanid));
    await use({ loans, register, ready, get, hit, apiBase });
  },
  // simulated photo upload (the real one writes a file to the server)
  fakeUpload: async ({ page }, use) => {
    await page.route(/MultiFileUploads/i, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['SIMULATED/Upload/HEAD OFFICE/Documents/SIM-Packet.png', 'SIM-Packet.png']) }));
    await use(true);
  },
  inv: async ({ page, apiHits }, use) => {
    const inv = await base.test.step(`Login as ${ROLE} (writes blocked)`, () => prepare(page, true));
    await base.test.step('Open Loans → Gold → Inventory Form', () => inv.open());
    await use(inv);
  },
  invReal: async ({ page, apiHits }, use) => {
    const inv = await prepare(page, false);
    await inv.open();
    await use(inv);
  },
});

module.exports = { test, expect: base.expect, ROLE, PHOTO };
