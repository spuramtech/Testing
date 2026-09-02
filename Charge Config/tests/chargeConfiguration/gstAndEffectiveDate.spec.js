const { test, expect } = require('../../fixtures/pageFixtures');

test.describe('Charge Configuration - GST Type & Effective Date @functional @regression', () => {
  test.beforeEach(async ({ authenticatedPage, chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectLoanType('Personal Loan');
    await chargeConfigurationPage.selectLoanName('Personal Loan');
    const count = await chargeConfigurationPage.getConfiguredChargesCount();
    test.skip(count === 0, 'No pre-configured Personal Loan charge available to open via Config');
    await chargeConfigurationPage.openConfigForRow(0);
  });

  test('Include / Exclude / No GST are mutually exclusive @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectGstInclude();
    await expect(chargeConfigurationPage.gstIncludeRadio).toBeChecked();

    await chargeConfigurationPage.selectGstExclude();
    await expect(chargeConfigurationPage.gstExcludeRadio).toBeChecked();
    await expect(chargeConfigurationPage.gstIncludeRadio).not.toBeChecked();

    await chargeConfigurationPage.selectNoGst();
    await expect(chargeConfigurationPage.gstNoneRadio).toBeChecked();
    await expect(chargeConfigurationPage.gstExcludeRadio).not.toBeChecked();
  });

  test('GST % dropdown offers the expected slabs and is usable when Exclude is selected @positive', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectGstExclude();
    const options = (await chargeConfigurationPage.gstPercentageDropdown.locator('option').allTextContents())
      .map((o) => o.trim())
      .filter(Boolean);
    expect(options).toEqual(expect.arrayContaining(['Select', '5', '12', '18', '24']));

    await chargeConfigurationPage.selectGstExclude('18');
    await expect(chargeConfigurationPage.gstPercentageDropdown).toHaveValue('18');
  });

  test('This Charge is Effective From defaults to a populated date @positive', async ({ chargeConfigurationPage }) => {
    const value = await chargeConfigurationPage.setEffectiveFromDate();
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test('Effective From date field is read-only (date picker driven) @negative', async ({ chargeConfigurationPage }) => {
    await expect(chargeConfigurationPage.effectiveFromDateInput).toHaveAttribute('readonly', '');
  });
});
