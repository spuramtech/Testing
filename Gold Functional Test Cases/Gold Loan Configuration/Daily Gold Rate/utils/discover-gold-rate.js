// Discovery: logs in, opens Daily Gold Rate, dumps list + New form structure and API calls to evidence/discovery/.
// Usage: node utils/discover-gold-rate.js [ROLE]
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const role = process.argv[2] || 'INT_APPRAISER1';
const OUT = path.resolve(__dirname, '../evidence/discovery');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: process.env.BASE_URL });
  const api = [];
  page.on('response', async (r) => {
    const u = r.url();
    if (!/api/i.test(u) || /\.(js|css|png|svg|woff)/.test(u)) return;
    let body = '';
    try { body = (await r.text()).slice(0, 600); } catch {}
    api.push({ method: r.request().method(), url: u, status: r.status(), post: (r.request().postData() || '').replace(/"pPassword":"[^"]*"/g, '"pPassword":"***"').slice(0, 600), body });
  });
  const dump = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    const info = await page.evaluate(() => {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const pick = (sel) => [...document.querySelectorAll(sel)].filter(vis).map((e) => {
        const o = { tag: e.tagName.toLowerCase() };
        for (const a of ['type', 'id', 'name', 'formcontrolname', 'placeholder', 'maxlength', 'readonly', 'disabled', 'required', 'title', 'class']) {
          const v = e.getAttribute(a); if (v !== null && v !== '') o[a] = String(v).slice(0, 80);
        }
        if ('value' in e && e.value) o.value = e.value;
        const t = (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100); if (t) o.text = t;
        return o;
      });
      return { url: location.href, inputs: pick('input,select,textarea,ng-select'), buttons: pick('button,a.btn,a[class*=btn]'), labels: [...document.querySelectorAll('label,th,h4,h5,h6,.invalid-feedback,.text-danger,small')].filter(vis).map((e) => e.innerText.trim()).filter(Boolean), body: document.body.innerText.slice(0, 4000) };
    });
    fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(info, null, 2));
  };

  const { LoginPage } = require('../../../common/pages/LoginPage');
  const { GoldRatePage } = require('../pages/GoldRatePage');
  await new LoginPage(page).login(role);
  const g = new GoldRatePage(page);
  await g.open();
  await page.waitForTimeout(3000);
  await dump(`${role}-01-list`);
  await g.openNew();
  await page.waitForTimeout(1500);
  await dump(`${role}-02-new`);
  // Save empty to see validations
  await g.save.click();
  await page.waitForTimeout(2000);
  await dump(`${role}-03-save-empty`);
  // Open date picker
  await g.transDate.click();
  await page.waitForTimeout(800);
  await dump(`${role}-04-datepicker`);
  await page.keyboard.press('Escape');
  fs.writeFileSync(`${OUT}/${role}-api.json`, JSON.stringify(api, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
