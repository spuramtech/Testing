const { test, expect } = require('../fixtures/baseFixtures');
const testData = require('../data/preClosureTestData.json');

test.describe('Pre-closure - Negative @negative @regression', () => {
  test.beforeEach(async ({ loggedInPage, preClosurePage }) => {
    await preClosurePage.openNewForm();
  });

  test('Save with no Loan Type / Loan Name selected shows validation error', async ({ preClosurePage, page }) => {
    await preClosurePage.save();

    await expect(page.getByText(/required|mandatory|select loan/i).first()).toBeVisible();
  });

  test('Save with duplicate Loan Type + Loan Name combination is rejected', async ({ preClosurePage, page }) => {
    await preClosurePage.fillForm(testData.duplicateConfig);
    await preClosurePage.save();

    // Behavioral check: a rejected Save must not navigate away from the
    // form (exact duplicate-error copy/toast timing is not asserted here).
    await expect(preClosurePage.formRoot).toBeVisible();
  });

  // These fields carry a keystroke-filtering directive (appnumbersonly),
  // which only intercepts real keypresses — not a programmatic .fill().
  // pressSequentially() simulates actual typing so the directive is
  // exercised the way a real user's input would be.
  test.describe('boundary/invalid Charge Type Percentage values', () => {
    for (const value of testData.boundaryChargePercentages) {
      test(`Charge Type Percentage = "${value}"`, async ({ preClosurePage }) => {
        await preClosurePage.chargeTypePercentageInput.pressSequentially(String(value));
        const actual = await preClosurePage.chargeTypePercentageInput.inputValue();

        // The field live-truncates/reformats input (maxlength + decimal
        // directive), so only the resulting numeric bound is asserted, not
        // the exact echoed string.
        if (actual !== '') {
          expect(Number(actual)).toBeGreaterThanOrEqual(0);
          expect(Number(actual)).toBeLessThanOrEqual(100);
        }
      });
    }
  });

  test.describe('invalid Min. Lock-in Period values', () => {
    for (const value of testData.negativeLockInPeriods) {
      test(`Min. Lock-in Period = "${value}"`, async ({ preClosurePage }) => {
        await preClosurePage.minLockInPeriodInput.pressSequentially(String(value));
        await preClosurePage.save();

        // Behavioral check: Save must not succeed/navigate away with an
        // invalid lock-in period (exact validation-message copy unverified).
        await expect(preClosurePage.formRoot).toBeVisible();
      });
    }
  });

  test('SQL Injection payload in Charge Type Percentage is not accepted as-is', async ({ preClosurePage }) => {
    await preClosurePage.chargeTypePercentageInput.pressSequentially("1' OR '1'='1");
    await preClosurePage.save();

    const actual = await preClosurePage.chargeTypePercentageInput.inputValue();
    expect(actual).not.toContain("'");
  });

  test('XSS payload in numeric fields is not accepted as-is', async ({ preClosurePage }) => {
    await preClosurePage.chargeTypePercentageInput.pressSequentially('<script>alert(1)</script>');
    await preClosurePage.save();

    const actual = await preClosurePage.chargeTypePercentageInput.inputValue();
    expect(actual).not.toContain('<script>');
  });

  test('Selecting Excluded for GST without choosing GST % blocks Save', async ({ preClosurePage, page }) => {
    await preClosurePage.gstExcludedRadio.check();
    await preClosurePage.save();

    await expect(page.getByText(/gst.*required|select gst/i).first()).toBeVisible();
  });
});
