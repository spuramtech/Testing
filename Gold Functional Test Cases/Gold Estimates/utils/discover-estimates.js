// Read-only discovery of Gold Estimates. Every non-GET API call after login is BLOCKED (nothing is saved).
// Usage: node utils/discover-estimates.js [ROLE] [contact search]
require('../../common/config/env');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../../common/pages/LoginPage');
const { go } = require('../../common/utils/nav');

const role = process.argv[2] || 'INT_APPRAISER1';
const search = process.argv[3] || 'AUTOTEST';
const OUT = path.resolve(__dirname, '../evidence/discovery');
const L = (...a) => console.log(...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const api = [];
  page.on('response', async (r) => { if (/\/api\//.test(r.url()) && !/UserRights|getCompanyDetails|holiday|dashboard/i.test(r.url())) api.push({ m: r.request().method(), u: r.url().split('/api/')[1].slice(0, 150), s: r.status(), b: (await r.text().catch(() => '')).slice(0, 700) }); });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => { const r = rt.request(); if (r.method() !== 'GET') { L('BLOCKED', r.method(), r.url().split('/api/')[1], (r.postData() || '').slice(0, 3000)); return rt.abort(); } return rt.continue(); });
  await go(page, 'Gold Estimates', ['Loans', 'Gold']);
  await page.waitForURL(/GoldEstimates/); await page.waitForTimeout(3000);
  L('URL', page.url());
  const dump = async (name) => {
    const info = await page.evaluate(() => {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const root = document.querySelector('router-outlet')?.parentElement || document.body;
      return {
        inputs: [...root.querySelectorAll('input,select,textarea,ng-select')].filter(vis).map((e) => ({ tag: e.tagName, type: e.type, fc: e.getAttribute('formcontrolname'), id: e.id || undefined, ph: e.placeholder || undefined, max: e.maxLength > 0 ? e.maxLength : undefined, ro: e.readOnly || undefined, dis: e.disabled || undefined, val: (e.value || '').slice(0, 40), opts: e.tagName === 'SELECT' ? [...e.options].map((o) => o.text).slice(0, 15) : undefined, col: e.closest('td')?.getAttribute('aria-colindex') || undefined })),
        buttons: [...root.querySelectorAll('button,a.btn')].filter(vis).map((b) => (b.innerText.trim() || b.title || b.className).slice(0, 40)),
        labels: [...root.querySelectorAll('label,th,h4,h5,h6')].filter(vis).map((e) => e.innerText.trim()).filter(Boolean),
        text: root.innerText.replace(/\s+/g, ' ').slice(0, 5000),
      };
    });
    fs.writeFileSync(`${OUT}/${role}-${name}.json`, JSON.stringify(info, null, 2));
    await page.screenshot({ path: `${OUT}/${role}-${name}.png`, fullPage: true });
    return info;
  };
  const d1 = await dump('01-open');
  L('OPEN INPUTS', d1.inputs.filter((i) => i.fc || i.tag !== 'INPUT'));
  L('OPEN BUTTONS', d1.buttons.filter((b) => !/Configuration|Loan |Credit|Nach|Npa|Suit|Vehicle|Reports|Invoice|Assign|Audit Log|Transactions|^Gold$|Jobs/.test(b)));
  L('OPEN LABELS', d1.labels);
  // Save empty
  await page.locator('button:visible').filter({ hasText: /^\s*Save\s*$/ }).last().click().catch((e) => L('SAVE FAIL', e.message.slice(0, 80)));
  await page.waitForTimeout(1500);
  L('SAVE EMPTY', await page.locator('.toast-message, .toast-title').allInnerTexts(), await page.locator('.invalid-feedback:visible, .text-danger:visible').allInnerTexts());
  for (const b of await page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
  // contact search
  const contact = page.locator('ng-select[formcontrolname=pCustomername]');
  await contact.click(); await contact.locator('input').fill(search); await page.waitForTimeout(2500);
  const opts = await page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
  L('CONTACT OPTIONS', opts.length, opts.slice(0, 3));
  await page.locator('ng-dropdown-panel .ng-option').first().click(); await page.waitForTimeout(3000);
  const d2 = await dump('02-contact');
  L('AFTER CONTACT TEXT', d2.text.slice(0, 4500));
  L('AFTER CONTACT INPUTS', d2.inputs.filter((i) => !/^(urlName)$/.test(i.fc || '')));
  L('API', api.map((a) => `${a.m} ${a.s} ${a.u}`).join('\n'));
  fs.writeFileSync(`${OUT}/${role}-api.json`, JSON.stringify(api, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
