const { test, expect } = require('../../fixtures/pageFixtures');

// Clicks "Add Charge" and "Submit", which persists a new Charge Amount record against this
// live production-like app. Excluded from routine runs - execute explicitly via
// `npm run test:destructive`.
test.describe('Charge Configuration - End to End @destructive @regression', () => {
  test('configuring a Not-Dependent charge amount and submitting adds it to the master grid', async ({ authenticatedPage, chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectLoanType('Personal Loan');
    await chargeConfigurationPage.selectLoanName('Personal Loan');

    const count = await chargeConfigurationPage.getConfiguredChargesCount();
    test.skip(count === 0, 'No pre-configured Personal Loan charge available to open via Config');
    await chargeConfigurationPage.openConfigForRow(0);

    await chargeConfigurationPage.selectNotDependentOnRange();
    await chargeConfigurationPage.selectApplicantType('Regular/General');
    await chargeConfigurationPage.selectLoanPayIn('Monthly');
    await chargeConfigurationPage.selectChargeTypePercentage();
    await chargeConfigurationPage.fillNotDependentAmounts({ percentage: 1, minimumChargeAmount: 100, maximumChargeAmount: 5000 });
    await chargeConfigurationPage.selectGstExclude('18');

    const before = await chargeConfigurationPage.getMasterGridCount();
    await chargeConfigurationPage.clickAddCharge();

    await expect.poll(async () => chargeConfigurationPage.getMasterGridCount()).toBe(before + 1);
    await expect(chargeConfigurationPage.masterGridRows.last()).toContainText('Personal Loan');

    await chargeConfigurationPage.clickSubmit();
  });

  test('re-opening Config for an already-configured charge and re-submitting updates it in place, not as a duplicate', async ({ authenticatedPage, chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectLoanType('Personal Loan');
    await chargeConfigurationPage.selectLoanName('Personal Loan');

    const configuredBefore = await chargeConfigurationPage.getConfiguredChargesCount();
    test.skip(configuredBefore === 0, 'No pre-configured Personal Loan charge available to open via Config');
    await chargeConfigurationPage.openConfigForRow(0);

    await chargeConfigurationPage.selectNotDependentOnRange();
    await chargeConfigurationPage.selectApplicantType('Regular/General');
    await chargeConfigurationPage.selectLoanPayIn('Monthly');
    await chargeConfigurationPage.selectChargeTypePercentage();
    await chargeConfigurationPage.fillNotDependentAmounts({ percentage: 2, minimumChargeAmount: 50, maximumChargeAmount: 2000 });
    await chargeConfigurationPage.selectGstExclude('12');

    await chargeConfigurationPage.clickAddCharge();
    await expect.poll(async () => chargeConfigurationPage.getMasterGridCount()).toBeGreaterThan(0);
    await chargeConfigurationPage.clickSubmit();

    // Re-selecting the same Loan Type/Name must still show exactly the same number of
    // configured-charge rows as before this edit - the record was updated, not duplicated.
    await chargeConfigurationPage.selectLoanType('Personal Loan');
    await chargeConfigurationPage.selectLoanName('Personal Loan');
    await expect.poll(async () => chargeConfigurationPage.getConfiguredChargesCount()).toBe(configuredBefore);
  });
});
