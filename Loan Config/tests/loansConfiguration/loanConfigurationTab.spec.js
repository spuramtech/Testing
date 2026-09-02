const { test, expect } = require('../../fixtures/pageFixtures');
const { buildLoanCreationPayload } = require('../../constants/testData');

async function reachLoanConfigurationTab(page, loansConfigurationListPage, wizardPage) {
  await loansConfigurationListPage.clickNew();
  await wizardPage.fillLoanCreation(buildLoanCreationPayload());
  await wizardPage.clickNext();
}

test.describe('Loans Configuration - Loan Configuration Tab @functional', () => {
  test.beforeEach(async ({ authenticatedPage: page, loansConfigurationListPage, wizardPage }) => {
    await reachLoanConfigurationTab(page, loansConfigurationListPage, wizardPage);
  });

  test('Individual vs Business Entity toggles Applicant Type field @positive', async ({ wizardPage }) => {
    await wizardPage.selectContactType('Business Entity');
    await expect(wizardPage.applicantTypeInput).toBeEnabled();
    await wizardPage.selectContactType('Individual');
    await expect(wizardPage.applicantTypeInput).toBeVisible();
  });

  test('Fixed vs Floating Interest Mode toggles associated fields @positive', async ({ wizardPage }) => {
    await wizardPage.selectInterestMode('Floating');
    await expect(wizardPage.floatingInterestRadio).toBeChecked();
    await wizardPage.selectInterestMode('Fixed');
    await expect(wizardPage.fixedInterestRadio).toBeChecked();
  });

  test('"Not Applicable" disables Loan Amount inputs when checked @positive @boundary', async ({ wizardPage }) => {
    await wizardPage.setLoanAmountNotApplicable(true);
    await expect(wizardPage.minLoanAmountInput).toBeDisabled();
    await expect(wizardPage.maxLoanAmountInput).toBeDisabled();
    await wizardPage.setLoanAmountNotApplicable(false);
    await expect(wizardPage.minLoanAmountInput).toBeEnabled();
  });

  test('"Not Applicable" disables Tenure inputs when checked @positive @boundary', async ({ wizardPage }) => {
    await wizardPage.setTenureNotApplicable(true);
    await expect(wizardPage.tenureFromInput).toBeDisabled();
    await expect(wizardPage.tenureToInput).toBeDisabled();
  });

  // Confirmed against the live app: boundary violations are rejected silently (no visible error
  // text) - the Add button simply does not append a new configuration row - rather than showing
  // an inline/toast message.
  test('Interest Rate Minimum greater than Maximum is rejected @negative @boundary', async ({ wizardPage }) => {
    const before = await wizardPage.getConfigurationRowCount();
    await wizardPage.fillLoanConfiguration({ interestRateType: 'Flat', interestRateMin: 20, interestRateMax: 10 });
    await wizardPage.addConfigurationRow();
    await expect.poll(() => wizardPage.getConfigurationRowCount()).toBe(before);
  });

  test('Loan Amount Minimum greater than Maximum is rejected @negative @boundary', async ({ wizardPage }) => {
    const before = await wizardPage.getConfigurationRowCount();
    await wizardPage.fillLoanConfiguration({
      loanAmountNotApplicable: false,
      minLoanAmount: 500000,
      maxLoanAmount: 100000,
    });
    await wizardPage.addConfigurationRow();
    await expect.poll(() => wizardPage.getConfigurationRowCount()).toBe(before);
  });

  test('Tenure From greater than To is rejected @negative @boundary', async ({ wizardPage }) => {
    const before = await wizardPage.getConfigurationRowCount();
    await wizardPage.fillLoanConfiguration({ tenureNotApplicable: false, tenureFrom: 36, tenureTo: 12 });
    await wizardPage.addConfigurationRow();
    await expect.poll(() => wizardPage.getConfigurationRowCount()).toBe(before);
  });

  test('Add button appends a new row to the configuration grid @positive', async ({ wizardPage }) => {
    const before = await wizardPage.getConfigurationRowCount();
    await wizardPage.fillLoanConfiguration({
      contactType: 'Individual',
      interestMode: 'Fixed',
      interestRateType: 'Flat',
      interestRateMin: 8,
      interestRateMax: 14,
      loanAmountNotApplicable: true,
      tenureNotApplicable: true,
    });
    await wizardPage.addConfigurationRow();
    await expect
      .poll(() => wizardPage.getConfigurationRowCount())
      .toBe(before + 1);
  });

  test('multiple configuration rows can be added @positive', async ({ wizardPage }) => {
    let expectedCount = 0;
    for (const rate of [8, 10]) {
      await wizardPage.fillLoanConfiguration({
        interestMode: 'Fixed',
        interestRateType: 'Flat',
        interestRateMin: rate,
        interestRateMax: rate + 4,
        loanAmountNotApplicable: true,
        tenureNotApplicable: true,
      });
      await wizardPage.addConfigurationRow();
      expectedCount += 1;
      await expect.poll(() => wizardPage.getConfigurationRowCount()).toBe(expectedCount);
    }
    await expect
      .poll(() => wizardPage.getConfigurationRowCount())
      .toBeGreaterThanOrEqual(2);
  });

  test('Clear resets Loan Configuration tab fields @positive', async ({ wizardPage }) => {
    await wizardPage.fillLoanConfiguration({ interestRateType: 'Flat', interestRateMin: 9, interestRateMax: 15 });
    await wizardPage.clickClear();
    await expect(wizardPage.interestRateMinInput).toHaveValue('');
  });

  test('Next advances to Installment Due Date tab @positive', async ({ wizardPage }) => {
    await wizardPage.fillLoanConfiguration({
      interestMode: 'Fixed',
      interestRateType: 'Flat',
      interestRateMin: 8,
      interestRateMax: 14,
      loanAmountNotApplicable: true,
      tenureNotApplicable: true,
    });
    await wizardPage.clickNext();
    await expect(wizardPage.tabs['Installment Due Date']).toBeVisible();
  });
});
