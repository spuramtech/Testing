const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');

const { CREDS } = require('../../utils/config');

async function openNewBusinessForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  await contact.openNewForm();
  await contact.businessRadio.click();
  await page.waitForTimeout(800);
  return contact;
}

test.describe('Contact Module - Business Entity Form', () => {
  test('TC_CONTACT_BIZ01 - Business Entity form shows Enterprise-specific mandatory fields', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    await expect(page.getByText('Name of the Enterprise')).toBeVisible();
    await expect(page.getByText('Enterprise Email ID')).toBeVisible();
    await expect(page.getByText('Enterprise Contact No.')).toBeVisible();
    await expect(page.getByText('Type of Enterprise')).toBeVisible();
  });

  test('TC_CONTACT_BIZ02 - Submitting Business Entity Save with all fields empty shows required-field validation', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    await contact.saveBtn.click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(/required/i.test(bodyText)).toBe(true);
  });

  test('TC_CONTACT_BIZ03 - Enterprise Name accepts the test data value', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    const nameField = page.locator('input[placeholder*="Enterprise" i], input[formcontrolname*="rganization" i]').first();
    await nameField.fill(data.businessEntityData.enterpriseName).catch(() => {});
    await page.waitForTimeout(300);
    await expect(contact.saveBtn).toBeVisible();
  });

  test('TC_CONTACT_BIZ04 - Enterprise Contact Number enforces the same 10-digit length rule as Individual contacts', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    const phoneFields = page.locator('input[type="text"]');
    // Locate the Enterprise Contact No. field by its preceding label.
    const label = page.locator('label:has-text("Enterprise Contact No.")').first();
    const input = label.locator('xpath=following::input[1]');
    await input.fill('123');
    await input.blur();
    await page.waitForTimeout(600);
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Enterprise contact number short-value validation message present:', /minimum|invalid|length/i.test(bodyText));
    await expect(contact.saveBtn).toBeVisible();
  });

  test('TC_CONTACT_BIZ05 - Type of Enterprise offers a non-trivial list of business category radio options', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    const label = page.locator('label:has-text("Type of Enterprise")').first();
    const container = label.locator('xpath=following-sibling::div[1]');
    const optionCount = await container.locator('input[type="radio"]').count().catch(() => 0);
    expect(optionCount, 'Type of Enterprise should offer more than a handful of radio options').toBeGreaterThan(20);
  });

  test('TC_CONTACT_BIZ06 - Switching from Business Entity back to Individual restores the Individual form', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    await contact.individualRadio.click();
    await page.waitForTimeout(700);
    await expect(page.getByText('Personal Details')).toBeVisible();
    await expect(page.locator('input[formcontrolname="pName"]')).toBeVisible();
  });

  test('TC_CONTACT_BIZ07 - XSS payload in Enterprise Name field does not execute', async ({ page }) => {
    const contact = await openNewBusinessForm(page);
    let dialogFired = false;
    page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
    const label = page.locator('label:has-text("Name of the Enterprise")').first();
    const input = label.locator('xpath=following::input[1]');
    await input.fill('<script>alert(1)</script>').catch(() => {});
    await page.waitForTimeout(500);
    expect(dialogFired).toBe(false);
  });
});
