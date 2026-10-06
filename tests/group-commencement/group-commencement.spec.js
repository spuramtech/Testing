const { test, expect } = require('@playwright/test');
const { CREDS } = require('../../utils/config');
const { GroupCommencementPage } = require('../../pages/GroupCommencementPage');
const { loginAndSelectBranch } = require('../../utils/navigation');

const ALL_FIELD_LABELS = [
  'Group Code', 'Group Status', 'Chit Value', 'Formation Date', 'Registration Date',
  'Commencement Date', 'Termination Date', 'PSO Number', 'New Commencement Date',
  '1st Auction Date', '2nd Auction Date', 'New Termination Date', 'Transaction Date',
  'Commencement Certificate Number/Byelaw No.', 'Select Security Type', 'Fixed Deposit',
  'Mortgage', 'Both',
];

async function openForm(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const form = new GroupCommencementPage(page);
  await form.open();
  return form;
}

test.describe('Group Commencement - Field Coverage (all fields, no skips)', () => {
  test('TC_GC_ALL01 - Every field on the Group Commencement search grid and form is present', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    for (const label of ALL_FIELD_LABELS) {
      expect(bodyText, `missing field: ${label}`).toContain(label);
    }
  });

  test('TC_GC_ALL02 - Security Type offers Fixed Deposit, Mortgage and Both options', async ({ page }) => {
    await openForm(page);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('Fixed Deposit');
    expect(bodyText).toContain('Mortgage');
    expect(bodyText).toContain('Both');
  });
});

test.describe('Group Commencement - Search Grid Defect Investigation', () => {
  test('TC_GC_BUG01 - The group search grid shows "No data to display" because its backing API returns HTTP 500', async ({ page }) => {
    const apiCalls = [];
    page.on('response', res => {
      if (res.url().includes('getMortgageDetailsForCommencement')) {
        apiCalls.push({ url: res.url(), status: res.status() });
      }
    });
    await openForm(page);
    await page.waitForTimeout(1000);

    const emptyRowVisible = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(e => e.textContent.trim() === 'No data to display');
      return !!el;
    });

    console.log('TC_GC_BUG01: getMortgageDetailsForCommencement calls =', JSON.stringify(apiCalls), '| empty-row shown =', emptyRowVisible);
    expect(apiCalls.length, 'The commencement-grid API should have been called').toBeGreaterThan(0);
    expect(apiCalls.every(c => c.status < 400), 'BUG-009: getMortgageDetailsForCommencement should not return a server error (500) - this is why the search grid always shows "No data to display"').toBe(true);
  });
});

test.describe('Group Commencement - Save Without Selecting a Group', () => {
  test('TC_GC_SAVE01 - Clicking Save without selecting a group from the grid does not persist anything (expected, not a defect - no group context to save against)', async ({ page }) => {
    const form = await openForm(page);
    const responses = [];
    page.on('response', res => { if (res.request().method() !== 'GET') responses.push(res.url()); });
    await form.saveBtn().click();
    await page.waitForTimeout(1500);
    console.log('TC_GC_SAVE01: API calls on Save with no group selected =', JSON.stringify(responses));
    expect(responses.length).toBe(0);
  });
});
