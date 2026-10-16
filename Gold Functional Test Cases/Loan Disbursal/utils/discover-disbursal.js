// Read-only discovery of Loan Disbursal. Every non-GET API call after login is BLOCKED (logged with its body).
// Never clicks the Actions icon on the list (it is "Revert to Approval").
require('../../common/config/env');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../../common/pages/LoginPage');
const { LoanDisbursalPage } = require('../pages/LoanDisbursalPage');
const role = process.argv[2] || 'INT_APPRAISER1';
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
    if (!/\/api\//.test(r.url()) || /login|menu|notification|UserRights|Company/i.test(r.url())) return;
    api.push(`${r.request().method()} ${r.status()} ${r.url().split('/api/')[1].slice(0, 160)} → ${clip(await r.text().catch(() => ''), 240)}`);
  });
  page.on('dialog', (d) => { L('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await page.route('**/api/**', (rt) => {
    const r = rt.request();
    if (r.method() !== 'GET') { L('BLOCKED', r.method(), r.url().split('/api/')[1], clip(r.postData() || '', 3000)); return rt.abort(); }
    return rt.continue();
  });
  const d = new LoanDisbursalPage(page);
  const body = async () => clip(await page.locator('body').innerText(), 100000);
  const toasts = async () => (await d.messages()).map((t) => t.trim()).filter(Boolean).join(' | ');
  const closeToasts = async () => { for (const x of await page.locator('.toast-close-button:visible').all()) await x.click().catch(() => {}); };

  const ok = await d.open().then(() => true).catch((e) => e.message.split('\n')[0]);
  L('OPEN', ok, page.url());
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${role}-01-list.png`, fullPage: true });
  if (ok !== true) { L('TEXT', (await body()).slice(-1500)); L('API'); api.forEach((a) => L(' ', a)); return b.close(); }
  L('LIST TEXT', (await body()).split(/Loan Disbursal/).pop().slice(0, 1800));
  L('TH', (await page.locator('th:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean));
  L('PAGER', await page.locator('.k-pager-info:visible').first().innerText().catch(() => '-'));
  L('SELECTS', await page.evaluate(() => [...document.querySelectorAll('select')].filter((e) => e.offsetParent).map((s) => `${s.getAttribute('formcontrolname') || s.id}: ${[...s.options].map((o) => o.text.trim()).slice(0, 8).join(' / ')}`)));
  for (const tab of ['Fully Disbursed', 'Part Amount Disbursed', 'Stage Wise', 'Approved']) {
    const t = page.getByText(tab, { exact: true }).locator('visible=true').first();
    if (!(await t.isVisible().catch(() => false))) { L('TAB missing', tab); continue; }
    await t.click(); await page.waitForTimeout(2500);
    L('TAB', tab, 'pager', await page.locator('.k-pager-info:visible').first().innerText().catch(() => '-'), 'first rows', (await page.locator('tr:visible', { has: page.locator('td') }).allInnerTexts()).slice(0, 3).map((x) => clip(x, 200)));
  }
  const list = await d.approvedLoans('Autotest');
  L('APPROVED AUTOTEST', list.length, list.slice(0, 6));
  const loan = list.find((l) => l.sanctioned > 0);
  if (!loan) { L('API'); api.forEach((a) => L(' ', a)); return b.close(); }

  await d.openLoan(loan.appNo);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/${role}-02-loan.png`, fullPage: true });
  L('LOAN', loan.appNo, 'HEADER', await d.header());
  L('LOAN TEXT', (await body()).split(/Loan Disbursal|Disbursement/).pop().slice(0, 3500));
  L('INPUTS', await page.evaluate(() => [...document.querySelectorAll('input,select,textarea,ng-select')].filter((e) => e.offsetParent)
    .map((e) => `${e.tagName}:${e.type || ''}:${e.getAttribute('formcontrolname') || e.id || e.name || ''}:${e.readOnly ? 'ro' : ''}${e.disabled ? 'dis' : ''}:${(e.value || '').slice(0, 30)}${e.tagName === 'SELECT' ? ' [' + [...e.options].map((o) => o.text.trim()).slice(0, 8).join('/') + ']' : ''}${e.maxLength > 0 && e.maxLength < 1000 ? ' max' + e.maxLength : ''}`)
    .filter((x) => !/urlName/.test(x))));
  L('BUTTONS', (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t.length < 40));
  L('SUBMIT enabled', await d.submit.isEnabled());

  // Submit with nothing chosen
  if (await d.submit.isEnabled()) { await d.submit.click(); await page.waitForTimeout(2000); L('SUBMIT empty →', await toasts(), (await body()).match(/(required|please[^.]{0,60}|select[^.]{0,40})/gi)?.slice(0, 8)); await closeToasts(); }

  for (const mode of ['CASH', 'BANK']) {
    const m = await d.selectPaymentMode(mode).catch((e) => `ERR ${e.message.split('\n')[0]}`);
    await page.waitForTimeout(1200);
    L('MODE', mode, m, '| visible fields', await page.evaluate(() => [...document.querySelectorAll('input,select')].filter((e) => e.offsetParent).map((e) => e.getAttribute('formcontrolname')).filter(Boolean)));
  }
  for (const via of ['Cheque', 'Debit Card', 'Online']) {
    await page.locator('label, span').filter({ hasText: new RegExp(`^\\s*${via}\\s*$`, 'i') }).locator('visible=true').first().click().catch(() => {});
    await page.waitForTimeout(1200);
    L('VIA', via, await page.evaluate(() => [...document.querySelectorAll('select')].filter((e) => e.offsetParent).map((s) => `${s.getAttribute('formcontrolname')}: ${[...s.options].map((o) => o.text.trim()).slice(0, 10).join(' / ')}`)));
  }
  const avail = (await d.header()).available;
  for (const v of ['0', 'abc', '-100', String(Number(String(avail).replace(/,/g, '')) + 1000), '100.555', '']) {
    await d.payout.click({ clickCount: 3 }); await d.payout.press('Control+A'); await d.payout.press('Backspace');
    if (v) await d.payout.pressSequentially(v, { delay: 20 });
    await d.payout.press('Tab'); await page.waitForTimeout(800);
    L('PAYOUT', JSON.stringify(v), '→', await d.payout.inputValue(), '|', await toasts(), '|', (await body()).match(/(should[^.]{0,80}|cannot[^.]{0,80}|greater[^.]{0,80}|exceed[^.]{0,80})/i)?.[0] || '');
    await closeToasts();
  }
  L('DATES', { disburse: await d.disburseDate.inputValue(), ro: await d.disburseDate.evaluate((e) => e.readOnly), inst: await d.installmentStart.inputValue().catch(() => '?') });
  // full valid submit (blocked) to capture payload
  await d.payout.click({ clickCount: 3 }); await d.payout.press('Control+A'); await d.payout.press('Backspace');
  await d.payout.pressSequentially(String(avail).replace(/,/g, ''), { delay: 20 }); await d.payout.press('Tab');
  await d.selectPaymentMode('BANK').catch(() => {});
  L('BANK', await d.fillBankDetails({ via: 'Online', paymentType: 'NEFT', reference: 'AUTOTESTDISC1' }).catch((e) => 'ERR ' + e.message.split('\n')[0]));
  await closeToasts();
  await d.submit.click().catch(() => {});
  await page.waitForTimeout(2500);
  const c = page.locator('.swal2-popup:visible, .modal.show:visible').first();
  if (await c.isVisible().catch(() => false)) { L('CONFIRM DIALOG', clip(await c.innerText(), 300)); await page.locator('.swal2-confirm:visible, .modal.show button:has-text("Yes")').first().click().catch(() => {}); await page.waitForTimeout(2500); }
  L('SUBMIT (blocked) →', await toasts());
  await page.screenshot({ path: `${OUT}/${role}-03-submit.png`, fullPage: true });
  L('API'); api.forEach((a) => L(' ', a));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
