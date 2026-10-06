const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-data');
const fs = require('fs');

const { CREDS } = require('../../utils/config');
const EVIDENCE_DIR = 'qmetry/evidence';
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
async function shot(page, name) { await page.screenshot({ path: `${EVIDENCE_DIR}/${name}.png`, fullPage: true }); }

async function openNewContactForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  await contact.openFromDashboard();
  await contact.openNewForm();
  return contact;
}

test.describe('Contact Module - Mandatory Field Omission Matrix', () => {
  for (const mf of data.mandatoryFieldOmissions) {
    test(`${mf.id} - Omitting "${mf.label}" alone shows its specific required-field message`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await contact.fillMandatoryExcept(data.validContact, mf.field);
      await contact.saveBtn.click();
      await page.waitForTimeout(1200);
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain(mf.expectedMsg);
    });
  }

  for (const ma of data.mandatoryAddressOmissions) {
    test(`${ma.id} - Omitting address field "${ma.label}" prevents adding the address`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await contact.fillAddressExcept(data.validContact.address, ma.field);
      const rowCountBefore = await page.locator('table tbody tr').count().catch(() => 0);
      await contact.addAddressBtn.click();
      await page.waitForTimeout(1000);
      const bodyText = await page.evaluate(() => document.body.innerText);
      const addressWasAdded = bodyText.includes(data.validContact.address.street.toUpperCase()) || bodyText.includes(data.validContact.address.street);
      expect(addressWasAdded, `Address should not be added to the table while "${ma.label}" is missing`).toBe(false);
    });
  }
});

test.describe('Contact Module - Primary Contact Number Boundary Matrix', () => {
  for (const c of data.contactNumberBoundary) {
    test(`${c.id} - ${c.label}`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await page.locator('input[formcontrolname="pContactNumber"]').fill(c.value);
      await contact.blurToTrigger();
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasLengthError = bodyText.includes('Enter the data with minimum(10) fixed length');
      if (c.shouldBeValid) {
        expect(hasLengthError, `"${c.value}" (${c.label}) should NOT trigger the length-validation message`).toBe(false);
      } else {
        expect(hasLengthError, `"${c.value}" (${c.label}) should trigger the length-validation message`).toBe(true);
      }
    });
  }
});

test.describe('Contact Module - PAN Card Format Matrix', () => {
  for (const p of data.panPayloads) {
    test(`${p.id} - ${p.label}`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await page.locator('input[formcontrolname="ppancardno"]').fill(p.value);
      await contact.blurToTrigger();
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasInvalidMsg = bodyText.includes('Invalid PAN Card No.');
      if (p.shouldBeValid) {
        expect(hasInvalidMsg, `"${p.value}" (${p.label}) should NOT be flagged invalid`).toBe(false);
      } else {
        expect(hasInvalidMsg, `"${p.value}" (${p.label}) should be flagged invalid`).toBe(true);
      }
    });
  }
});

test.describe('Contact Module - Pincode Format Matrix (Defect Verification)', () => {
  for (const p of data.pincodePayloads) {
    test(`${p.id} - ${p.label}`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await contact.openTab('Address Details');
      await page.locator('input[formcontrolname="pPinCode"]').fill(p.value);
      await contact.blurToTrigger();
      await shot(page, `${p.id}_pincode_check`);
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasAnyPincodeError = /invalid.*pincode|pincode.*invalid|pincode.*digit|enter.*valid.*pincode/i.test(bodyText);
      if (p.shouldBeValid) {
        expect(hasAnyPincodeError, `Valid pincode "${p.value}" should not show an error`).toBe(false);
      } else {
        expect(hasAnyPincodeError, `Invalid pincode "${p.value}" (${p.label}) should be flagged - if this fails, Pincode has no format/length validation`).toBe(true);
      }
    });
  }
});

test.describe('Contact Module - Email Format Boundary Matrix', () => {
  for (const e of data.emailBoundary) {
    test(`${e.id} - ${e.label}`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await page.locator('input[formcontrolname="pEmailId"]').fill(e.value);
      await contact.blurToTrigger();
      await expect(page.getByText('Invalid Primary Email ID')).toBeVisible();
    });
  }
});

test.describe('Contact Module - Special Character / Injection Sweep Across Text Fields', () => {
  for (const f of data.nameSpecialCharFields) {
    test(`${f.id} - Special/injection payload in "${f.label}" is not executed and does not crash the form`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      let dialogFired = false;
      page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
      await page.locator(`input[formcontrolname="${f.field}"]`).fill(f.value);
      await page.waitForTimeout(500);
      expect(dialogFired, 'No JS alert() should fire from the injected payload').toBe(false);
      await expect(contact.saveBtn).toBeVisible();
    });
  }
});

test.describe('Contact Module - Long String / Boundary Length Sweep', () => {
  for (const f of data.longStringFields) {
    test(`${f.id} - "${f.label}" handles a 300-character value without breaking the form`, async ({ page }) => {
      const contact = await openNewContactForm(page);
      await page.locator(`input[formcontrolname="${f.field}"]`).fill(f.value);
      await page.waitForTimeout(500);
      await expect(contact.saveBtn).toBeVisible();
    });
  }
});

test.describe('Contact Module - Date of Birth / Age Field Behaviour', () => {
  test('TC_CONTACT_DOB01 - Selecting a valid past Date of Birth auto-calculates Age', async ({ page }) => {
    const contact = await openNewContactForm(page);
    const dobInput = page.locator('input[formcontrolname="pDob"]');
    await dobInput.fill('01/01/1990');
    await contact.blurToTrigger();
    const ageVal = await page.locator('input[formcontrolname="pAge"]').inputValue().catch(() => '');
    expect(ageVal.length > 0, 'Age field should populate after a valid DOB is entered').toBeTruthy();
  });

  test('TC_CONTACT_DOB02 - A future Date of Birth is rejected or does not produce a negative Age', async ({ page }) => {
    const contact = await openNewContactForm(page);
    const dobInput = page.locator('input[formcontrolname="pDob"]');
    await dobInput.fill('01/01/2099');
    await contact.blurToTrigger();
    const ageVal = await page.locator('input[formcontrolname="pAge"]').inputValue().catch(() => '');
    expect(Number(ageVal) < 0, 'A future DOB should not result in a negative Age value').toBe(false);
  });
});
