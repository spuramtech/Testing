const { chromium } = require('playwright');
const { loginAndSelectBranch } = require('./utils/navigation');
const { ContactPage } = require('./pages/ContactPage');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const { CREDS } = require('./utils/config');
  await loginAndSelectBranch(page, 'http://host81.kapilits.com:8007/#/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  await page.waitForTimeout(1000);

  // Click the arrow/detail-view icon on the first contact row (not Edit)
  const arrowIcon = page.locator('a[href="javascript:void(0)"], .fa-arrow-right, [class*="arrow"]').first();
  const count = await page.locator('svg, i, a').filter({ hasText: '' }).count();
  console.log('generic count:', count);

  // Try clicking directly near a card - use the right-arrow SVG/icon commonly seen
  const cardArrow = page.locator('.card, .contact-card').first().locator('a, svg, i').last();
  await page.screenshot({ path: 'probe_before_detail_click.png', fullPage: true });

  await browser.close();
})();
