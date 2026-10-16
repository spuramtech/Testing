const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { ContactPage } = require('../pages/ContactPage');
const { uniqueContact } = require('../test-data/contact');

// Functional / validation scenarios for the Contact (Manual) form.
// Negative cases never create a contact; each one must end with the form NOT saved.
test.describe('Contact form - functional scenarios', () => {
  let contact;

  test.beforeEach(async ({ page }) => {
    contact = new ContactPage(page);
    await new LoginPage(page).login('INT_APPRAISER1');
    await contact.openNewManualContact();
  });

  // Click Save & Continue and assert the contact was NOT saved
  async function expectNotSaved(page) {
    await contact.saveAndContinue.click();
    await page.waitForTimeout(1500);
    const msgs = (await contact.messages()).join(' ');
    expect(msgs, 'must not show a success message').not.toMatch(/saved successfully/i);
    await expect(page).toHaveURL(/#\/Contact\/ContactNew/);
  }

  test('TC_CONTACT_F01 - Form loads with the mandatory Contact Info fields', async ({ page }) => {
    for (const f of ['pName', 'pContactNumber', 'pDob']) await expect(contact.field(f)).toBeVisible();
    for (const tab of ['Address Details', 'Documents', 'Bank Details']) {
      await expect(page.getByText(tab, { exact: true }).locator('visible=true').first()).toBeVisible();
    }
  });

  test('TC_CONTACT_F02 - Save with every field empty is rejected', async ({ page }) => {
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F03 - Save without Mobile Number is rejected', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo({ ...d, mobile: '' });
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F04 - Save without First Name is rejected', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo({ ...d, firstName: '' });
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F05 - Mobile Number rejects letters / special characters', async () => {
    const mobile = contact.field('pContactNumber');
    await mobile.pressSequentially('ABCD@#$%');
    expect(await mobile.inputValue()).not.toMatch(/[A-Za-z@#$%]/);
  });

  test('TC_CONTACT_F06 - Mobile Number shorter than 10 digits is rejected', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo({ ...d, mobile: '98765' });
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F07 - Mobile Number longer than 10 digits is rejected', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo({ ...d, mobile: '987654321099' });
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F08 - Invalid Email format is rejected', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo({ ...d, email: 'not-an-email' });
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F09 - Contact with Contact Info only (no Address / KYC / Bank) is not saved as complete', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo(d);
    await expectNotSaved(page);
  });

  test('TC_CONTACT_F10 - Invalid PAN format in Documents is rejected', async ({ page }) => {
    const d = uniqueContact();
    await contact.fillContactInfo(d);
    await contact.fillAddress(d.address);
    await contact.openTab('Documents');
    await contact.selectNg('ng-select#pDocumentGroupId', 'PAN / FORM 60');
    await contact.selectNg('ng-select#pDocumentId', 'PAN CARD');
    await contact.field('pDocReferenceno').fill('12345');
    await page.getByText('Add', { exact: true }).locator('visible=true').first().click();
    await expect(page.getByText('12345').locator('visible=true').first()).toBeHidden();
  });

  test('TC_CONTACT_F11 - Address Pincode accepts digits only (max 6)', async () => {
    await contact.openTab('Address Details');
    const pin = contact.field('pPinCode');
    await pin.pressSequentially('AB12CD34567');
    const v = await pin.inputValue();
    expect(v).not.toMatch(/[A-Za-z]/);
    expect(v.length).toBeLessThanOrEqual(6);
  });

  test('TC_CONTACT_F12 - Duplicate Mobile Number is rejected', async ({ page }) => {
    // Reuses the mobile of the contact created by the last `npm run contact` flow
    let existing;
    try { existing = require('../../test-data/current-flow.json').mobile; } catch { /* no flow yet */ }
    test.skip(!existing, 'Run `npm run contact` first to have an existing contact');
    const d = uniqueContact();
    await contact.fillContactInfo({ ...d, mobile: existing });
    await contact.fillAddress(d.address);
    for (const doc of d.documents) await contact.addDocument(doc);
    await contact.addBank({ ...d.bank, nameAsPerBank: `${d.firstName} ${d.lastName}` });
    await expectNotSaved(page);
  });

  // ---- Positive scenarios (each creates a NEW AUTOTEST contact unless stated) ----
  async function fillAll(d) {
    await contact.fillContactInfo(d);
    await contact.fillAddress(d.address);
    for (const doc of d.documents) await contact.addDocument(doc);
    await contact.addBank({ ...d.bank, nameAsPerBank: `${d.firstName} ${d.lastName || ''}`.trim() });
  }

  async function saveAndVerify(page, d) {
    await contact.saveAndContinue.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    expect((await contact.messages()).join(' ')).toMatch(/saved successfully/i);
    const card = await contact.findInList(d.mobile);
    expect(card).toContain(d.firstName);
    expect(card).toContain(d.documents[0].reference);
  }

  test('TC_CONTACT_P01 - Create a contact with all fields (Male) and find it in the list', async ({ page }) => {
    const d = uniqueContact();
    await fillAll(d);
    await saveAndVerify(page, d);
  });

  test('TC_CONTACT_P02 - Create a contact with mandatory fields only (no Last Name / Father Name / Email)', async ({ page }) => {
    const d = { ...uniqueContact(), lastName: '', fatherFirstName: '', email: '' };
    await fillAll(d);
    await saveAndVerify(page, d);
  });

  test('TC_CONTACT_P03 - Create a Female contact (Ms title)', async ({ page }) => {
    const d = { ...uniqueContact(), title: 'Ms', gender: 'female' };
    await fillAll(d);
    await saveAndVerify(page, d);
  });

  test('TC_CONTACT_P04 - Existing contact can be searched and its details load into the form', async () => {
    let existing;
    try { existing = require('../../test-data/current-flow.json').mobile; } catch { /* no flow yet */ }
    test.skip(!existing, 'Run `npm run contact` first to have an existing contact');
    await contact.loadExisting(existing);
    await expect(contact.field('pContactNumber')).toHaveValue(existing);
  });
});
