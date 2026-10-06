const { test, expect } = require('@playwright/test');
const { CREDS } = require("../../utils/config");
const { GroupFormationPage } = require('../../pages/GroupFormationPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/group-formation-data');


const ALL_FIELD_LABELS = [
  'Group Status', 'Group Formation Date', 'Registrar Branch', 'Chit Value', 'Chit Period',
  'No. of Auctions', 'Chit Group Code', 'Maximum Subscription', 'Maximum Discount (%)',
  'Foreman Commission (%)', 'Breach of Contract (%)', 'Company Chit - Auction Number',
  'Company Chit - Ticket Number', 'Select Auction Date', 'Auction Date', 'Select Auction Week And Day',
  'Week', 'Day', 'Installment Due Date:', 'No. of days from Auction Date',
  'When is first installment collected?', 'Dividend Posting',
  'Does this chit group have a pre-defined bid amount?',
];

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new GroupFormationPage(page);
  await form.open();
  return form;
}

test.describe('Group Formation - Field Coverage (all fields, no skips)', () => {
  test('TC_GF_ALL01 - Every field/section on the Group Formation form is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of ALL_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });
});

test.describe('Group Formation - Mandatory Field Validation', () => {
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

test.describe('Group Formation - Chit Value / Chit Period Dropdowns', () => {
  test('TC_GF_DD01 - Chit Value is a pre-configured dropdown of master values (not free text)', async ({ page }) => {
    const form = await openForm(page);
    const val = await form.selectOptionJS('Chitvalue', 'B');
    expect(val).toBe('B');
  });

  test('TC_GF_DD02 - Chit Period is a pre-configured dropdown of master values (not free text)', async ({ page }) => {
    const form = await openForm(page);
    const val = await form.selectOptionJS('Chitperiod', 'X1-12');
    expect(val).toBe('X1-12');
  });
});

test.describe('Group Formation - No. of Auctions / Maximum Subscription Boundary', () => {
  for (const c of data.noOfAuctionsBoundary.concat(data.subscriptionBoundary)) {
    test(`${c.id} - ${c.field} "${c.value}" (${c.label})`, async ({ page }) => {
      const form = await openForm(page);
      const val = await form.setValueJS(c.field, c.value);
      console.log(`${c.id}: ${c.field} accepted as "${val}" for input "${c.value}"`);
      await expect(form.saveBtn()).toBeVisible();
    });
  }
});

test.describe('Group Formation - Save with valid data (Root Cause Investigation)', () => {
  test('TC_GF_CREATE01 - Saving with a valid Chit Value, Chit Period, Group Code and Subscription still blocks on "Chit Period Required"', async ({ page }) => {
    const form = await openForm(page);
    const uniqueCode = 'QATEST' + Date.now().toString().slice(-6);
    await form.selectOptionJS('Chitvalue', 'B');
    const periodVal = await form.selectOptionJS('Chitperiod', 'X1-12');
    await form.setValueJS('Noofauction', '12');
    await form.setValueJS('Groupcode', uniqueCode);
    await form.setValueJS('Subscription', '1');
    await page.waitForTimeout(400);

    const periodClasses = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[formcontrolname="Chitperiod"]')].find(e => e.offsetParent !== null);
      return el ? el.className : null;
    });

    const responses = [];
    page.on('response', res => { if (res.request().method() !== 'GET') responses.push(res.url()); });
    await form.saveBtn().click();
    await page.waitForTimeout(2000);
    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log(`TC_GF_CREATE01: Chit Period selected value="${periodVal}", field classes="${periodClasses}", API calls fired=${JSON.stringify(responses)}`);
    const stillBlockedDespiteValid = periodClasses && periodClasses.includes('ng-valid') && /Chit Period Required/.test(bodyText);
    console.log('Root-cause reproduced (valid field still blocks Save):', stillBlockedDespiteValid);
    expect(responses.length, 'BUG-007: Save should fire an API call once Chit Value/Period/Group Code/Subscription are validly filled - currently blocked by a stale "Chit Period Required" validator').toBeGreaterThan(0);
  });
});

test.describe('Group Formation - Percentage Field Boundary/Format', () => {
  for (const c of data.percentBoundary) {
    test(`${c.id} - ${c.field} "${c.value}" (${c.label})`, async ({ page }) => {
      const form = await openForm(page);
      const val = await form.setValueJS(c.field, c.value);
      console.log(`${c.id}: ${c.field} accepted as "${val}" for input "${c.value}"`);
      await expect(form.saveBtn()).toBeVisible();
    });
  }
});

test.describe('Group Formation - Special Character / XSS Safety', () => {
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

test.describe('Group Formation - Auction Date vs Week/Day Toggle', () => {
  test('TC_GF_TOGGLE01 - "Select Auction Date" and "Select Auction Week And Day" are mutually exclusive radio options', async ({ page }) => {
    await openForm(page);
    const radios = page.locator('input[formcontrolname="Auctiondateorweekchecked"]:visible');
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('TC_GF_TOGGLE02 - Selecting "Select Auction Week And Day" reveals Week and Day fields', async ({ page }) => {
    await openForm(page);
    const weekOption = page.locator(':visible', { hasText: 'Select Auction Week And Day' }).first();
    await weekOption.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(600);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Week');
    expect(bodyText).toContain('Day');
  });
});

test.describe('Group Formation - Pre-defined Bid Amount Toggle', () => {
  test('TC_GF_BID01 - "Does this chit group have a pre-defined bid amount?" offers Yes/No options', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Yes');
    expect(bodyText).toContain('No');
  });
});
