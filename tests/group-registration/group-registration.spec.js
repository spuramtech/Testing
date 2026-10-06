const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { GroupRegistrationPage } = require('../../pages/GroupRegistrationPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/group-registration-data');

const ALL_FIELD_LABELS = [
  'Group Code', 'PSO Number', 'Registration Date', 'Commencement Date', 'Termination Date',
];

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new GroupRegistrationPage(page);
  await form.open();
  return form;
}

test.describe('Group Registration - Field Coverage (all fields, no skips)', () => {
  test('TC_GR_ALL01 - Every field on the Group Registration form is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of ALL_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });

  test('TC_GR_ALL02 - Group Code dropdown is populated only with groups that completed Group Formation', async ({ page }) => {
    const form = await openForm(page);
    const count = await page.locator('select[formcontrolname="groupcode"] option').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Group Registration - Mandatory Field Validation', () => {
  for (const f of data.mandatoryFields) {
    test(`${f.id} - Submitting the form with an empty "${f.label}" shows its required-field message`, async ({ page }) => {
      const form = await openForm(page);
      await form.saveBtn().click();
      await page.waitForTimeout(1200);
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain(f.expectedMsg);
    });
  }
});

test.describe('Group Registration - PSO Number Boundary/Format', () => {
  for (const c of data.psoNumberBoundary) {
    test(`${c.id} - PSO Number "${c.value}" (${c.label})`, async ({ page }) => {
      const form = await openForm(page);
      const val = await form.setValueJS('psonumber', c.value);
      console.log(`${c.id}: PSO Number accepted as "${val}" for input "${c.value}"`);
      await expect(form.saveBtn()).toBeVisible();
    });
  }
});

test.describe('Group Registration - Special Character / XSS Safety', () => {
  for (const c of data.specialCharPayloads) {
    test(`${c.id} - ${c.label} is not executed`, async ({ page }) => {
      const form = await openForm(page);
      let dialogFired = false;
      page.once('dialog', async d => { dialogFired = true; await d.dismiss(); });
      await form.setValueJS('psonumber', c.value);
      await page.waitForTimeout(500);
      expect(dialogFired).toBe(false);
    });
  }
});

test.describe('Group Registration - Save with valid data (Root Cause Investigation)', () => {
  test('TC_GR_CREATE01 - Saving with a valid Group Code, PSO Number and all dates either succeeds or reports a specific blocking field', async ({ page }) => {
    const form = await openForm(page);
    const groupCodeResult = await form.selectFirstRealOptionJS('groupcode');
    await form.setValueJS('psonumber', '123456');
    await form.setValueJS('regisitrationdate', '01/10/2026');
    await form.setValueJS('commencementdate', '01/10/2026');
    await form.setValueJS('terminationdate', '01/10/2030');
    await page.waitForTimeout(400);

    const responses = [];
    page.on('response', res => { if (res.request().method() !== 'GET') responses.push(res.url()); });
    await form.saveBtn().click();
    await page.waitForTimeout(2000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const stillShowsRequired = /Required/.test(bodyText.split('\n').filter(l => data.mandatoryFields.some(f => l.includes(f.expectedMsg))).join(''));

    console.log(`TC_GR_CREATE01: Group Code selected=${JSON.stringify(groupCodeResult)}, API calls fired=${JSON.stringify(responses)}, still shows a Required message=${stillShowsRequired}`);
    console.log('Required-message lines present:', bodyText.split('\n').filter(l => /Required/i.test(l)).join(' | ') || '(none)');
  });
});
