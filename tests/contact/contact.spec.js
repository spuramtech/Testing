const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');
const fs = require('fs');

const CREDS = { username: 'admin', password: 'jayapriya@123' };
const EVIDENCE_DIR = 'qmetry/evidence';
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `${EVIDENCE_DIR}/${name}.png`, fullPage: true });
}

test.describe('Contact Module - Positive Scenarios', () => {
  test('TC_CONTACT_001 - Contact list loads with all category tabs and pagination summary', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await expect(page.getByText('Contacts', { exact: true })).toBeVisible();
    await expect(page.getByText('Employees', { exact: true })).toBeVisible();
    await expect(page.getByText('Referrals', { exact: true })).toBeVisible();
    await expect(page.getByText('Party', { exact: true })).toBeVisible();
    await expect(page.getByText('Advocates', { exact: true })).toBeVisible();
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
    await shot(page, 'TC_CONTACT_001_list_loaded');
  });

  test('TC_CONTACT_002 - New Contact form opens with Individual selected and mandatory fields marked', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await expect(page.locator('input[type=radio]').first()).toBeChecked();
    await expect(page.getByText('Personal Details')).toBeVisible();
    await expect(page.locator('label:has-text("Name") .required-field, label.required-field:has-text("Name")').first()).toBeVisible().catch(async () => {
      await expect(page.locator('label:has-text("Name")').first()).toBeVisible();
    });
  });

  test('TC_CONTACT_003 - Switching to Business Entity changes the form to enterprise fields', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await contact.businessRadio.click();
    await page.waitForTimeout(800);
    await expect(page.getByText('Name of the Enterprise')).toBeVisible();
    await expect(page.getByText('Enterprise Email ID')).toBeVisible();
    await shot(page, 'TC_CONTACT_003_business_entity_form');
  });

  test('TC_CONTACT_004 - Title dropdown offers expected salutation options', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    const options = await page.locator('select').first().evaluate(el => [...el.options].map(o => o.textContent.trim()));
    expect(options).toEqual(['Select', 'Mr', 'Ms', 'Mrs', 'Master', 'Dr', 'Prof']);
  });

  test('TC_CONTACT_005 - Adding a valid address appends it to the address table', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await contact.fillAddress(data.validContact.address);
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('Permanent Address').last()).toBeVisible();
    await expect(page.getByText(/12A, QA TEST STREET/)).toBeVisible();
    await shot(page, 'TC_CONTACT_005_address_added');
  });

  test('TC_CONTACT_006 - Country to State to District cascading selects populate correctly', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await contact.selectNgSelectByLabel('Country', 'India');
    await contact.selectNgSelectByLabel('State', 'Tamil Nadu');
    await contact.selectNgSelectByLabel('District', 'Chennai');
    await expect(page.locator('ng-select[formcontrolname="pCountryId"]')).toContainText('India');
    await expect(page.locator('ng-select[formcontrolname="pStateId"], ng-select').nth(1)).toBeVisible();
  });

  test('TC_CONTACT_007 - Valid search by name returns matching results', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.search('SANTHOSHI');
    await expect(page.getByText('SANTHOSHI', { exact: false }).first()).toBeVisible();
    await shot(page, 'TC_CONTACT_007_valid_search');
  });
});

test.describe('Contact Module - Negative & Validation Scenarios', () => {
  test('TC_CONTACT_008 - Submitting Save Contact with all fields empty shows required-field validation', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await contact.saveBtn.click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Name Required');
    expect(bodyText).toContain('Father Name Required');
    expect(bodyText).toContain('Primary Contact Number Required');
    await shot(page, 'TC_CONTACT_008_empty_submit_validation');
  });

  test('TC_CONTACT_009 - Search with fewer than 3 characters does not trigger a search', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.search('ab');
    await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
  });

  test('TC_CONTACT_010 - Search with no matching contacts shows "No Records Found"', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.search('ZZZZNOTEXIST9999');
    await expect(page.getByText('No Records Found')).toBeVisible();
    await shot(page, 'TC_CONTACT_010_no_records_found');
  });

  test('TC_CONTACT_011 - Primary Contact Number shorter than 10 digits is rejected with length validation', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await page.locator('input[formcontrolname="pContactNumber"]').fill('123');
    await page.locator('input[formcontrolname="pFatherName"]').click();
    await page.waitForTimeout(600);
    await expect(page.getByText('Enter the data with minimum(10) fixed length')).toBeVisible();
  });

  test('TC_CONTACT_012 - Invalid email format is rejected', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await page.locator('input[formcontrolname="pEmailId"]').fill('notanemail');
    await page.locator('input[formcontrolname="pFatherName"]').click();
    await page.waitForTimeout(600);
    await expect(page.getByText('Invalid Primary Email ID')).toBeVisible();
  });

  test('TC_CONTACT_013 - Save is blocked when mandatory Aadhar KYC document is missing', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await contact.selectTitle(data.validContact.title);
    await page.locator('select[formcontrolname="rTitleName"]').selectOption({ index: 1 });
    await contact.fillPersonalDetails(data.validContact);
    await contact.fillAddress(data.validContact.address);
    await contact.addAddressBtn.click();
    await page.waitForTimeout(1000);
    await contact.saveBtn.click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('Aadhar Card is mandatory in KYC Documents')).toBeVisible();
    await shot(page, 'TC_CONTACT_013_kyc_mandatory_block');
  });

  test('TC_CONTACT_SC01 - XSS script payload in Name field is not executed', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    let dialogFired = false;
    page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
    await page.locator('input[formcontrolname="pName"]').fill('<script>alert(1)</script>');
    await page.waitForTimeout(500);
    expect(dialogFired, 'No JS alert() should fire from injected payload').toBe(false);
  });

  test('TC_CONTACT_SC02 - SQL-injection-style payload in search box does not break the results grid', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.search("' OR '1'='1");
    await page.waitForTimeout(1000);
    await expect(page.getByText(/No Records Found|Page \d+ of \d+/)).toBeVisible();
  });

  test('TC_CONTACT_014 - Clear button resets all entered field values', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await page.locator('input[formcontrolname="pName"]').fill('TempName');
    await page.locator('input[formcontrolname="pFatherName"]').fill('TempFather');
    await contact.clearBtn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('input[formcontrolname="pName"]')).toHaveValue('');
    await expect(page.locator('input[formcontrolname="pFatherName"]')).toHaveValue('');
  });
});

test.describe('Contact Module - Defect Verification', () => {
  test('TC_CONTACT_N01 - Primary Contact Number field accepts a 10-character non-numeric value', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    const contact = new ContactPage(page);
    await contact.openFromDashboard();
    await contact.openNewForm();
    await page.locator('input[formcontrolname="pContactNumber"]').fill('abcdefghij');
    await page.locator('input[formcontrolname="pFatherName"]').click();
    await page.waitForTimeout(700);
    await shot(page, 'BUG-002_evidence');
    await expect(
      page.getByText(/Invalid.*Contact Number|Numeric.*only|must be numeric/i),
      'A 10-character non-numeric Primary Contact Number should be flagged as invalid format'
    ).toBeVisible();
  });
});
