const { chromium } = require('playwright');
const { loginAndSelectBranch, dismissGlobalPopups } = require('./utils/navigation');
const { CREDS } = require('./utils/config');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await loginAndSelectBranch(page, 'http://host81.kapilits.com:8007/#/', CREDS);
  await page.goto('http://host81.kapilits.com:8007/#/Transactions/ChitPayment', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await dismissGlobalPopups(page);
  await page.waitForTimeout(800);

  const fromInput = page.locator('input[formcontrolname="fromdate"]:visible').first();
  await fromInput.click();
  await page.waitForTimeout(800);

  // navigate back a month via the datepicker's previous button, then click a day
  const prevBtn = page.locator('.bs-datepicker-head button, .bs-datepicker-head .previous, [class*="previous"]').first();
  await prevBtn.click().catch(e => console.log('prev click err', e.message));
  await page.waitForTimeout(500);
  const day = page.locator('.bs-datepicker-body .cell:not(.is-other-month)').first();
  await day.click().catch(e => console.log('day click err', e.message));
  await page.waitForTimeout(800);

  const val = await page.evaluate(() => document.querySelector('input[formcontrolname="fromdate"]').value);
  console.log('fromdate value after calendar pick:', val);

  await browser.close();
})();
