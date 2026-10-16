// Read-only discovery of Gold Scheme Matrix. Every non-GET API call after login is BLOCKED.
// Usage: node utils/discover-scheme-matrix.js [ROLE]
require('../../common/config/env');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../../common/pages/LoginPage');
const { go } = require('../../common/utils/nav');

const role = process.argv[2] || 'CHECKER_BH';
const OUT = path.resolve(__dirname, '../evidence/discovery');
const L = (...a) => console.log(...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const api = [];
  page.on('response', async (r) => { if (/\/api\//.test(r.url()) && /scheme|loanmaster/i.test(r.url())) api.push({ m: r.request().method(), u: r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 140), s: r.status(), b: (await r.text().catch(() => '')).slice(0, 900) }); });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => { if (rt.request().method() !== 'GET') { L('BLOCKED', rt.request().method(), rt.request().url().split('/api/')[1], (rt.request().postData() || '').slice(0, 1500)); return rt.abort(); } return rt.continue(); });
  await go(page, 'Gold Loan Configuration', ['Loans', 'Gold']);
  await page.waitForURL(/GoldLoanConfiguration/); await page.waitForTimeout(1500);
  await page.getByText('Gold Scheme Matrix', { exact: true }).first().click();
  await page.waitForTimeout(3500);
  L('URL', page.url());
  await page.screenshot({ path: `${OUT}/${role}-01-list.png`, fullPage: true });
  const dump = async (name) => {
    const info = await page.evaluate(() => {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const root = document.querySelector('.glh-panel-body') || document.body;
      return {
        inputs: [...root.querySelectorAll('input,select,textarea,ng-select')].filter(vis).map((e) => ({ tag: e.tagName, type: e.type, id: e.id, fc: e.getAttribute('formcontrolname'), ph: e.placeholder, max: e.maxLength > 0 ? e.maxLength : undefined, ro: e.readOnly || undefined, dis: e.disabled || undefined, val: e.value, opts: e.tagName === 'SELECT' ? [...e.options].map((o) => o.text) : undefined })),
        buttons: [...root.querySelectorAll('button,a.btn,a[class*=btn]')].filter(vis).map((b) => (b.innerText.trim() || b.title || b.className).slice(0, 50)),
        headers: [...root.querySelectorAll('th,label,h4,h5,h6')].filter(vis).map((e) => e.innerText.trim()).filter(Boolean),
        text: root.innerText.replace(/\s+/g, ' ').slice(0, 3000),
      };
    });
    fs.writeFileSync(`${OUT}/${role}-${name}.json`, JSON.stringify(info, null, 2));
    await page.screenshot({ path: `${OUT}/${role}-${name}.png`, fullPage: true });
    return info;
  };
  const list = await dump('01-list');
  L('LIST TEXT', list.text.slice(0, 2500));
  L('LIST BUTTONS', list.buttons);
  L('LIST INPUTS', list.inputs);
  // row actions
  const firstRow = page.locator('tr', { hasText: /AT-|GL|AUTOTEST|mo/ }).first();
  L('ROW HTML', (await firstRow.innerHTML().catch(() => '')).replace(/<!---->/g, '').replace(/_ngcontent[\w-]+=""/g, '').replace(/\s+/g, ' ').slice(0, 1500));
  // New Scheme
  await page.getByText('New Scheme').first().click(); await page.waitForTimeout(2000);
  const nw = await dump('02-new');
  L('NEW INPUTS', nw.inputs);
  L('NEW BUTTONS', nw.buttons);
  L('NEW HEADERS', nw.headers);
  L('NEW TEXT', nw.text.slice(0, 2500));
  // Save empty
  await page.getByRole('button', { name: /Save Scheme/i }).click().catch((e) => L('SAVE FAIL', e.message.slice(0, 100)));
  await page.waitForTimeout(1500);
  L('SAVE EMPTY TOASTS', await page.locator('.toast-message, .toast-title').allInnerTexts());
  L('SAVE EMPTY INLINE', await page.locator('.invalid-feedback:visible, .text-danger:visible, small:visible').allInnerTexts());
  await dump('03-save-empty');
  fs.writeFileSync(`${OUT}/${role}-api.json`, JSON.stringify(api, null, 2));
  L('API', api.map((a) => `${a.m} ${a.s} ${a.u}`).join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
