const { test, expect } = require('../../fixtures/pageFixtures');

// These tests open the Charge Amount panel for an already-configured charge (via "Config")
// and only manipulate the in-panel range grid ("Add To Grid" / "Clear Grid"), never Submit,
// so the underlying Charge Configuration record is left unchanged.
test.describe('Charge Configuration - Charge Amount Panel: Dependent on Loan Range @functional @regression', () => {
  test.beforeEach(async ({ authenticatedPage, chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectLoanType('Personal Loan');
    await chargeConfigurationPage.selectLoanName('Personal Loan');
    const count = await chargeConfigurationPage.getConfiguredChargesCount();
    test.skip(count === 0, 'No pre-configured Personal Loan charge available to open via Config');
    await chargeConfigurationPage.openConfigForRow(0);
  });

  test('Charge Amount panel heading reflects the selected Loan Type-Loan Name-Charge Name @positive', async ({ chargeConfigurationPage }) => {
    await expect(chargeConfigurationPage.chargeAmountHeading).toContainText('Personal Loan');
  });

  test('Dependent and Not Dependent toggles are mutually exclusive @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await expect(chargeConfigurationPage.dependentOnRangeRadio).toBeChecked();
    await expect(chargeConfigurationPage.notDependentOnRangeRadio).not.toBeChecked();

    await chargeConfigurationPage.selectNotDependentOnRange();
    await expect(chargeConfigurationPage.notDependentOnRangeRadio).toBeChecked();
    await expect(chargeConfigurationPage.dependentOnRangeRadio).not.toBeChecked();
  });

  test('Dependent mode reveals On Value / On Tenure and the Range/Charge fields @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await expect(chargeConfigurationPage.onValueRadio).toBeVisible();
    await expect(chargeConfigurationPage.onTenureRadio).toBeVisible();
    await expect(chargeConfigurationPage.minLoanValueInput).toBeVisible();
    await expect(chargeConfigurationPage.maxLoanValueInput).toBeVisible();
    await expect(chargeConfigurationPage.rangePercentageInput).toBeVisible();
    await expect(chargeConfigurationPage.minChargeInput).toBeVisible();
    await expect(chargeConfigurationPage.maxChargeInput).toBeVisible();

    // Not-Dependent-only fields must not be visible in this mode.
    await expect(chargeConfigurationPage.chargeTypeFixedRadio).not.toBeVisible();
  });

  test('On Value and On Tenure are mutually exclusive @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await chargeConfigurationPage.selectOnValue();
    await expect(chargeConfigurationPage.onValueRadio).toBeChecked();

    await chargeConfigurationPage.selectOnTenure();
    await expect(chargeConfigurationPage.onTenureRadio).toBeChecked();
    await expect(chargeConfigurationPage.onValueRadio).not.toBeChecked();
  });

  test('Add To Grid appends a row with the entered range/charge values @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await chargeConfigurationPage.selectApplicantType('Regular/General');
    await chargeConfigurationPage.selectLoanPayIn('Monthly');
    await chargeConfigurationPage.selectOnValue();
    const before = await chargeConfigurationPage.getRangeGridCount();

    await chargeConfigurationPage.fillRange({
      minLoanValue: 10000,
      maxLoanValue: 50000,
      percentage: 2,
      minCharge: 100,
      maxCharge: 1000,
    });
    await chargeConfigurationPage.clickAddToGrid();

    await expect
      .poll(async () => chargeConfigurationPage.getRangeGridCount())
      .toBe(before + 1);
    await expect(chargeConfigurationPage.rangeGridRows.last()).toContainText('10,000');
  });

  test('Add To Grid rejects an empty range/charge row @negative', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await chargeConfigurationPage.selectOnValue();
    await chargeConfigurationPage.minLoanValueInput.fill('');
    await chargeConfigurationPage.maxLoanValueInput.fill('');

    const before = await chargeConfigurationPage.getRangeGridCount();
    await chargeConfigurationPage.clickAddToGrid();
    const after = await chargeConfigurationPage.getRangeGridCount();

    expect(after).toBe(before);
  });

  test('Clear Grid empties the added range rows @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await chargeConfigurationPage.selectApplicantType('Regular/General');
    await chargeConfigurationPage.selectLoanPayIn('Monthly');
    await chargeConfigurationPage.selectOnValue();
    await chargeConfigurationPage.fillRange({ minLoanValue: 1000, maxLoanValue: 2000, percentage: 1, minCharge: 10, maxCharge: 100 });
    await chargeConfigurationPage.clickAddToGrid();
    await expect.poll(async () => chargeConfigurationPage.getRangeGridCount()).toBeGreaterThan(0);

    await chargeConfigurationPage.clickClearGrid();
    await expect.poll(async () => chargeConfigurationPage.getRangeGridCount()).toBe(0);
  });

  test('Min Loan Value greater than Max Loan Value is flagged by validation @negative @boundary', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectDependentOnRange();
    await chargeConfigurationPage.selectApplicantType('Regular/General');
    await chargeConfigurationPage.selectLoanPayIn('Monthly');
    await chargeConfigurationPage.selectOnValue();
    const before = await chargeConfigurationPage.getRangeGridCount();

    await chargeConfigurationPage.fillRange({ minLoanValue: 90000, maxLoanValue: 10000, percentage: 2, minCharge: 100, maxCharge: 50 });
    await chargeConfigurationPage.clickAddToGrid();

    // Either the app blocks the invalid row (count unchanged) or shows a validation message.
    const after = await chargeConfigurationPage.getRangeGridCount();
    const hasValidationMessage = await chargeConfigurationPage.page
      .locator('.invalid-feedback:visible, .invalid-feedback-cst:visible')
      .first()
      .isVisible()
      .catch(() => false);
    expect(after === before || hasValidationMessage).toBeTruthy();
  });
});
