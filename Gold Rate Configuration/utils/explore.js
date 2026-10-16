// Explorer: logs in as ROLE, then runs each step (a JS expression using `page`), dumping the screen after each.
// Usage: node utils/explore.js ROLE "step1" "step2" ...
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { chromium } = require('@playwright/test');
const fs = require('fs');

const [role = 'CHECKER_BH', ...steps] = process.argv.slice(2);
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
        for (const a of ['type', 'id', 'name', 'formcontrolname', 'placeholder', 'aria-label', 'maxlength', 'readonly', 'disabled', 'required', 'bindlabel']) {
          const v = e.getAttribute(a); if (v !== null && v !== '') o[a] = v;
        }
        const lab = e.closest('div')?.querySelector('label');
        if (lab) o.label = lab.innerText.trim().slice(0, 40);
        const t = (e.innerText || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 70); if (t) o.text = t;
        return o;
      });
      return {
        url: location.href,
        inputs: pick('input,select,textarea,ng-select,p-dropdown,p-calendar,kendo-dropdownlist,kendo-datepicker'),
        buttons: pick('button'),
        labels: [...new Set([...document.querySelectorAll('label,th,h1,h2,h3,h4,h5,h6')].filter(vis).map((e) => e.innerText.trim()).filter(Boolean))],
      };
    });
    fs.writeFileSync(`discovery/${name}.json`, JSON.stringify(info, null, 2));
  };
  const settle = async (ms) => { await page.waitForLoadState('load'); await page.waitForTimeout(ms); };

  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
  await settle(3000);
  await page.locator('input:not([type=password]):not([type=hidden]):not([type=checkbox])').first().fill(process.env[`${role}_USER`] || '');
  await page.locator('input[type=password]').first().fill(process.env[`${role}_PASSWORD`] || '');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await settle(6000);

  let i = 1;
  for (const s of steps) {
    try { await eval(`(async () => { ${s} })()`); } catch (e) { console.log(`Step ${i} failed:`, e.message.split('\n')[0]); await dump(`s${i}-error`); break; }
    await settle(2500);
    await dump(`s${i++}`);
  }
  console.log('Done. URL:', page.url());
  await browser.close();
})();
