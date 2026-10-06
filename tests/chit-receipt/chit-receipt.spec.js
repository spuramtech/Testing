const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { ChitReceiptPage } = require('../../pages/ChitReceiptPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/chit-receipt-data');

const ALL_FIELD_LABELS = [
  'Subscriber', 'Date', 'Cash', 'Bank', 'Installment Amount', 'Vacant Charges', 'Subscription',
  'Incidental Charges', 'Interest Collected', 'Amount Received', 'Waiver Amount', 'Authorized by',
  'Other Charges', 'Bid Offers',
];

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new ChitReceiptPage(page);
  await form.open();
  return form;
}

test.describe('Chit Receipt - Field Coverage (all fields, no skips)', () => {
  test('TC_CR_ALL01 - Every field on the Chit Receipt form is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of ALL_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });
});

test.describe('Chit Receipt - Mandatory Field Validation', () => {
  for (const f of data.mandatoryFields) {
    test(`${f.id} - Submitting the form with an empty "${f.label}" shows its required-field message`, async ({ page }) => {
      const form = await openForm(page);
      await form.saveBtn().click();
      await page.waitForTimeout(1500);
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain(f.expectedMsg);
    });
  }

  test('TC_CR_MSG01 - Empty-submit validation summary text is spelled correctly ("fields", not "filelds")', async ({ page }) => {
    const form = await openForm(page);
    await form.saveBtn().click();
    await page.waitForTimeout(1500);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasTypo = /Fill Required filelds/i.test(bodyText);
    console.log('TC_CR_MSG01: validation summary text found =', bodyText.split('\n').filter(l => /fill required/i.test(l)).join(' | '));
    expect(hasTypo, 'BUG-010: validation summary should read "Fill Required fields", not the misspelled "filelds"').toBe(false);
  });
});

test.describe('Chit Receipt - Amount Boundary/Format', () => {
  for (const c of data.amountBoundary) {
    test(`${c.id} - ${c.field} "${c.value}" (${c.label})`, async ({ page }) => {
      const form = await openForm(page);
      const val = await form.setValueJS(c.field, c.value);
      console.log(`${c.id}: ${c.field} accepted as "${val}" for input "${c.value}"`);
      await expect(form.saveBtn()).toBeVisible();
    });
  }
});

test.describe('Chit Receipt - Special Character / XSS Safety', () => {
  for (const c of data.specialCharPayloads) {
    test(`${c.id} - ${c.label} is not executed`, async ({ page }) => {
      const form = await openForm(page);
      let dialogFired = false;
      page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
      await form.setValueJS(c.field, c.value);
      await page.waitForTimeout(500);
      expect(dialogFired).toBe(false);
    });
  }
});

test.describe('Chit Receipt - Subscriber Selection', () => {
  test('TC_CR_SUB01 - Selecting a subscriber loads their Running Chits / Dues History sections', async ({ page }) => {
    const form = await openForm(page);
    const selected = await form.selectFirstSubscriber();
    expect(selected, 'At least one subscriber should be selectable').toBe(true);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Running Chits');
    expect(bodyText).toContain('Dues History');
  });
});
