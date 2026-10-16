// Read-only discovery of the Gold Estimate Approval Queue for one role. Every non-GET API call is BLOCKED.
// Usage: node utils/discover-queue.js ROLE
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
  page.on('response', async (r) => { if (/goldestimate/i.test(r.url())) api.push(`${r.request().method()} ${r.status()} ${r.url().split('/api/')[1].slice(0, 110)} → ${(await r.text().catch(() => '')).slice(0, 160)}`); });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => { const r = rt.request(); if (r.method() !== 'GET') { L('BLOCKED', r.method(), r.url().split('/api/')[1], (r.postData() || '').slice(0, 1500)); return rt.abort(); } return rt.continue(); });
  await go(page, 'Gold Estimate Approval Queue', ['Loans', 'Gold']).catch((e) => L('NAV FAIL', e.message.slice(0, 80)));
  await page.waitForTimeout(4000);
  L('URL', page.url());
  await page.screenshot({ path: `${OUT}/${role}-01-queue.png`, fullPage: true });
  const root = page.locator('router-outlet ~ *').last();
  L('HEADERS', (await page.locator('th:visible').allInnerTexts()).map((h) => h.trim()).filter(Boolean));
  L('FILTERS', await page.locator('input:visible, select:visible, ng-select:visible').evaluateAll((es) => es.map((e) => `${e.tagName}:${e.getAttribute('formcontrolname') || ''}:${e.placeholder || ''}:${e.tagName === 'SELECT' ? [...e.options].map((o) => o.text).join('/') : ''}`)));
  L('TABS/BUTTONS', (await page.locator('button:visible, a.nav-link:visible, [role=tab]:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && !/^(Loan |Credit|Nach|Npa|Suit|Vehicle|Reports|Invoice|Assign|Audit Log|Transactions|Gold|Jobs|Configuration|Contact Configuration|Loan Configuration|Loan Origination|Loan Management|Reports & Letters)$/.test(t)));
  const rows = page.locator('tr:visible', { hasText: /GE\d{8,}/ });
  const n = await rows.count();
  L('ROWS', n);
  for (let i = 0; i < Math.min(n, 8); i++) L('ROW', (await rows.nth(i).innerText()).replace(/\s+/g, ' ').slice(0, 220), '| actions:', await rows.nth(i).locator('button, a').evaluateAll((b) => b.map((x) => (x.innerText.trim() || x.title).slice(0, 25))));
  L('PAGER', await page.locator('.k-pager-info:visible').innerText().catch(() => 'none'));
  // open first actionable row (GET only) to see the detail screen
  const act = rows.locator('button').filter({ hasText: /Verify|Review|Appraise|View/ }).first();
  if (await act.count()) {
    const label = (await act.innerText()).trim();
    await act.click(); await page.waitForTimeout(3500);
    L('OPENED', label, page.url());
    await page.screenshot({ path: `${OUT}/${role}-02-${label}.png`, fullPage: true });
    L('DETAIL TEXT', (await page.locator('body').innerText()).replace(/\s+/g, ' ').split(/Gold Estimate Approval Queue|Approval Detail|Appraise GE Number/).slice(-1)[0].slice(0, 2500));
    L('DETAIL BUTTONS', (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => /approve|revert|reject|back|save|confirm|cancel|close/i.test(t)));
    // try the main actions with writes blocked
    for (const name of ['Revert', 'Reject', 'Approve']) {
      const b = page.locator('button:visible').filter({ hasText: new RegExp(`^\W*${name}\s*$`) }).first();
      if (!(await b.count())) continue;
      await b.click(); await page.waitForTimeout(1500);
      const dlg = (await page.locator('.modal.show, .swal2-popup').allInnerTexts()).join(' | ').replace(/\s+/g, ' ').replace(/Session Timeout.*?Login Again/, '').replace(/EMI Calculator.*?Calculate ×Instalment NoPrincipalInterestAmount No records available\./, '');
      L(`${name} DIALOG`, dlg.slice(0, 900), '| toast:', (await page.locator('.toast-message').allInnerTexts()).join(' | '));
      await page.screenshot({ path: `${OUT}/${role}-03-${name}.png`, fullPage: true });
      // confirm with empty remarks, then with remarks (blocked)
      const confirm = page.locator('.modal.show button, .swal2-popup button').filter({ hasText: new RegExp(`confirm|${name}|submit|yes`, 'i') }).last();
      if (await confirm.isVisible().catch(() => false)) {
        await confirm.click(); await page.waitForTimeout(1200);
        L(`${name} CONFIRM EMPTY toast:`, (await page.locator('.toast-message').allInnerTexts()).join(' | '));
        const box = page.locator('.modal.show textarea, .swal2-popup textarea').first();
        if (await box.isVisible().catch(() => false)) { await box.fill('automation probe – blocked'); await confirm.click(); await page.waitForTimeout(1500); L(`${name} CONFIRM FILLED toast:`, (await page.locator('.toast-message').allInnerTexts()).join(' | ')); }
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(500);
      for (const c of await page.locator('.modal.show .close, .modal.show button:has-text("Cancel")').all()) await c.click().catch(() => {});
    }
  }
  L('API'); api.forEach((a) => L(' ', a));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
