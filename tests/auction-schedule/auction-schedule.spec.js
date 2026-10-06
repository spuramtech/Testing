const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { AuctionSchedulePage } = require('../../pages/AuctionSchedulePage');
const { loginAndSelectBranch } = require('../../utils/navigation');

const GRID_COLUMN_LABELS = [
  'Register', 'Branch', 'Group Code', 'Chit Value', 'Auction No.', 'Auction Date',
  'Prev. Auction Date', 'Next Auction Date', 'Time', 'Hall', 'CC No', 'Conducted By',
  'Foreman', 'Comm.Per', 'Prev.Bid Amt', 'Prev.Bid', 'Payable Amt',
];

async function openPage(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new AuctionSchedulePage(page);
  await form.open();
  return form;
}

test.describe('Auction Schedule - Field Coverage (all fields, no skips)', () => {
  test('TC_AS_ALL01 - Every search field and grid column on Auction Schedule is present', async ({ page }) => {
    await openPage(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText, 'missing field: From Date').toContain('From Date');
    expect(bodyText, 'missing field: To Date').toContain('To Date');
    expect(bodyText, 'missing field: Group Code search').toContain('Group Code');
    for (const label of GRID_COLUMN_LABELS) {
      expect(bodyText, `missing grid column: ${label}`).toContain(label);
    }
  });

  test('TC_AS_ALL02 - The schedule grid loads real auction data on page load', async ({ page }) => {
    await openPage(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(/\d{2}-[A-Za-z]{3}-\d{4}/.test(bodyText), 'at least one auction date should be rendered').toBe(true);
  });
});

test.describe('Auction Schedule - Search / Filter', () => {
  test('TC_AS_SEARCH01 - Searching by an existing Group Code filters the grid to only that group', async ({ page }) => {
    const form = await openPage(page);
    await form.searchByText('JFH1810');
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('JFH1810');
    expect(bodyText).not.toContain('JME2754');
  });

  test('TC_AS_SEARCH02 - Searching for a non-existent Group Code shows no matching rows', async ({ page }) => {
    const form = await openPage(page);
    await form.searchByText('ZZZZ_NONEXISTENT_999');
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(/no data to display/i.test(bodyText)).toBe(true);
  });

  test('TC_AS_SEARCH03 - Clearing the search text restores the full unfiltered grid', async ({ page }) => {
    const form = await openPage(page);
    await form.searchByText('JFH1810');
    await form.searchByText('');
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('JME2754');
  });
});

test.describe('Auction Schedule - Special Character / XSS Safety', () => {
  test('TC_AS_XSS01 - XSS payload in the search box is not executed', async ({ page }) => {
    const form = await openPage(page);
    let dialogFired = false;
    page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
    await form.searchByText('<script>alert(1)</script>');
    await page.waitForTimeout(500);
    expect(dialogFired).toBe(false);
  });
});
