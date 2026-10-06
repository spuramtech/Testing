const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { AuctionPage } = require('../../pages/AuctionPage');
const { loginAndSelectBranch } = require('../../utils/navigation');

const ALL_FIELD_LABELS = [
  'Auction Date', 'Show Due Tickets Also', 'Auction Groups', 'Select Ticket Number',
  'Bid Amount', "Foreman's Commission", 'Bid Offers', 'Auction Details', 'Chit Value',
  'Max Discount', 'Discount', 'Total Members', 'Bid Payable', 'Installment', 'Dividend',
  'Auction No.', 'Date', 'Time', 'Next Auction Date',
];

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new AuctionPage(page);
  await form.open();
  return form;
}

test.describe('Auction - Field Coverage (all fields, no skips)', () => {
  test('TC_AU_ALL01 - Every field on the Auction (conduct auction) form is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of ALL_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });

  test('TC_AU_ALL02 - Auction Groups list is populated with due chit groups', async ({ page }) => {
    await openForm(page);
    const count = await page.locator('.form-group label.font-weight-bold').count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Auction - Mandatory Field Validation', () => {
  test('TC_AU_MF01 - Submitting with no group/ticket selected shows "Ticket Number Required"', async ({ page }) => {
    const form = await openForm(page);
    await form.saveBtn().click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Ticket Number Required');
  });

  test('TC_AU_MF02 - Submitting with no Bid Amount shows "Bid Amount Required"', async ({ page }) => {
    const form = await openForm(page);
    await form.saveBtn().click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Bid Amount Required');
  });
});

test.describe('Auction - Group Selection Defect Investigation', () => {
  test('TC_AU_BUG01 - Selecting a group from the Auction Groups list visually highlights it but never loads its tickets (zero API calls)', async ({ page }) => {
    const form = await openForm(page);
    const apiCalls = [];
    page.on('response', res => { if (/auction|ticket|group/i.test(res.url())) apiCalls.push({ url: res.url(), status: res.status() }); });

    const label = form.groupLabel('JMJ2717');
    await label.click();
    await page.waitForTimeout(1500);
    const classAfterClick = await label.getAttribute('class');

    await form.ticketSelect().click();
    await page.waitForTimeout(800);
    const ticketOptions = await page.locator('.ng-dropdown-panel .ng-option').allTextContents();

    console.log('TC_AU_BUG01: class after click =', classAfterClick, '| API calls fired =', JSON.stringify(apiCalls), '| ticket options =', JSON.stringify(ticketOptions));
    expect(classAfterClick, 'clicking the group should visually select it').toContain('bg-primary');
    expect(apiCalls.length, 'BUG-012: selecting a group should trigger an API call to fetch its tickets - selection is currently visual-only with zero backend effect').toBeGreaterThan(0);
  });
});
