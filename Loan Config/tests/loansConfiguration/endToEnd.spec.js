const { test, expect } = require('../../fixtures/pageFixtures');
const { buildLoanCreationPayload } = require('../../constants/testData');

// These tests persist data via Submit / Delete against a live-like app and must stay
// tagged @destructive so they are excluded from routine runs (see tags in README).

test.describe('Loans Configuration - End to End @e2e @destructive', () => {
  test('creating a new Loan Configuration with valid data across all tabs adds a row to the grid @positive', async ({
    authenticatedPage: page,
    loansConfigurationListPage,
    wizardPage,
  }) => {
    const payload = buildLoanCreationPayload();

    await loansConfigurationListPage.clickNew();
    await wizardPage.fillLoanCreation(payload);
    await wizardPage.clickNext();

    await wizardPage.fillLoanConfiguration({
      contactType: 'Individual',
      interestMode: 'Fixed',
      interestRateMin: 8,
      interestRateMax: 14,
      loanAmountNotApplicable: true,
      tenureNotApplicable: true,
    });
    await wizardPage.addConfigurationRow();
    await wizardPage.clickNext();

    await wizardPage.fillInstallmentDueDate({ installmentTypeConfig: 'EMI', loanInstallmentMode: 'Equated Instalments', dueDateOption: 'fixedDate' });
    await wizardPage.clickNext();

    await wizardPage.fillPenalInterest({ fixedPercent: 2, gracePeriodDays: 3 });
    await wizardPage.clickNext();

    await wizardPage.submitWizard();

    await expect(loansConfigurationListPage.pageTitle).toBeVisible();
    await loansConfigurationListPage.search(payload.loanName);
    await expect(loansConfigurationListPage.rowByLoanName(payload.loanName)).toBeVisible();
  });

  test('editing an existing Loan updates the record without increasing row count @positive', async ({
    authenticatedPage: page,
    loansConfigurationListPage,
    wizardPage,
  }) => {
    const original = buildLoanCreationPayload();

    await loansConfigurationListPage.clickNew();
    await wizardPage.fillLoanCreation(original);
    await wizardPage.clickNext();
    await wizardPage.fillLoanConfiguration({
      interestMode: 'Fixed',
      interestRateMin: 8,
      interestRateMax: 14,
      loanAmountNotApplicable: true,
      tenureNotApplicable: true,
    });
    await wizardPage.clickNext();
    await wizardPage.fillInstallmentDueDate({ installmentTypeConfig: 'EMI', loanInstallmentMode: 'Equated Instalments', dueDateOption: 'fixedDate' });
    await wizardPage.clickNext();
    await wizardPage.fillPenalInterest({ fixedPercent: 2, gracePeriodDays: 3 });
    await wizardPage.clickNext();
    await wizardPage.submitWizard();

    const countBeforeEdit = await loansConfigurationListPage.getRowCount();

    await loansConfigurationListPage.search(original.loanName);
    await loansConfigurationListPage.openEdit(original.loanName);
    const updatedName = `${original.loanName}-Updated`;
    await wizardPage.loanNameInput.fill(updatedName);
    await wizardPage.clickNext();
    await wizardPage.clickNext();
    await wizardPage.clickNext();
    await wizardPage.clickNext();
    await wizardPage.submitWizard();

    await loansConfigurationListPage.clearSearch();
    const countAfterEdit = await loansConfigurationListPage.getRowCount();
    expect(countAfterEdit).toBe(countBeforeEdit);

    await loansConfigurationListPage.search(updatedName);
    await expect(loansConfigurationListPage.rowByLoanName(updatedName)).toBeVisible();
  });

  test('deleting a Loan prompts for confirmation and removes the row @positive', async ({
    authenticatedPage: page,
    loansConfigurationListPage,
    wizardPage,
  }) => {
    const payload = buildLoanCreationPayload();

    await loansConfigurationListPage.clickNew();
    await wizardPage.fillLoanCreation(payload);
    await wizardPage.clickNext();
    await wizardPage.fillLoanConfiguration({
      interestMode: 'Fixed',
      interestRateMin: 8,
      interestRateMax: 14,
      loanAmountNotApplicable: true,
      tenureNotApplicable: true,
    });
    await wizardPage.clickNext();
    await wizardPage.fillInstallmentDueDate({ installmentTypeConfig: 'EMI', loanInstallmentMode: 'Equated Instalments', dueDateOption: 'fixedDate' });
    await wizardPage.clickNext();
    await wizardPage.fillPenalInterest({ fixedPercent: 2, gracePeriodDays: 3 });
    await wizardPage.clickNext();
    await wizardPage.submitWizard();

    await loansConfigurationListPage.search(payload.loanName);
    await loansConfigurationListPage.deleteRow(payload.loanName);
    await loansConfigurationListPage.confirmDelete();

    await expect(loansConfigurationListPage.rowByLoanName(payload.loanName)).toHaveCount(0);
  });

  test('cancelling delete keeps the row intact @negative', async ({
    authenticatedPage: page,
    loansConfigurationListPage,
  }) => {
    const rowCountBefore = await loansConfigurationListPage.getRowCount();
    const firstRowText = await loansConfigurationListPage.gridRows.first().textContent();

    await loansConfigurationListPage.gridRows.first().locator('button[aria-label*="delete" i], .fa-trash, .delete-icon').first().click();
    await loansConfigurationListPage.cancelDelete();

    await expect(loansConfigurationListPage.gridRows).toHaveCount(rowCountBefore);
    expect(await loansConfigurationListPage.gridRows.first().textContent()).toBe(firstRowText);
  });

  test('submitting the wizard with an incomplete tab is rejected @negative', async ({
    authenticatedPage: page,
    loansConfigurationListPage,
    wizardPage,
  }) => {
    await loansConfigurationListPage.clickNew();
    await wizardPage.fillLoanCreation(buildLoanCreationPayload());
    // Jump directly to the final tab without completing the middle tabs.
    await wizardPage.goToTab('Identification Documents');
    await wizardPage.submitWizard();
    await expect(wizardPage.page.getByText(/required|incomplete|mandatory/i).first()).toBeVisible();
  });
});
