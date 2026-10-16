// Read-only discovery of Gold Packet Barcode Generator. Every non-GET API call after login is BLOCKED; print is stubbed.
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
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const page = await ctx.newPage();
  ctx.on('page', (p) => { if (p !== page) { L('POPUP', p.url()); p.close().catch(() => {}); } });
  await page.addInitScript(() => { window.print = () => {}; });
  const api = [];
  page.on('response', async (r) => { if (/\/api\//.test(r.url()) && /barcode|packet|gold/i.test(r.url())) api.push(`${r.request().method()} ${r.status()} ${r.url().split('/api/')[1].slice(0, 120)} → ${(await r.text().catch(() => '')).slice(0, 220).replace(/\s+/g, ' ')}`); });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => { const r = rt.request(); if (r.method() !== 'GET') { L('BLOCKED', r.method(), r.url().split('/api/')[1], (r.postData() || '').slice(0, 1500)); return rt.abort(); } return rt.continue(); });
  await go(page, 'Gold Packet Barcode Generator', ['Loans', 'Gold']); await page.waitForTimeout(3500);
  L('URL', page.url());
  await page.screenshot({ path: `${OUT}/${role}-01.png`, fullPage: true });
  const body = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  L('TEXT', (await body()).split(/Gold Packet Barcode Generator/).pop().slice(0, 2000));
  L('INPUTS', await page.evaluate(() => [...document.querySelectorAll('input,select,textarea,ng-select')].filter((e) => e.offsetParent).map((e) => `${e.tagName}:${e.type || ''}:${e.getAttribute('formcontrolname') || ''}:${e.value || ''}:${e.checked ? 'checked' : ''}`).filter((x) => !/urlName/.test(x))));
  L('BUTTONS', (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t.length < 40 && !/^(Loan |Credit|Nach|Npa|Suit|Vehicle|Reports|Invoice|Assign|Audit Log|Transactions|Gold|Jobs|Configuration|Contact Configuration|Loan Configuration|Loan Origination|Loan Management|Reports & Letters)$/.test(t)));
  for (const type of ['BH', 'Audit']) {
    if (type === 'Audit') { await page.locator('label', { hasText: /^\s*Audit\s*$/ }).first().click(); await page.waitForTimeout(1500); }
    const sel = page.locator('ng-select[formcontrolname=ploanid]');
    await sel.click(); await page.waitForTimeout(1500);
    const opts = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    L(type, 'LOANS', opts.length, opts.slice(0, 8));
    await page.keyboard.press('Escape');
    // Generate without loan
    await page.locator('button:visible').filter({ hasText: /Generate barcode/i }).click(); await page.waitForTimeout(1200);
    L(type, 'GENERATE no loan →', (await page.locator('.toast-message').allInnerTexts()).join(' | '), (await body()).match(/Preview[^.]{0,80}|already has an unused barcode[^.]{0,80}/i)?.[0] || '');
    for (const x of await page.locator('.toast-close-button:visible').all()) await x.click().catch(() => {});
    const auto = opts.find((o) => /autotest/i.test(o)) || opts[0];
    if (auto) {
      await sel.click(); await sel.locator('input').fill(auto.split(' - ')[0]); await page.waitForTimeout(800);
      await page.locator('ng-dropdown-panel .ng-option').first().click(); await page.waitForTimeout(1500);
      L(type, 'SELECTED', auto, '| text:', (await body()).split(/Generate barcode/i)[0].slice(-600));
      await page.locator('button:visible').filter({ hasText: /Generate barcode/i }).click(); await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/${role}-${type}-generate.png`, fullPage: true });
      L(type, 'AFTER GENERATE', (await body()).split(/Generate barcode/i).pop().slice(0, 1500));
      L(type, 'AFTER BUTTONS', (await page.locator('button:visible, a.btn:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => /print|back|cancel|generate|close/i.test(t)));
      const pr = page.locator('button:visible, a:visible').filter({ hasText: /Print sticker/i }).first();
      if (await pr.isVisible().catch(() => false)) { await pr.click(); await page.waitForTimeout(2500); L(type, 'PRINT (blocked) →', (await page.locator('.toast-message').allInnerTexts()).join(' | '), (await body()).match(/(Recorded sticker[^.]{0,60}|Could not record[^.]{0,80})/i)?.[0] || ''); }
      const back = page.getByRole('button', { name: /^\s*Back\s*$/ });
      if (await back.isVisible().catch(() => false)) await back.click();
    }
  }
  L('API'); api.forEach((a) => L(' ', a));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
