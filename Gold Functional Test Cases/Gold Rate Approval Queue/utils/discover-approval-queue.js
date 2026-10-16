// Discovery (read-only): logs in, opens Gold Rate Approval, dumps structure, cards, buttons and API calls.
// Never clicks Approve / Reject. Usage: node utils/discover-approval-queue.js [ROLE]
require('../../common/config/env');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../../common/pages/LoginPage');
const { go } = require('../../common/utils/nav');

const role = process.argv[2] || 'CHECKER_BH';
const OUT = path.resolve(__dirname, '../evidence/discovery');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const api = [];
  page.on('response', async (r) => {
    if (!/loanmaster|approv|goldrate/i.test(r.url())) return;
    api.push({ method: r.request().method(), url: r.url().replace(/^https?:\/\/[^/]+/, ''), status: r.status(), body: (await r.text().catch(() => '')).slice(0, 1500) });
  });
  page.on('dialog', (d) => { console.log('DIALOG', d.message()); d.dismiss(); });
  await new LoginPage(page).login(role);
  await go(page, 'Gold Loan Configuration', ['Loans', 'Gold']);
  await page.waitForURL(/GoldLoanConfiguration/);
  await page.waitForTimeout(1500);
  const card = page.getByText('Gold Rate Approval', { exact: true }).first().locator('xpath=ancestor::*[contains(@class,"card") or contains(@class,"tile")][1]');
  console.log('CARD', (await card.innerText().catch(() => 'n/a')).replace(/\s+/g, ' ').slice(0, 300));
  await page.screenshot({ path: `${OUT}/${role}-00-config.png`, fullPage: true });
  await page.getByText('Gold Rate Approval', { exact: true }).first().click().catch((e) => console.log('CLICK FAIL', e.message));
  await page.waitForTimeout(3500);
  console.log('URL', page.url());
  await page.screenshot({ path: `${OUT}/${role}-01-queue.png`, fullPage: true });
  const info = await page.evaluate(() => {
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const main = document.querySelector('router-outlet')?.parentElement || document.body;
    return {
      buttons: [...main.querySelectorAll('button,a.btn')].filter(vis).map((b) => ({ text: b.innerText.trim(), title: b.title, disabled: b.disabled, cls: b.className.slice(0, 60) })),
      inputs: [...main.querySelectorAll('input,select,textarea,ng-select')].filter(vis).map((e) => ({ tag: e.tagName, type: e.type, fc: e.getAttribute('formcontrolname'), ph: e.placeholder, value: e.value })),
      text: main.innerText.slice(0, 6000),
    };
  });
  fs.writeFileSync(`${OUT}/${role}-01-queue.json`, JSON.stringify(info, null, 2));
  fs.writeFileSync(`${OUT}/${role}-api.json`, JSON.stringify(api, null, 2));
  console.log('BUTTONS', JSON.stringify(info.buttons.filter((b) => b.text || b.title).slice(-25)));
  console.log('INPUTS', JSON.stringify(info.inputs));
  console.log('TEXT', info.text.replace(/\s+/g, ' ').slice(0, 3500));
  console.log('API', api.map((a) => `${a.method} ${a.status} ${a.url.split('?')[0]}`).join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
