const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { ChitPaymentPage } = require('../../pages/ChitPaymentPage');
const { loginAndSelectBranch } = require('../../utils/navigation');

const ALL_FIELD_LABELS = [
  'Subscriber', 'From Date', 'To Date', 'Total Outstanding', 'Action', 'Chit No.',
  'Subscriber Name', 'Chit Value', 'Future Liability', 'Auction Date', 'Bid Payable',
  'G.S.T Amount', 'Net Payable', 'Paid/Adjusted Amount', 'Bid Paid Outstanding',
  'Chit Period Completion %',
];

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new ChitPaymentPage(page);
  await form.open();
  return form;
}

test.describe('Chit Payment - Field Coverage (all fields, no skips)', () => {
  test('TC_CP_ALL01 - Every search field and grid column on Chit Payment is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of ALL_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });
});

test.describe('Chit Payment - Subscriber Search', () => {
  test('TC_CP_SUB01 - Selecting a subscriber and clicking Show triggers a real API call', async ({ page }) => {
    const form = await openForm(page);
    const apiCalls = [];
    page.on('response', res => { if (/PsInformation|ChitPayment/i.test(res.url())) apiCalls.push({ url: res.url(), status: res.status() }); });
    const selected = await form.selectFirstSubscriber();
    expect(selected, 'At least one subscriber should be selectable').toBe(true);
    await form.showBtn().click();
    await page.waitForTimeout(1500);
    console.log('TC_CP_SUB01: API calls =', JSON.stringify(apiCalls));
    expect(apiCalls.length, 'Clicking Show after selecting a subscriber should trigger a real API call').toBeGreaterThan(0);
    expect(apiCalls.every(c => c.status < 400), 'The outstanding-payments query should not error').toBe(true);
  });

  test('TC_CP_SUB02 - Clicking Show with no subscriber selected does not crash and shows "No data to display"', async ({ page }) => {
    const form = await openForm(page);
    await form.showBtn().click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(/no data to display/i.test(bodyText)).toBe(true);
  });
});

test.describe('Chit Payment - Special Character / XSS Safety', () => {
  test('TC_CP_XSS01 - XSS payload in the subscriber search box is not executed', async ({ page }) => {
    const form = await openForm(page);
    let dialogFired = false;
    page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
    await page.locator('ng-select[formcontrolname="contactid"]').click();
    await page.waitForTimeout(500);
    const searchInput = page.locator('ng-select[formcontrolname="contactid"] input').first();
    await searchInput.fill('<script>alert(1)</script>').catch(() => {});
    await page.waitForTimeout(500);
    expect(dialogFired).toBe(false);
  });
});
