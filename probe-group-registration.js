const { chromium } = require('playwright');
const { loginAndSelectBranch } = require('./utils/navigation');
const { CREDS } = require('./utils/config');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await loginAndSelectBranch(page, 'http://host81.kapilits.com:8007/#/', CREDS);
  await page.waitForTimeout(1500);

  await page.goto('http://host81.kapilits.com:8007/#/configuration/chitregistration', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  console.log('URL:', page.url());

  const info = await page.evaluate(() => {
    const isVisible = el => el.offsetParent !== null;
    const labels = [...document.querySelectorAll('label')].filter(isVisible).map(l => l.textContent.trim()).filter(Boolean);
    const inputs = [...document.querySelectorAll('input,select,ng-select')].filter(isVisible).map(i => ({ tag: i.tagName, fcn: i.getAttribute('formcontrolname') }));
    const buttons = [...document.querySelectorAll('button')].filter(isVisible).map(b => b.textContent.trim()).filter(Boolean);
    const tabs = [...document.querySelectorAll('a[data-toggle="tab"]')].filter(isVisible).map(t => t.textContent.trim());
    const hasTable = !!document.querySelector('table');
    return { labels, inputs, buttons, tabs, hasTable };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
