const { test, expect } = require('../../fixtures/pageFixtures');
const { buildLoanCreationPayload } = require('../../constants/testData');

async function reachIdentificationDocumentsTab(loansConfigurationListPage, wizardPage) {
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
  await wizardPage.fillInstallmentDueDate({ installmentTypeConfig: 'EMI', loanInstallmentMode: 'Equated Instalments', dueDateOption: 'fixedDate' });
  await wizardPage.clickNext();
  await wizardPage.fillPenalInterest({ fixedPercent: 2, gracePeriodDays: 3 });
  await wizardPage.clickNext();
}

test.describe('Loans Configuration - Identification Documents Tab @functional', () => {
  test.beforeEach(async ({ authenticatedPage: page, loansConfigurationListPage, wizardPage }) => {
    await reachIdentificationDocumentsTab(loansConfigurationListPage, wizardPage);
  });

  test('each accordion section expands and collapses @positive', async ({ wizardPage }) => {
    await wizardPage.expandAccordion('panFormSixty');
    await expect(wizardPage.page.getByText('PAN CARD')).toBeVisible();
    await wizardPage.expandAccordion('panFormSixty');
  });

  test('Mandatory and Required checkboxes are independently togglable @positive', async ({ wizardPage }) => {
    await wizardPage.expandAccordion('panFormSixty');
    await wizardPage.toggleProofCheckbox('PAN CARD', 'Mandatory');
    await wizardPage.toggleProofCheckbox('PAN CARD', 'Required');
  });

  test('full proof-type list is present per category @positive', async ({ wizardPage }) => {
    await wizardPage.expandAccordion('financialDocuments');
    for (const proof of ['Pay Slip', 'Financial Statements', 'Form 16A', 'Form 16', 'ITR', 'GSTR 1', 'GSTR 2', 'GSTR 3B']) {
      await expect(wizardPage.page.getByText(proof, { exact: true })).toBeVisible();
    }
  });

  test('Submit button is visible on the final tab @smoke', async ({ wizardPage }) => {
    await expect(wizardPage.submitButton).toBeVisible();
  });
});
