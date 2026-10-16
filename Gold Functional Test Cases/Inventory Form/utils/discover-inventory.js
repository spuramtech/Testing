// Read-only discovery of the Inventory Form. Every non-GET API call after login is BLOCKED (logged with its body).
require('../../common/config/env');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../../common/pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const role = process.argv[2] || 'CHECKER_BH';
const OUT = path.resolve(__dirname, '../evidence/discovery');
const L = (...a) => console.log(...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));
const clip = (s, n = 1500) => String(s).replace(/\s+/g, ' ').slice(0, n);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const page = await ctx.newPage();
  const api = [];
  page.on('response', async (r) => {
    if (!/\/api\//.test(r.url()) || /login|menu|notification/i.test(r.url())) return;
    api.push(`${r.request().method()} ${r.status()} ${r.url().split('/api/')[1].slice(0, 140)} → ${clip(await r.text().catch(() => ''), 260)}`);
  });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => {
    const r = rt.request();
    if (r.method() !== 'GET') { L('BLOCKED', r.method(), r.url().split('/api/')[1], clip(r.postData() || '', 2500)); return rt.abort(); }
    return rt.continue();
  });
  const inv = new InventoryPage(page);
  const body = async () => clip(await page.locator('body').innerText(), 100000);
  const toasts = async () => (await inv.messages()).join(' | ');
  const closeToasts = async () => { for (const x of await page.locator('.toast-close-button:visible').all()) await x.click().catch(() => {}); };

  const ok = await inv.open().then(() => true).catch((e) => e.message.split('\n')[0]);
  L('OPEN', ok, page.url());
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/${role}-01.png`, fullPage: true });
  if (ok !== true) { L('TEXT', (await body()).slice(-1500)); L('API'); api.forEach((a) => L(' ', a)); return b.close(); }

  L('TEXT', (await body()).split(/Inventory Form/).pop().slice(0, 2500));
  L('INPUTS', await page.evaluate(() => [...document.querySelectorAll('input,select,textarea,ng-select')].filter((e) => e.offsetParent)
    .map((e) => `${e.tagName}:${e.type || ''}:${e.getAttribute('formcontrolname') || e.id || e.getAttribute('placeholder') || ''}:${e.readOnly ? 'ro' : ''}${e.disabled ? 'dis' : ''}:${(e.value || '').slice(0, 30)}`)
    .filter((x) => !/urlName/.test(x))));
  L('LOANTYPES', await inv.loanType.locator('option').allInnerTexts());
  L('BUTTONS', (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t.length < 30));

  // Save with nothing filled
  await inv.save.click().catch((e) => L('SAVE empty click err', e.message.split('\n')[0]));
  await page.waitForTimeout(1500);
  L('SAVE empty →', await toasts(), '|', (await body()).match(/(required|please[^.]{0,80})/gi)?.slice(0, 8));
  await closeToasts();

  await inv.loanType.selectOption({ label: 'Gold Loan' });
  await page.waitForTimeout(1500);
  await inv.loan.click();
  await page.waitForTimeout(1500);
  const loans = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => clip(t, 120));
  L('LOANS', loans.length, loans.slice(0, 15));
  await page.keyboard.press('Escape');
  if (!loans.length || /No items/i.test(loans[0])) { L('API'); api.forEach((a) => L(' ', a)); return b.close(); }

  const loanNo = (loans.find((l) => /autotest/i.test(l)) || loans[0]).match(/GLNG\d+/)?.[0] || loans[0];
  await inv.loan.click();
  await page.locator('ng-dropdown-panel .ng-option', { hasText: loanNo }).first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${role}-02-loan.png`, fullPage: true });
  L('LOAN', loanNo, 'INFO', await inv.customerInfo());
  L('LOAN TEXT', (await body()).split(/Inventory Form/).pop().slice(0, 2500));
  L('COLLATERAL', await inv.collateral());
  L('PACKETNO', await inv.packetNo.inputValue().catch(() => '?'), 'readonly', await inv.packetNo.evaluate((e) => e.readOnly || e.disabled).catch(() => '?'));

  // scan checks: no selection, invalid, audit-type
  for (const [label, code, tick] of [['no articles ticked', 'BH0000000000', false], ['invalid', 'XYZ123', true], ['unknown BH', 'BH9999999999', true], ['audit', 'AUD2610000015', true]]) {
    if (tick) await page.locator('input#selectAll, th input[type=checkbox]').first().check({ force: true }).catch(() => {});
    await inv.scan.fill(code);
    await inv.scan.press('Enter');
    await page.waitForTimeout(2000);
    L('SCAN', label, code, '→', await toasts(), '| packet', await inv.packetNo.inputValue().catch(() => '?'));
    await closeToasts();
  }
  await page.screenshot({ path: `${OUT}/${role}-03-scan.png`, fullPage: true });

  // vault / safe / locker
  await inv.vault.click();
  await page.waitForTimeout(1000);
  L('VAULTS', (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => clip(t, 80)));
  await page.keyboard.press('Escape');
  L('SAFES (before vault)', await inv.safe.locator('option').allInnerTexts().catch(() => '?'));
  await inv.vault.click();
  await page.locator('ng-dropdown-panel .ng-option').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  L('VAULTCODE', await inv.vaultCode.inputValue().catch(() => '?'), 'SAFES', await inv.safe.locator('option').allInnerTexts().catch(() => '?'));
  await inv.safe.selectOption({ index: 1 }).catch(() => {});
  await page.waitForTimeout(1500);
  L('LOCKERS', (await inv.locker.locator('option').allInnerTexts().catch(() => [])).slice(0, 20));

  // Add without barcode / photo
  await inv.add.click().catch((e) => L('ADD err', e.message.split('\n')[0]));
  await page.waitForTimeout(1500);
  L('ADD (no barcode/photo) →', await toasts());
  await closeToasts();
  L('PHOTO accept', await inv.photo.getAttribute('accept').catch(() => '?'));
  await inv.save.click().catch(() => {});
  await page.waitForTimeout(1500);
  L('SAVE (no packet added) →', await toasts());
  await page.screenshot({ path: `${OUT}/${role}-04-end.png`, fullPage: true });

  L('API'); api.forEach((a) => L(' ', a));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
