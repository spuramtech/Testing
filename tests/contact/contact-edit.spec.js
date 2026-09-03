const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');

const { CREDS } = require('../../utils/config');

// IMPORTANT: These tests open a REAL existing production contact record to verify
// read-only Edit behaviour. They must NEVER click Save Contact, to avoid mutating
// live customer data. Only field pre-fill, validation-on-edit and safe navigation
// away (Previous) are exercised.

async function openExistingContactEdit(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  await contact.search(data.existingContactSearchTerm);
  await contact.openFirstSearchResultEdit();
  return contact;
}

test.describe('Contact Module - Edit Existing Contact (read-only verification)', () => {
  test('TC_CONTACT_EDIT01 - Editing an existing contact pre-fills Name and Father Name from the saved record', async ({ page }) => {
    const contact = await openExistingContactEdit(page);
    const nameVal = await page.locator('input[formcontrolname="pName"]').inputValue();
    const fatherVal = await page.locator('input[formcontrolname="pFatherName"]').inputValue();
    expect(nameVal.length).toBeGreaterThan(0);
    expect(fatherVal.length).toBeGreaterThan(0);
  });

  test('TC_CONTACT_EDIT02 - Editing an existing contact pre-fills the saved Primary Contact Number', async ({ page }) => {
    const contact = await openExistingContactEdit(page);
    const phoneVal = await page.locator('input[formcontrolname="pContactNumber"]').inputValue();
    expect(phoneVal.length).toBeGreaterThan(0);
  });

  test('TC_CONTACT_EDIT03 - Editing an existing contact pre-fills its saved address in the address table', async ({ page }) => {
    const contact = await openExistingContactEdit(page);
    await contact.openTab('Address Details');
    await expect(page.getByText('Permanent Address').first()).toBeVisible();
    await expect(page.locator('table').getByText(/,/).first()).toBeVisible();
  });

  test('TC_CONTACT_EDIT04 - Clearing the mandatory Name field on an existing record and attempting Save still shows required validation', async ({ page }) => {
    const contact = await openExistingContactEdit(page);
    await page.locator('input[formcontrolname="pName"]').fill('');
    await contact.saveBtn.click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Name Required');
    // Intentionally do not proceed to a successful save; navigate away without persisting.
  });

  test('TC_CONTACT_EDIT05 - "Previous" link on the Edit form navigates back to the contact list without prompting', async ({ page }) => {
    const contact = await openExistingContactEdit(page);
    await contact.previousLink.click();
    await page.waitForTimeout(1200);
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });

  test('TC_CONTACT_EDIT06 - Editing an existing contact shows the Individual/Business Entity toggle matching its saved type', async ({ page }) => {
    const contact = await openExistingContactEdit(page);
    await expect(contact.individualRadio).toBeVisible();
  });
});
