const { chromium } = require('playwright');
const { loginAndSelectBranch } = require('./utils/navigation');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await loginAndSelectBranch(page, 'http://host81.kapilits.com:8007/#/', { username: 'admin', password: 'jayapriya@123' });
  await page.waitForTimeout(1500);

  await page.goto('http://host81.kapilits.com:8007/#/configuration/chitformation', { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  await page.locator('button:visible', { hasText: 'Save' }).first().click();
  await page.waitForTimeout(1200);
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- Body text after empty Save ---');
  console.log(bodyText.split('\n').filter(l => /required|invalid|mandatory|please/i.test(l)).join('\n'));
  console.log('--- full length ---', bodyText.length);

  await browser.close();
})();
