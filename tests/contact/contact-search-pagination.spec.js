const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');

const { CREDS } = require('../../utils/config');

async function openContactList(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  return contact;
}

test.describe('Contact Module - Search Matrix', () => {
  test('TC_CONTACT_SRCH01 - Partial name search returns matching results', async ({ page }) => {
    const contact = await openContactList(page);
    await contact.search('SANTHO');
    await expect(page.getByText('SANTHO', { exact: false }).first()).toBeVisible();
  });

  test('TC_CONTACT_SRCH02 - Lowercase search term matches records stored in uppercase (case-insensitive)', async ({ page }) => {
    const contact = await openContactList(page);
    await contact.search('santhoshi');
    await expect(page.getByText(/santhoshi/i).first()).toBeVisible();
  });

  test('TC_CONTACT_SRCH03 - Search by phone number returns the matching contact', async ({ page }) => {
    const contact = await openContactList(page);
    await contact.search('8179305275');
    await expect(page.getByText('8179305275').first()).toBeVisible();
  });

  test('TC_CONTACT_SRCH04 - Very long search string does not crash the page', async ({ page }) => {
    const contact = await openContactList(page);
    await contact.search('A'.repeat(200));
    await expect(page.locator('#pSearchText')).toBeVisible();
  });

  test('TC_CONTACT_SRCH05 - Special-character search term is handled without an application error', async ({ page }) => {
    const contact = await openContactList(page);
    await contact.search("!@#$%^&*()");
    await expect(page.locator('#pSearchText')).toBeVisible();
  });

  test('TC_CONTACT_SRCH06 - Clearing the search box after a search restores the unfiltered list', async ({ page }) => {
    const contact = await openContactList(page);
    await contact.search('ZZZZNOTEXIST9999');
    await expect(page.getByText('No Records Found')).toBeVisible();
    await contact.search('');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });
});

test.describe('Contact Module - Pagination Matrix', () => {
  test('TC_CONTACT_PAGE01 - Next button advances to the next page of results', async ({ page }) => {
    const contact = await openContactList(page);
    const before = await page.getByText(/Page \d+ of \d+/).textContent();
    await page.getByText('Next', { exact: true }).click();
    await page.waitForTimeout(1200);
    const after = await page.getByText(/Page \d+ of \d+/).textContent();
    expect(after).not.toBe(before);
  });

  test('TC_CONTACT_PAGE02 - Prev button returns to the previous page after Next', async ({ page }) => {
    const contact = await openContactList(page);
    const first = await page.getByText(/Page \d+ of \d+/).textContent();
    await page.getByText('Next', { exact: true }).click();
    await page.waitForTimeout(1200);
    await page.getByText('prev', { exact: true }).click();
    await page.waitForTimeout(1200);
    const back = await page.getByText(/Page \d+ of \d+/).textContent();
    expect(back).toBe(first);
  });

  test('TC_CONTACT_PAGE03 - Pagination summary reflects a consistent total item count across navigation', async ({ page }) => {
    const contact = await openContactList(page);
    const before = (await page.getByText(/Page \d+ of \d+/).textContent()).match(/\((\d+) items\)/)?.[1];
    await page.getByText('Next', { exact: true }).click();
    await page.waitForTimeout(1200);
    const after = (await page.getByText(/Page \d+ of \d+/).textContent()).match(/\((\d+) items\)/)?.[1];
    expect(after).toBe(before);
  });
});

test.describe('Contact Module - Advanced Search', () => {
  test('TC_CONTACT_ADV01 - Advanced Search link opens an expanded filter panel', async ({ page }) => {
    const contact = await openContactList(page);
    await page.getByText('Advanced Search', { exact: true }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText('+ Add Filter')).toBeVisible();
  });

  test('TC_CONTACT_ADV02 - Advanced Search panel offers a Search Type filter and a Search action', async ({ page }) => {
    const contact = await openContactList(page);
    await page.getByText('Advanced Search', { exact: true }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Search Type')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });
});
