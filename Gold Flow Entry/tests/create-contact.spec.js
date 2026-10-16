const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { ContactPage } = require('../pages/ContactPage');
const { uniqueContact } = require('../test-data/contact');

// Every run creates one NEW Individual contact with unique name / mobile / PAN.
test('TC_CONTACT_001 - Create a single Individual contact (Manual) as Internal Appraiser 1', async ({ page }, testInfo) => {
  const data = uniqueContact();
  testInfo.annotations.push({ type: 'test-data', description: `${data.firstName} ${data.lastName} / ${data.mobile} / PAN ${data.documents[0].reference}` });
  const contact = new ContactPage(page);

  await test.step('Login as tryfinsta (Internal Appraiser 1)', () => new LoginPage(page).login('INT_APPRAISER1'));
  await test.step('Open Contact → Contact Configuration → Contact → New → Manual', () => contact.openNewManualContact());
  await test.step('Fill Contact Info (Title, Name, DOB, Gender, Mobile, Email)', () => contact.fillContactInfo(data));
  await test.step('Fill Address Details and Add', () => contact.fillAddress(data.address));
  await test.step('Add KYC document (PAN)', async () => {
    for (const doc of data.documents) await contact.addDocument(doc);
  });

  await test.step('Add bank account (Bank Details tab)', async () => {
    console.log('Bank:', await contact.addBank({ ...data.bank, nameAsPerBank: `${data.firstName} ${data.lastName}` }));
  });

  await test.step('Save & Continue → "Saved Successfully"', async () => {
    await contact.saveAndContinue.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await contact.messages()).join(' ');
    expect(msgs).toMatch(/saved successfully/i);
  });

  await test.step('Verify contact appears in Contact list (search by phone)', async () => {
    const card = await contact.findInList(data.mobile);
    expect(card).toContain(data.firstName);
    expect(card).toContain(data.documents[0].reference);
    const ucic = (card.match(/UCIC\s*:\s*(\d+)/) || [])[1];
    testInfo.annotations.push({ type: 'UCIC', description: ucic || 'not shown' });
    console.log(`Created contact: ${data.firstName} ${data.lastName} | Mobile ${data.mobile} | PAN ${data.documents[0].reference} | UCIC ${ucic}`);
    const f = flow.start({ contactName: `${data.firstName} ${data.lastName}`, mobile: data.mobile, pan: data.documents[0].reference, ucic });
    console.log(`New flow ${f.flowId} started for this contact → test-data/current-flow.json`);
  });
});
