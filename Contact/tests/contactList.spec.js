const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

test.describe('@regression @functional Contact List', () => {
  test.beforeEach(async ({ page, contactListPage }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
  });

  test('@positive searches contact by partial name', async ({ contactListPage }) => {
    await contactListPage.searchContact('Automationtest');
    await expect(contactListPage.contactCardByName('Automationtest').first()).toBeVisible();
  });

  test('@negative shows no results for a non-existent contact', async ({ contactListPage }) => {
    await contactListPage.searchContact('ZZZ_NON_EXISTENT_CONTACT_ZZZ');
    await expect(contactListPage.noRecordsMessage).toBeVisible();
  });

  test('@negative handles special characters in search without error', async ({ contactListPage }) => {
    await contactListPage.searchContact("'; DROP TABLE contact; --");
    await expect(contactListPage.searchInput).toHaveValue("'; DROP TABLE contact; --");
  });

  test('@positive toggles between Individual and Business Entity', async ({ contactListPage }) => {
    await contactListPage.toggleBusinessEntity();
    await expect(contactListPage.businessEntityRadio).toBeChecked();
    await contactListPage.toggleIndividual();
    await expect(contactListPage.individualRadio).toBeChecked();
  });

  test('@positive @functional paginates using Next and Prev', async ({ contactListPage }) => {
    const initialInfo = await contactListPage.getPageInfoText();
    await contactListPage.goToNextPage();
    const nextInfo = await contactListPage.getPageInfoText();
    expect(nextInfo).not.toEqual(initialInfo);
    await contactListPage.goToPrevPage();
    const backInfo = await contactListPage.getPageInfoText();
    expect(backInfo).toEqual(initialInfo);
  });

  test('@positive Excel export triggers a downloadable file', async ({ contactListPage, page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await contactListPage.click(contactListPage.excelExportIcon);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
  });
});
