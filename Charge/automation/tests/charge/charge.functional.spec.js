const { test, expect } = require('../../fixtures/pageFixtures');
const { Assertions } = require('../../assertions/customAssertions');
const testData = require('../../data/chargeTestData.json');
const { faker } = require('@faker-js/faker');

test.describe('Charge screen - functional @functional @regression', () => {
  test('Charge list screen renders header, grid and pagination @smoke @sanity @positive', async ({ chargePage, chargeScreen }) => {
    await Assertions.assertVisible(chargePage.searchBox, 'Search box should be visible');
    await Assertions.assertVisible(chargePage.newButton, '+ New button should be visible');
    await Assertions.assertVisible(chargePage.exportPdfButton, 'Export to PDF should be visible');
    await Assertions.assertVisible(chargePage.exportExcelButton, 'Export to Excel should be visible');
    await Assertions.assertVisible(chargePage.paginationInfo, 'Pagination record count should be visible');
  });

  test('New button opens an empty Charge panel @smoke @positive', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await Assertions.assertVisible(chargePage.chargeNameInput);
    await expect(chargePage.chargeNameInput).toHaveValue('');
  });

  test(
    'creating a Charge with valid data adds a new row and closes the panel @smoke @sanity @positive @destructive',
    async ({ chargePage, chargeScreen }) => {
      const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
      await chargePage.createCharge({
        chargeName,
        typeOfLedger: testData.validCharge.typeOfLedger,
        applicable: testData.validCharge.applicable,
      });

      await expect(chargePage.panel).toBeHidden();
      expect(await chargePage.isChargeVisible(chargeName)).toBeTruthy();
    }
  );

  test(
    'editing an existing Charge updates the same row without increasing row count @regression @positive @destructive',
    async ({ chargePage, chargeScreen }) => {
      const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
      await chargePage.createCharge({ ...testData.validCharge, chargeName });
      await expect(chargePage.panel).toBeHidden();

      const rowCountBefore = await chargePage.getRowCount();

      await chargePage.openEditChargePanel(chargeName);
      await expect(chargePage.chargeNameInput).toHaveValue(chargeName);

      const updatedName = `${chargeName} Updated`;
      await chargePage.fillChargeForm({ chargeName: updatedName });
      await chargePage.saveCharge();

      const rowCountAfter = await chargePage.getRowCount();
      expect(rowCountAfter).toBe(rowCountBefore);
      expect(await chargePage.isChargeVisible(updatedName)).toBeTruthy();
    }
  );

  test('Clear button resets fields without closing the panel @regression @positive', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm(testData.validCharge);
    await chargePage.clearForm();

    await expect(chargePage.chargeNameInput).toHaveValue('');
    await expect(chargePage.panel).toBeVisible();
  });

  test('Close (X) discards changes and returns to the list @regression @positive', async ({ chargePage, chargeScreen }) => {
    await chargePage.openNewChargePanel();
    await chargePage.fillChargeForm(testData.validCharge);
    await chargePage.closePanel();

    await expect(chargePage.panel).toBeHidden();
    expect(await chargePage.isChargeVisible(testData.validCharge.chargeName)).toBeFalsy();
  });

  test(
    'deleting a Charge prompts for confirmation and removes the row on confirm @regression @positive @destructive',
    async ({ chargePage, chargeScreen }) => {
      const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
      await chargePage.createCharge({ ...testData.validCharge, chargeName });
      await expect(chargePage.panel).toBeHidden();

      await chargePage.deleteCharge(chargeName, { confirm: true });
      expect(await chargePage.isChargeVisible(chargeName)).toBeFalsy();
    }
  );

  test('cancelling delete keeps the Charge in the grid @regression @positive @destructive', async ({ chargePage, chargeScreen }) => {
    const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
    await chargePage.createCharge({ ...testData.validCharge, chargeName });
    await expect(chargePage.panel).toBeHidden();

    await chargePage.deleteCharge(chargeName, { confirm: false });
    expect(await chargePage.isChargeVisible(chargeName)).toBeTruthy();
  });

  test('search filters the grid by Charge name (partial match) @sanity @positive', async ({ chargePage, chargeScreen }) => {
    const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
    await chargePage.createCharge({ ...testData.validCharge, chargeName });
    await expect(chargePage.panel).toBeHidden();

    await chargePage.search(chargeName.substring(0, 10));
    expect(await chargePage.isChargeVisible(chargeName)).toBeTruthy();

    await chargePage.search('NoSuchChargeXYZ123');
    expect(await chargePage.getRowCount()).toBe(0);

    await chargePage.clearSearch();
    expect(await chargePage.getRowCount()).toBeGreaterThan(0);
  });

  test('pagination controls are disabled at the first/last page boundaries @regression @positive', async ({ chargePage, chargeScreen }) => {
    await Assertions.assertVisible(chargePage.paginationInfo);

    await chargePage.goToFirstPage();
    expect(await chargePage.isFirstPageDisabled()).toBeTruthy();
    expect(await chargePage.isPreviousPageDisabled()).toBeTruthy();

    await chargePage.goToLastPage();
    expect(await chargePage.isLastPageDisabled()).toBeTruthy();
    expect(await chargePage.isNextPageDisabled()).toBeTruthy();
  });

  test('pagination record count stays accurate after adding a Charge @regression @positive @destructive', async ({ chargePage, chargeScreen }) => {
    const countBefore = await chargePage.getPaginationText();

    const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
    await chargePage.createCharge({ ...testData.validCharge, chargeName });
    await expect(chargePage.panel).toBeHidden();

    const countAfter = await chargePage.getPaginationText();
    expect(countAfter).not.toBe(countBefore);
  });

  test('pagination record count stays accurate after deleting a Charge @regression @positive @destructive', async ({ chargePage, chargeScreen }) => {
    const chargeName = `${testData.validCharge.chargeName} ${faker.string.alphanumeric(6)}`;
    await chargePage.createCharge({ ...testData.validCharge, chargeName });
    await expect(chargePage.panel).toBeHidden();

    const countBefore = await chargePage.getPaginationText();
    await chargePage.deleteCharge(chargeName, { confirm: true });
    const countAfter = await chargePage.getPaginationText();

    expect(countAfter).not.toBe(countBefore);
  });

  test('sorting the Charge column reorders the grid rows @regression @positive', async ({ chargePage, chargeScreen }) => {
    const before = await chargePage.getColumnValues(0);
    await chargePage.sortByColumn('Charge');
    const afterAsc = await chargePage.getColumnValues(0);

    expect(afterAsc).toEqual([...before].sort((a, b) => a.localeCompare(b)));

    await chargePage.sortByColumn('Charge');
    const afterDesc = await chargePage.getColumnValues(0);

    expect(afterDesc).toEqual([...before].sort((a, b) => b.localeCompare(a)));
  });

  test('Export to PDF generates a downloadable file with grid data @regression @positive', async ({ chargePage, chargeScreen }) => {
    const [download] = await Promise.all([
      chargePage.page.waitForEvent('download'),
      chargePage.click(chargePage.exportPdfButton),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('Export to Excel generates a downloadable file with grid data @regression @positive', async ({ chargePage, chargeScreen }) => {
    const [download] = await Promise.all([
      chargePage.page.waitForEvent('download'),
      chargePage.click(chargePage.exportExcelButton),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls|csv)$/i);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });
});
