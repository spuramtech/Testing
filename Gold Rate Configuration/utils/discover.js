// Discovery helper: logs in and dumps the structure of screens for building selectors.
// Usage: node utils/discover.js [ROLE] [menu text regex...]
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('@playwright/test');
const fs = require('fs');

const role = process.argv[2] || 'CHECKER_BH';
const clicks = process.argv.slice(3);
const BASE = process.env.BASE_URL || 'https://qc.finsta.co.in/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  fs.mkdirSync('discovery', { recursive: true });
  const dump = async (name) => {
    await page.screenshot({ path: `discovery/${name}.png`, fullPage: true });
    const info = await page.evaluate(() => {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const pick = (sel) => [...document.querySelectorAll(sel)].filter(vis).map((e) => {
        const o = { tag: e.tagName.toLowerCase() };
        for (const a of ['type', 'id', 'name', 'formcontrolname', 'placeholder', 'aria-label', 'href', 'routerlink', 'maxlength', 'readonly', 'disabled', 'required']) {
          const v = e.getAttribute(a); if (v !== null && v !== '') o[a] = v;
        }
        const t = (e.innerText || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 70); if (t) o.text = t;
        o.cls = (e.className || '').toString().slice(0, 60);
        return o;
      });
      return {
        url: location.href, title: document.title,
        inputs: pick('input,select,textarea,mat-select,p-dropdown,p-calendar,ng-select,kendo-dropdownlist'),
        buttons: pick('button'),
        labels: pick('label,th,h1,h2,h3,h4,h5,h6,.title'),
        links: pick('a,[routerlink],li'),
      };
    });
    fs.writeFileSync(`discovery/${name}.json`, JSON.stringify(info, null, 2));
  };
  const settle = async (ms = 4000) => { await page.waitForLoadState('load'); await page.waitForTimeout(ms); };

  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
  await settle();
  await dump('01-login');
  await page.locator('input:not([type=password]):not([type=hidden]):not([type=checkbox])').first().fill(process.env[`${role}_USER`] || '');
  await page.locator('input[type=password]').first().fill(process.env[`${role}_PASSWORD`] || '');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await settle(8000);
  await dump('02-after-login');

  let i = 3;
  for (const c of clicks) {
    const el = page.getByText(new RegExp(c, 'i')).first();
    if (!(await el.count())) { console.log('Not found:', c); break; }
    await el.click().catch((e) => console.log('click failed', c, e.message));
    await settle(3000);
    await dump(`${String(i++).padStart(2, '0')}-${c.replace(/\W+/g, '_')}`);
  }
  console.log('Done. URL:', page.url());
  await browser.close();
})();
