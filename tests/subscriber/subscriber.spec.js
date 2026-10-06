const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { SubscriberPage } = require('../../pages/SubscriberPage');
const { loginAndSelectBranch } = require('../../utils/navigation');

const MAIN_FIELD_LABELS = [
  'Chit Group', 'AR Group', 'Interbranch', 'Subscriber Type', 'Single Subscriber', 'Company Chit',
  'Ticket No.', 'Subscriber', 'Subscriber Signed Date', 'Introduced by', 'Area', 'Address',
  'Document Type', 'Document Name', 'Reference Number', 'Month', 'Year', 'Upload Identification Proof',
];

const TAB_FIELD_LABELS = {
  'Income Details': ['Employed', 'Self Employed/Business', 'Name of the organization', 'Office Phone No.', 'Designation', 'Hire Date', 'Retirement Date', 'Employee Code', 'PF Number', 'Basic Salary', 'Net Amount'],
  'Nominee Details': ['Nominee Name', 'Age', 'Relationship', 'Address'],
  'Bank Details': ['Bank Name', 'Account Number', 'IFSC Code', 'Branch', 'Name As Per Bank Passbook'],
  'Authorized Signatory': ['Employee', 'Designation'],
  'Related Parties': ['Related Contact', 'Relationship'],
  'Business Introduced By': ['Designation', 'Employee'],
};

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new SubscriberPage(page);
  await form.open();
  return form;
}

test.describe('Subscriber - Field Coverage (all fields, no skips)', () => {
  test('TC_SUB_ALL01 - Every field on the main New Subscriber form is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of MAIN_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });

  for (const [tabName, labels] of Object.entries(TAB_FIELD_LABELS)) {
    test(`TC_SUB_TAB_${tabName.replace(/\s+/g, '_').toUpperCase()} - Every field on the "${tabName}" tab is present`, async ({ page }) => {
      const form = await openForm(page);
      await form.goToTab(tabName);
      const bodyText = await page.evaluate(() => document.body.innerText);
      for (const label of labels) {
        expect(bodyText, `missing field: ${label}`).toContain(label);
      }
    });
  }
});

test.describe('Subscriber - Mandatory Field Validation', () => {
  const mandatoryFields = [
    { id: 'TC_SUB_MF01', label: 'Chit Group', expectedMsg: 'Chit Group Required' },
    { id: 'TC_SUB_MF02', label: 'Introduced by', expectedMsg: 'Introduced by Required' },
    { id: 'TC_SUB_MF03', label: 'Area', expectedMsg: 'Area Required' },
    { id: 'TC_SUB_MF04', label: 'KYC Details', expectedMsg: 'Atleast one KYC Details Required' },
  ];
  for (const f of mandatoryFields) {
    test(`${f.id} - Submitting with an empty/missing "${f.label}" shows its required-field message`, async ({ page }) => {
      const form = await openForm(page);
      await form.saveBtn().click();
      await page.waitForTimeout(1500);
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain(f.expectedMsg);
    });
  }
});

test.describe('Subscriber - KYC "+Add" Save Investigation (same pattern as BUG-006)', () => {
  test('TC_SUB_KYC01 - Selecting Chit Group, Introduced by and Area without a KYC entry still blocks Save on "Atleast one KYC Details Required"', async ({ page }) => {
    const form = await openForm(page);
    await form.selectFirstNgOption('chitgroupid');
    await form.selectFirstNgOption('introducedid');
    await form.selectFirstNgOption('areaid');
    await page.waitForTimeout(400);

    const responses = [];
    page.on('response', res => { if (res.request().method() !== 'GET') responses.push(res.url()); });
    await form.saveBtn().click();
    await page.waitForTimeout(1500);
    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log('TC_SUB_KYC01: API calls =', JSON.stringify(responses), '| body contains KYC-required message =', bodyText.includes('Atleast one KYC Details Required'));
    expect(bodyText).toContain('Atleast one KYC Details Required');
    expect(responses.length).toBe(0);
  });
});
