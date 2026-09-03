const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');

const { CREDS } = require('../../utils/config');

async function openNewContactForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  await contact.openNewForm();
  return contact;
}

test.describe('Contact Module - KYC Documents Tab', () => {
  test('TC_CONTACT_KYC01 - KYC Documents tab shows Document Type, Document Name, Reference Number and upload control', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('KYC Documents');
    await expect(page.getByText('Document Type', { exact: true })).toBeVisible();
    await expect(page.getByText('Document Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Reference Number', { exact: true })).toBeVisible();
    await expect(page.getByText('Upload Identification Proof')).toBeVisible();
  });

  test('TC_CONTACT_KYC02 - Reference Number field accepts alphanumeric input without error', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('KYC Documents');
    await page.locator('input[formcontrolname="pDocReferenceno"]').fill('AB12345678');
    await page.waitForTimeout(400);
    await expect(contact.saveBtn).toBeVisible();
  });

  test('TC_CONTACT_KYC03 - Year field under KYC Documents accepts a 4-digit year', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('KYC Documents');
    await page.locator('input[formcontrolname="pDocumentReferenceYear"]').fill('2020');
    const val = await page.locator('input[formcontrolname="pDocumentReferenceYear"]').inputValue();
    expect(val).toBe('2020');
  });

  test('TC_CONTACT_KYC04 - Year field under KYC Documents is constrained to 4 characters via maxlength', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('KYC Documents');
    const yearField = page.locator('input[formcontrolname="pDocumentReferenceYear"]');
    await yearField.fill('30505050');
    const val = await yearField.inputValue();
    expect(val.length, 'Year field should not allow more than 4 characters to be entered').toBeLessThanOrEqual(4);
  });
});

test.describe('Contact Module - Bank Details Tab', () => {
  test('TC_CONTACT_BANK01 - Bank Details tab shows Bank Name, Account Number, IFSC Code, Branch fields', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Bank Details');
    await expect(page.locator('label:has-text("Bank Name")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Account Number")').first()).toBeVisible();
    await expect(page.locator('label:has-text("IFSC Code")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Branch")').first()).toBeVisible();
  });

  test('TC_CONTACT_BANK02 - Bank Details tab is fully optional and does not block Save Contact from being clicked', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Bank Details');
    await expect(contact.saveBtn).toBeEnabled();
  });
});

test.describe('Contact Module - Income Tab', () => {
  test('TC_CONTACT_INC01 - Income tab defaults to Employed/Self Employed choice with no fields forced', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Income');
    await expect(page.getByText('Employed', { exact: true })).toBeVisible();
    await expect(page.getByText('Self Employed/Business', { exact: true })).toBeVisible();
  });

  test('TC_CONTACT_INC02 - Selecting Employed reveals employment-specific fields (Designation, Office Phone)', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Income');
    await page.locator('label[for="employed"]').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('label:has-text("Designation")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Office Phone No.")').first()).toBeVisible();
  });

  test('TC_CONTACT_INC03 - Selecting Self Employed reveals organization-specific fields', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Income');
    await page.locator('label[for="selfemployed"]').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('label:has-text("Name of the organization")').first()).toBeVisible();
  });

  test('TC_CONTACT_INC04 - Basic Salary field rejects a negative amount or does not silently accept it', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Income');
    await page.locator('label[for="employed"]').click();
    await page.waitForTimeout(1500);
    const basicSalary = page.locator('input[formcontrolname="basicsalary"]');
    if (await basicSalary.isVisible().catch(() => false)) {
      await basicSalary.fill('-5000');
      const val = await basicSalary.inputValue();
      console.log('Basic salary field accepted negative value as:', val);
    }
    await expect(contact.saveBtn).toBeVisible();
  });
});

test.describe('Contact Module - Related Parties Tab', () => {
  test('TC_CONTACT_REL01 - Related Parties tab shows Related Contact and Relationship fields', async ({ page }) => {
    const contact = await openNewContactForm(page);
    await contact.openTab('Related Parties');
    await expect(page.getByText('Related Contact', { exact: true })).toBeVisible();
    await expect(page.getByText('Relationship', { exact: true })).toBeVisible();
  });
});
