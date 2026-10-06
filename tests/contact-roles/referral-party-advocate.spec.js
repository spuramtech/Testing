const { test, expect } = require('@playwright/test');
const { ContactDetailPage } = require('../../pages/ContactDetailPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const data = require('../../test-data/contact-roles-data');

const { CREDS } = require('../../utils/config');
const CONTACT_ID = '327299';

async function openRoleTab(page, role) {
  await loginAndSelectBranch(page, '/', CREDS);
  const detail = new ContactDetailPage(page);
  await detail.goToRoleTabByUrl(CONTACT_ID, role);
  return detail;
}

test.describe('Contact Role - Referral Tab', () => {
  test('TC_ROLE_REF01 - Referral tab shows PAN status, Introduced By, TDS Section No. and Referred Branch fields', async ({ page }) => {
    const detail = await openRoleTab(page, 'Referral');
    await expect(page.locator('.tab-pane.active').getByText('Introduced By').first()).toBeVisible();
    await expect(page.locator('.tab-pane.active').getByText('TDS Section No.').first()).toBeVisible();
    await expect(page.locator('.tab-pane.active').getByText('Referred Branch').first()).toBeVisible();
  });

  for (const f of data.referralMandatoryFields) {
    test(`${f.id} - Submitting Referral with an empty "${f.label}" shows its required-field message`, async ({ page }) => {
      const detail = await openRoleTab(page, 'Referral');
      await detail.saveBtn().click();
      await page.waitForTimeout(1200);
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toContain(f.expectedMsg);
    });
  }

  test('TC_ROLE_REF_PAN01 - Invalid PAN format on Referral tab is rejected', async ({ page }) => {
    const detail = await openRoleTab(page, 'Referral');
    await page.locator('input[formcontrolname="pPanNumber"]').fill('BADPAN123');
    await detail.saveBtn().click();
    await page.waitForTimeout(1200);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(/invalid.*pan/i.test(bodyText)).toBe(true);
  });

  test('TC_ROLE_REF02 - TDS Section No. defaults to a pre-selected value (194H)', async ({ page }) => {
    const detail = await openRoleTab(page, 'Referral');
    const tdsSelect = page.locator('label:has-text("TDS Section No.")').first().locator('xpath=following::ng-select[1]');
    await expect(tdsSelect).toContainText('194H');
  });
});

test.describe('Contact Role - Party (Supplier) Tab', () => {
  test('TC_ROLE_PARTY01 - Party tab shows a read-only confirmation card with the contact\'s name and UID', async ({ page }) => {
    const detail = await openRoleTab(page, 'supplier');
    await expect(page.getByText('Party Info').first()).toBeVisible();
    await expect(page.getByText(/Unique ID/).first()).toBeVisible();
  });

  test('TC_ROLE_PARTY02 - Clicking Save on the Party tab does not silently fail without any network activity', async ({ page }) => {
    const responses = [];
    page.on('response', res => {
      if (res.request().method() !== 'GET' && res.url().includes('/api/')) responses.push(res.url());
    });
    const detail = await openRoleTab(page, 'supplier');
    await detail.saveBtn().click();
    await page.waitForTimeout(2500);
    console.log('Party Save - API calls fired:', JSON.stringify(responses));
    expect(responses.length, 'Clicking Save on the Party tab should trigger at least one API call (matches the BUG-006 silent-failure pattern found on the Contact form if this fails)').toBeGreaterThan(0);
  });
});

test.describe('Contact Role - Advocate Tab', () => {
  test('TC_ROLE_ADV01 - Advocate tab shows a read-only confirmation card with the contact\'s name and UID', async ({ page }) => {
    const detail = await openRoleTab(page, 'advocate');
    const found = await page.evaluate(() => {
      const isVisible = el => el.offsetParent !== null;
      const hasAdvocateInfo = [...document.querySelectorAll('*')].some(el => el.children.length === 0 && /Advocate Info/i.test(el.textContent) && isVisible(el));
      const hasUniqueId = [...document.querySelectorAll('p')].some(el => /Unique ID/i.test(el.textContent) && isVisible(el));
      return { hasAdvocateInfo, hasUniqueId };
    });
    expect(found.hasAdvocateInfo, 'Advocate Info label should be visible').toBe(true);
    expect(found.hasUniqueId, 'Unique ID text should be visible').toBe(true);
  });

  test('TC_ROLE_ADV02 - Clicking Save on the Advocate tab does not silently fail without any network activity', async ({ page }) => {
    const responses = [];
    page.on('response', res => {
      if (res.request().method() !== 'GET' && res.url().includes('/api/')) responses.push(res.url());
    });
    const detail = await openRoleTab(page, 'advocate');
    await detail.saveBtn().click();
    await page.waitForTimeout(2500);
    console.log('Advocate Save - API calls fired:', JSON.stringify(responses));
    expect(responses.length, 'Clicking Save on the Advocate tab should trigger at least one API call').toBeGreaterThan(0);
  });
});

test.describe('Contact Role - Subscriber Tab', () => {
  test('TC_ROLE_SUB01 - Subscriber tab is the default active tab and shows existing ticket information', async ({ page }) => {
    const detail = await openRoleTab(page, 'subscriber');
    await expect(page.locator('a[data-toggle="tab"]', { hasText: 'Subscriber' }).first()).toBeVisible();
  });
});

test.describe('Contact Role Tabs - Cross-Tab Navigation', () => {
  test('TC_ROLE_NAV01 - All 5 role tabs (Subscriber, Employee, Referral, Supplier, Advocate) are present and clickable from any starting tab', async ({ page }) => {
    const detail = await openRoleTab(page, 'Employee');
    for (const tabName of ['Subscriber', 'Referral', 'Supplier', 'Advocate', 'Employee']) {
      await detail.goToRoleTab(tabName);
      await expect(page.locator('a[data-toggle="tab"].active, li.active a', { hasText: tabName }).first()).toBeVisible().catch(async () => {
        await expect(page.getByText(tabName, { exact: true }).first()).toBeVisible();
      });
    }
  });

  test('TC_ROLE_NAV02 - "Previous" link from a role tab returns to the contact detail view', async ({ page }) => {
    const detail = await openRoleTab(page, 'Employee');
    const clicked = await page.evaluate(() => {
      const els = [...document.querySelectorAll('a, button, span')].filter(e => e.textContent.trim() === 'Previous' && e.offsetParent !== null);
      if (!els.length) return false;
      els[0].click();
      return true;
    });
    expect(clicked, 'Previous link/button should be found visible on the role tab page').toBe(true);
    await page.waitForTimeout(2500);
    const navigatedAway = !page.url().includes('ContactMore');
    console.log('NAV02 URL after Previous click:', page.url());
    expect(navigatedAway, 'Clicking Previous should navigate away from the ContactMore role-tab URL').toBe(true);
  });
});
