const { test, expect } = require('../../fixtures/pageFixtures');

test.describe('Charge Configuration - Charge Amount Panel: Not Dependent on Loan Range @functional @regression', () => {
  test.beforeEach(async ({ authenticatedPage, chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectLoanType('Personal Loan');
    await chargeConfigurationPage.selectLoanName('Personal Loan');
    const count = await chargeConfigurationPage.getConfiguredChargesCount();
    test.skip(count === 0, 'No pre-configured Personal Loan charge available to open via Config');
    await chargeConfigurationPage.openConfigForRow(0);
    await chargeConfigurationPage.selectNotDependentOnRange();
  });

  test('Not Dependent mode reveals Charge Type and Minimum/Maximum Charge Amount fields @positive', async ({ chargeConfigurationPage }) => {
    await expect(chargeConfigurationPage.chargeTypeFixedRadio).toBeVisible();
    await expect(chargeConfigurationPage.chargeTypePercentageRadio).toBeVisible();

    // Dependent-only fields must not be visible in this mode.
    await expect(chargeConfigurationPage.minLoanValueInput).not.toBeVisible();
    await expect(chargeConfigurationPage.onValueRadio).not.toBeVisible();
  });

  test('Fixed and Percentage Charge Type are mutually exclusive @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectChargeTypeFixed();
    await expect(chargeConfigurationPage.chargeTypeFixedRadio).toBeChecked();
    await expect(chargeConfigurationPage.chargeTypePercentageRadio).not.toBeChecked();

    await chargeConfigurationPage.selectChargeTypePercentage();
    await expect(chargeConfigurationPage.chargeTypePercentageRadio).toBeChecked();
    await expect(chargeConfigurationPage.chargeTypeFixedRadio).not.toBeChecked();
  });

  test('selecting Percentage reveals the percentage input @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectChargeTypePercentage();
    await expect(chargeConfigurationPage.chargeTypePercentageInput).toBeVisible();
    await chargeConfigurationPage.chargeTypePercentageInput.fill('2.5');
    await expect(chargeConfigurationPage.chargeTypePercentageInput).toHaveValue('2.5');
  });

  test('Minimum Charge Amount and Maximum Charge Amount accept numeric input @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectChargeTypePercentage();
    await chargeConfigurationPage.fillNotDependentAmounts({ percentage: 1, minimumChargeAmount: 100, maximumChargeAmount: 5000 });

    // appmycurrencyformatter renders the value with thousands separators once it exceeds 999.
    await expect(chargeConfigurationPage.minimumChargeAmountInput).toHaveValue('100');
    await expect(chargeConfigurationPage.maximumChargeAmountInput).toHaveValue('5,000');
  });

  test('non-numeric characters are rejected by the amount fields @negative', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectChargeTypePercentage();
    // appnumbersonly filters keystrokes as they're typed - Locator.fill() sets the value
    // directly and skips those keydown handlers, so this must type character-by-character
    // to exercise the real validation path.
    await chargeConfigurationPage.minimumChargeAmountInput.pressSequentially('abc', { delay: 50 });
    const value = await chargeConfigurationPage.minimumChargeAmountInput.inputValue();
    expect(value).not.toContain('abc');
  });
});
