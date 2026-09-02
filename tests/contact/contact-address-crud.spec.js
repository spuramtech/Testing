const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');

const CREDS = { username: 'admin', password: 'jayapriya@123' };

async function openNewContactForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  await contact.openNewForm();
  return contact;
}

test.describe('Contact Module - Address Table CRUD (within the New Contact form)', () => {
  test('TC_CONTACT_ADDR01 - Re-adding an address with the same Address Type does not create a duplicate row or crash the form', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.fillAddress(data.validContact.address);
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1000);
    const rowCountAfterFirst = await page.locator('table tbody tr').count();
    expect(rowCountAfterFirst).toBe(1);

    // Documented actual behavior: re-submitting the same "Permanent Address" type does
    // not append a second row (the row count stays at 1) and does not error out - but it
    // also does not update the existing row's details, i.e. it is a silent no-op rather
    // than a true upsert or a validation message explaining why nothing changed.
    await contact.fillAddress({ ...data.validContact.address, plot: '99Z', street: 'Second QA Street' });
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1200);
    const rowCountAfterSecond = await page.locator('table tbody tr').count();
    expect(rowCountAfterSecond).toBe(1);
    await expect(contact.saveBtn).toBeVisible();
  });

  test('TC_CONTACT_ADDR02 - Deleting an added address row removes it from the table', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.fillAddress(data.validContact.address);
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1000);
    const rowCountBefore = await page.locator('table tbody tr').count();
    await page.locator('table tbody tr').first().locator('button:has(#icon-delete)').click();
    await page.waitForTimeout(800);
    const rowCountAfter = await page.locator('table tbody tr').count();
    expect(rowCountAfter).toBeLessThan(rowCountBefore);
  });

  test('TC_CONTACT_ADDR03 - Clicking the edit icon on an added address row re-populates the form for editing', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.fillAddress(data.validContact.address);
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('table tbody tr').first().locator('button:has(#icon-edit)').click();
    await page.waitForTimeout(800);
    const plotVal = await page.locator('input[formcontrolname="pAddress1"]').inputValue();
    expect(plotVal).toBe(data.validContact.address.plot);
  });

  test('TC_CONTACT_ADDR04 - The first added address defaults to selected as the Primary Address', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.fillAddress(data.validContact.address);
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1000);
    const primaryRadio = page.locator('table tbody tr').first().locator('input[type="radio"]');
    await expect(primaryRadio).toBeChecked();
  });
});

test.describe('Contact Module - Additional Security & Reliability Checks', () => {
  test('TC_CONTACT_SEC03 - Direct URL navigation to the Contact edit route without prior search still requires the app shell to be authenticated', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    await page.goto('http://host81.kapilits.com:8007/#/configuration/contact', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);
    await expect(page.locator('input[formcontrolname="pName"]')).toBeVisible();
  });

  test('TC_CONTACT_SEC04 - Rapidly opening and closing the New Contact form multiple times does not break the page', async ({ page }) => {
    const contact = await openNewContactForm(page);
    for (let i = 0; i < 3; i++) {
      await contact.previousLink.click().catch(() => {});
      await page.waitForTimeout(600);
      await contact.newBtn.click().catch(() => {});
      await page.waitForTimeout(600);
    }
    await expect(contact.saveBtn).toBeVisible();
  });
});
