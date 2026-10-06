const { chromium } = require('playwright');
const { loginAndSelectBranch } = require('./utils/navigation');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const { CREDS } = require('./utils/config');
  await loginAndSelectBranch(page, 'http://host81.kapilits.com:8007/#/', CREDS);
  await page.goto('http://host81.kapilits.com:8007/#/configuration/ContactMore?ID=327299&name=Employee&TYPE=Individual', { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  for (const subtab of ['General Information', 'Family Details', 'Education', 'Previous Experience Details']) {
    await page.locator('a[data-toggle="tab"]', { hasText: subtab }).first().click();
    await page.waitForTimeout(1000);
    const activePane = await page.evaluate(() => {
      const panes = [...document.querySelectorAll('.tab-pane.active, .tab-pane.show.active')];
      if (!panes.length) return 'NO ACTIVE PANE FOUND';
      return panes.map(p => {
        const labels = [...p.querySelectorAll('label')].map(l => l.textContent.trim()).filter(Boolean);
        const inputs = [...p.querySelectorAll('input,select,ng-select')].map(i => i.getAttribute('formcontrolname') || i.tagName);
        return { labels, inputs };
      });
    });
    console.log('===', subtab, '===');
    console.log(JSON.stringify(activePane, null, 2));
  }

  await browser.close();
})();
