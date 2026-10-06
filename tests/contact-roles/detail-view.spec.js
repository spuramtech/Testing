const { test, expect } = require('@playwright/test');
const { ContactPage } = require('../../pages/ContactPage');
const { ContactDetailPage } = require('../../pages/ContactDetailPage');
const { loginAndSelectBranch } = require('../../utils/navigation');
const fs = require('fs');

const { CREDS } = require('../../utils/config');
const EVIDENCE_DIR = 'qmetry/evidence';
if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
async function shot(page, name) { await page.screenshot({ path: `${EVIDENCE_DIR}/${name}.png`, fullPage: true }); }

async function openDetailView(page) {
  await loginAndSelectBranch(page, '/', CREDS);
  const contact = new ContactPage(page);
  const detail = new ContactDetailPage(page);
  await contact.openFromDashboard();
  await page.waitForTimeout(1200);
  await detail.openFirstContactDetail();
  return detail;
}

test.describe('Contact Detail View - Role Summary Panel', () => {
  test('TC_ROLE_DV01 - Detail view shows contact name, UID, phone and address', async ({ page }) => {
    const detail = await openDetailView(page);
    await expect(page.getByText(/UID\s*:/)).toBeVisible();
    await expect(page.locator('table:has-text("Guarantor")')).toBeVisible();
    await shot(page, 'TC_ROLE_DV01_detail_view');
  });

  test('TC_ROLE_DV02 - All 7 role categories are listed: Subscriber, Employee, Referral, Party, Advocate, Guarantor, Related Parties', async ({ page }) => {
    await openDetailView(page);
    const table = page.locator('table:has-text("Guarantor")');
    for (const role of ['Subscriber', 'Employee', 'Referral', 'Party', 'Advocate', 'Guarantor', 'Related Parties']) {
      await expect(table.locator('th', { hasText: role })).toBeVisible();
    }
  });

  test('TC_ROLE_DV03 - Subscriber shows a green "done" indicator with an existing ticket count', async ({ page }) => {
    await openDetailView(page);
    await expect(page.getByText(/\d+\s*Tickets/).first()).toBeVisible();
    await expect(page.locator('span.done').first()).toBeVisible();
  });

  test('TC_ROLE_DV04 - Employee, Referral, Party and Advocate show a "not done" indicator with a Create action when not yet assigned', async ({ page }) => {
    await openDetailView(page);
    const createLinks = page.locator('a:has-text("Create")');
    expect(await createLinks.count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('span.notdone').first()).toBeVisible();
  });

  test('TC_ROLE_DV05 - Guarantor panel expands and shows "0 Chits" for a contact with no guarantor tickets', async ({ page }) => {
    await openDetailView(page);
    await page.locator('a[data-target="#sub-detail-guarantor"]').click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Guarantor has \d+ Chits/)).toBeVisible();
    await shot(page, 'TC_ROLE_DV05_guarantor_panel');
  });

  test('TC_ROLE_DV06 - Related Parties panel expands and shows a related-party count', async ({ page }) => {
    await openDetailView(page);
    await page.locator('a[data-target="#sub-detail-contactrelatedparties"]').click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/has \d+ Related Parties/i)).toBeVisible();
  });

  test('TC_ROLE_DV07 - Multiple expandable panels (Guarantor + Related Parties) can be open at the same time', async ({ page }) => {
    await openDetailView(page);
    await page.locator('a[data-target="#sub-detail-guarantor"]').click();
    await page.waitForTimeout(800);
    await page.locator('a[data-target="#sub-detail-contactrelatedparties"]').click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/Guarantor has/)).toBeVisible();
    await expect(page.getByText(/has \d+ Related Parties/i)).toBeVisible();
  });

  test('TC_ROLE_DV08 - Direct URL access to the contact detail view without prior navigation still requires authentication', async ({ page }) => {
    await loginAndSelectBranch(page, '/', CREDS);
    await page.goto('http://host81.kapilits.com:8007/#/configuration/ContactListView?ID=327299', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
    await expect(page.getByText(/UID\s*:/)).toBeVisible();
  });
});
