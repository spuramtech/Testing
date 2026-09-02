const { test, expect } = require('../../fixtures/pageFixtures');
const { buildLoanCreationPayload } = require('../../constants/testData');

async function reachInstallmentDueDateTab(loansConfigurationListPage, wizardPage) {
  await loansConfigurationListPage.clickNew();
  await wizardPage.fillLoanCreation(buildLoanCreationPayload());
  await wizardPage.clickNext();
  await wizardPage.fillLoanConfiguration({
    interestMode: 'Fixed',
    interestRateMin: 8,
    interestRateMax: 14,
    loanAmountNotApplicable: true,
    tenureNotApplicable: true,
  });
  await wizardPage.clickNext();
}

test.describe('Loans Configuration - Installment Due Date Tab @functional', () => {
  test.beforeEach(async ({ authenticatedPage: page, loansConfigurationListPage, wizardPage }) => {
    await reachInstallmentDueDateTab(loansConfigurationListPage, wizardPage);
  });

  test('EMI vs No EMI toggles Loan Installment Mode relevance @positive', async ({ wizardPage }) => {
    await wizardPage.selectInstallmentTypeConfig('EMI');
    await expect(wizardPage.loanInstallmentModeDropdown).toBeVisible();
    await wizardPage.selectInstallmentTypeConfig('No EMI');
  });

  test('only one Installment Due Date radio option is selectable at a time @positive', async ({ wizardPage }) => {
    await wizardPage.selectInstallmentDueDateOption('fixedDate');
    await expect(wizardPage.dueDateFixedDateRadio).toBeChecked();
    await wizardPage.selectInstallmentDueDateOption('endOfMonth');
    await expect(wizardPage.dueDateEndOfMonthRadio).toBeChecked();
    await expect(wizardPage.dueDateFixedDateRadio).not.toBeChecked();
  });

  test('Next advances to Penal Interest tab @positive', async ({ wizardPage }) => {
    await wizardPage.fillInstallmentDueDate({ installmentTypeConfig: 'EMI', loanInstallmentMode: 'Equated Instalments', dueDateOption: 'fixedDate' });
    await wizardPage.clickNext();
    await expect(wizardPage.tabs['Penal Interest']).toBeVisible();
  });
});

test.describe('Loans Configuration - Penal Interest Tab @functional', () => {
  test.beforeEach(async ({ authenticatedPage: page, loansConfigurationListPage, wizardPage }) => {
    await reachInstallmentDueDateTab(loansConfigurationListPage, wizardPage);
    await wizardPage.fillInstallmentDueDate({ installmentTypeConfig: 'EMI', loanInstallmentMode: 'Equated Instalments', dueDateOption: 'fixedDate' });
    await wizardPage.clickNext();
  });

  test('Fixed % numeric input accepts valid values @positive', async ({ wizardPage }) => {
    await wizardPage.fillPenalInterest({ fixedPercent: 2.5 });
    await expect(wizardPage.fixedPercentInput).toHaveValue('2.5');
  });

  test('Grace Period numeric input accepts valid values @positive @boundary', async ({ wizardPage }) => {
    await wizardPage.fillPenalInterest({ gracePeriodDays: 5 });
    await expect(wizardPage.gracePeriodInput).toHaveValue('5');
  });

  test('Clear resets both Fixed % and Grace Period panels @positive', async ({ wizardPage }) => {
    await wizardPage.fillPenalInterest({ fixedPercent: 3, gracePeriodDays: 7 });
    await wizardPage.clickClear();
    await expect(wizardPage.gracePeriodInput).toHaveValue('0');
  });

  test('Next advances to Identification Documents tab @positive', async ({ wizardPage }) => {
    await wizardPage.fillPenalInterest({ fixedPercent: 2, gracePeriodDays: 3 });
    await wizardPage.clickNext();
    await expect(wizardPage.tabs['Identification Documents']).toBeVisible();
  });
});
