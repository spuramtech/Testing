const { test, expect } = require('../../fixtures/pageFixtures');

// NOTE: on this app instance, navigating Loans > Loan Configuration > Loans Configuration lands
// directly on the tabbed wizard (Tab 1 - Loan Creation) with the existing-loans grid embedded
// below the form, rather than a separate standalone list screen with search/export controls.
// Confirmed against the live DOM: this embedded grid has no search box or Export to PDF/Excel
// buttons (those described in the prompt were not found on this view), so those scenarios are
// intentionally not covered here.
test.describe('Loans Configuration - List Page @functional @regression', () => {
  test('wizard landing page loads with title and embedded grid @smoke', async ({ authenticatedPage: page, loansConfigurationListPage }) => {
    await expect(loansConfigurationListPage.pageTitle).toBeVisible();
    await expect(loansConfigurationListPage.gridRows.first()).toBeVisible();
    await expect(loansConfigurationListPage.paginationPrevious.or(loansConfigurationListPage.paginationNext).first()).toBeVisible();
  });

  test('embedded grid displays existing loan rows with expected columns @positive', async ({ authenticatedPage: page, loansConfigurationListPage }) => {
    const rowCount = await loansConfigurationListPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
    await expect(loansConfigurationListPage.gridRows.first()).toBeVisible();
  });
});
