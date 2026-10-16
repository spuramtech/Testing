// Read-only discovery of Gold Token. Every non-GET API call after login is BLOCKED (no loan is created).
require('../../common/config/env');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../../common/pages/LoginPage');
const { go } = require('../../common/utils/nav');
const role = process.argv[2] || 'INT_APPRAISER1';
const OUT = path.resolve(__dirname, '../evidence/discovery');
const L = (...a) => console.log(...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const api = [];
  page.on('response', async (r) => { if (/\/api\//.test(r.url()) && !/UserRights|CompanyDetails|holiday|Dashboard|login/i.test(r.url())) api.push(`${r.request().method()} ${r.status()} ${r.url().split('/api/')[1].slice(0, 120)} → ${(await r.text().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ')}`); });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => { const r = rt.request(); if (r.method() !== 'GET') { L('BLOCKED', r.method(), r.url().split('/api/')[1], (r.postData() || '').slice(0, 3000)); return rt.abort(); } return rt.continue(); });
  await go(page, 'Gold Token', ['Loans', 'Gold']); await page.waitForTimeout(4000);
  L('URL', page.url());
  await page.screenshot({ path: `${OUT}/${role}-01-list.png`, fullPage: true });
  const body = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  L('LIST TEXT', (await body()).split(/Gold Token/).pop().slice(0, 1500));
  L('HEADERS', (await page.locator('th:visible').allInnerTexts()).map((h) => h.trim()).filter(Boolean));
  L('TABS', (await page.locator('a.nav-link:visible, [role=tab]:visible, button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t.length < 30 && !/^(Loan |Credit|Nach|Npa|Suit|Vehicle|Reports|Invoice|Assign|Audit Log|Transactions|Gold|Jobs|Configuration|Contact Configuration|Loan Configuration|Loan Origination|Loan Management|Reports & Letters)$/.test(t)));
  const rows = page.locator('tr:visible', { hasText: /UID\d+/ });
  L('TOKENS', await rows.count());
  for (let i = 0; i < Math.min(await rows.count(), 6); i++) L('ROW', (await rows.nth(i).innerText()).replace(/\s+/g, ' ').slice(0, 200));
  if (await rows.count()) {
    await rows.first().locator('input[type=radio]').check({ force: true }); await page.waitForTimeout(3500);
    await page.screenshot({ path: `${OUT}/${role}-02-member.png`, fullPage: true });
    const info = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea,ng-select')].filter((e) => e.offsetParent).map((e) => ({ tag: e.tagName, type: e.type, fc: e.getAttribute('formcontrolname'), ph: e.placeholder || undefined, max: e.maxLength > 0 ? e.maxLength : undefined, ro: e.readOnly || undefined, dis: e.disabled || undefined, val: (e.value || '').slice(0, 30), opts: e.tagName === 'SELECT' ? [...e.options].map((o) => o.text).slice(0, 12) : undefined })).filter((x) => x.fc !== 'urlName'));
    L('MEMBER INPUTS', info);
    L('MEMBER TEXT', (await body()).split(/Available Gold Loan Tokens/).pop().slice(0, 2500));
    // Next without nominee
    const next = page.locator('button:visible, a:visible').filter({ hasText: /^\W*Next\s*$/ }).last();
    await next.click(); await page.waitForTimeout(2000);
    L('NEXT no nominee → toast', (await page.locator('.toast-message').allInnerTexts()).join(' | '), '| amount box visible', await page.locator('[formcontrolname=pAmountrequsetd]').isVisible().catch(() => false));
    await page.screenshot({ path: `${OUT}/${role}-03-after-next.png`, fullPage: true });
    if (await page.locator('[formcontrolname=pAmountrequsetd]').isVisible().catch(() => false)) {
      const li = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea')].filter((e) => e.offsetParent).map((e) => `${e.getAttribute('formcontrolname')}=${(e.value || '').slice(0, 25)}${e.readOnly ? '(ro)' : ''}${e.disabled ? '(dis)' : ''}`).filter((x) => !x.startsWith('null') && !x.startsWith('urlName')));
      L('LOAN INPUTS', li);
      L('LOAN TEXT', (await body()).split(/Loan Details/).pop().slice(0, 2000));
    }
  }
  L('API'); api.forEach((a) => L(' ', a));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
