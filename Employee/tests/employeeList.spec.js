const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

test.describe('@regression @functional Employees List', () => {
  test.beforeEach(async ({ page, employeeFormPage, employeeListPage }) => {
    await loginAsDefaultUser(page);
    // The sidebar's "Employees" link opens the Add form directly — the
    // list is only reachable via the form's "View" link.
    await employeeFormPage.open();
    await employeeFormPage.goToList();
  });

  test('@smoke loads the Employees grid with data', async ({ employeeListPage }) => {
    await expect(employeeListPage.grid).toBeVisible();
    const rowCount = await employeeListPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('@positive "New" link opens the Add Employee form', async ({ employeeListPage, page }) => {
    await employeeListPage.clickNew();
    await expect(page).toHaveURL(/ContactToEmployees(?!View)/);
  });

  test('@positive searches the grid by employee name', async ({ employeeListPage }) => {
    await employeeListPage.search('Kunal');
    await expect(employeeListPage.rows.filter({ hasText: 'Kunal' }).first()).toBeVisible();
  });

  test('@negative shows no matching rows for a non-existent search term', async ({ employeeListPage }) => {
    await employeeListPage.search('ZZZ_NON_EXISTENT_EMPLOYEE_ZZZ');
    // A no-results search still renders one Kendo "no records" row, so
    // assert on that placeholder rather than a raw row count of 0.
    await expect(employeeListPage.noRecordsRow).toBeVisible();
  });

  test('@positive pagination Next/Prev round-trips to the same page', async ({ employeeListPage }) => {
    const before = await employeeListPage.pagerInfo.textContent();
    await employeeListPage.click(employeeListPage.pagerNext);
    const after = await employeeListPage.pagerInfo.textContent();
    expect(after).not.toEqual(before);
    await employeeListPage.click(employeeListPage.pagerPrev);
    const back = await employeeListPage.pagerInfo.textContent();
    expect(back).toEqual(before);
  });

  test('@positive Edit icon opens the selected employee for editing', async ({ employeeListPage, page }) => {
    const firstRowName = await employeeListPage.rows.first().locator('td').first().textContent();
    await employeeListPage.editIconInRow(firstRowName.trim()).click();
    await expect(page).toHaveURL(/ContactToEmployees(?!View)/);
  });

  test('@negative clicking the Employee Name header does not sort or error', async ({ employeeListPage }) => {
    // Verified live: this grid's headers carry only k-filterable /
    // k-grid-draggable-header — no sort-enabling class or resulting
    // k-i-sort-asc/desc indicator — so column sorting is NOT actually
    // wired up on this grid, unlike a typical Kendo Grid. This test
    // documents that finding rather than asserting a sort that doesn't
    // happen; see the coverage checklist for the "Not covered" status.
    const before = await employeeListPage.rows.first().locator('td').first().textContent();
    await employeeListPage.click(employeeListPage.employeeNameHeader);
    await employeeListPage.page.waitForTimeout(500);
    const after = await employeeListPage.rows.first().locator('td').first().textContent();
    expect(after.trim()).toEqual(before.trim());
  });

  test('@positive column header exposes a filter affordance', async ({ employeeListPage }) => {
    // Verified live: grid headers carry Kendo's "k-filterable" class,
    // confirming column filtering is enabled — the Employees List does
    // not expose a separate filter UI beyond the toolbar search box, so
    // this asserts the underlying filterable capability is present.
    await expect(employeeListPage.employeeNameHeader).toHaveClass(/k-filterable/);
  });

  test('@positive PDF export triggers a downloadable file', async ({ employeeListPage, page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await employeeListPage.click(employeeListPage.pdfExportLink);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('@positive Excel export triggers a downloadable file', async ({ employeeListPage, page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await employeeListPage.click(employeeListPage.excelExportLink);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
  });
});
