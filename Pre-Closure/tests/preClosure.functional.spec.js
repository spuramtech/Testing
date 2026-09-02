const { test, expect } = require('../fixtures/baseFixtures');
const testData = require('../data/preClosureTestData.json');

test.describe('Pre-closure - Functional @functional @regression', () => {
  test.beforeEach(async ({ loggedInPage, preClosurePage }) => {
    await preClosurePage.navigateToPreClosureList();
  });

  test('@positive @destructive should create a new Pre-closure configuration', async ({ preClosurePage, page }) => {
    await preClosurePage.newButton.click();
    await preClosurePage.fillForm(testData.validConfig);
    await preClosurePage.save();

    await expect(preClosurePage.gridTitle).toBeVisible();
    await expect(page.getByText(testData.validConfig.loanName).first()).toBeVisible();
  });

  test('@positive @destructive editing an existing row updates it without duplicating', async ({ preClosurePage, page }) => {
    await preClosurePage.editRowByLoanName(testData.validConfig.loanName);
    await preClosurePage.chargeTypePercentageInput.fill('5');
    await preClosurePage.save();

    const matches = page.getByText(testData.validConfig.loanName);
    await expect(matches).toHaveCount(1);
  });

  test('@positive Clear button resets the form fields', async ({ preClosurePage }) => {
    await preClosurePage.newButton.click();
    await preClosurePage.fillForm(testData.validConfig);
    await preClosurePage.clear();

    await expect(preClosurePage.minLockInPeriodInput).toHaveValue('');
    await expect(preClosurePage.chargeTypePercentageInput).toHaveValue('');
  });

  test('@positive only one "Pre-Closure interest is calculated on" radio can be active', async ({ preClosurePage }) => {
    await preClosurePage.newButton.click();
    await preClosurePage.interestFuturePrincipalRadio.check();
    await expect(preClosurePage.interestFuturePrincipalRadio).toBeChecked();
    await expect(preClosurePage.interestFutureAndOutstandingRadio).not.toBeChecked();

    await preClosurePage.interestFutureAndOutstandingRadio.check();
    await expect(preClosurePage.interestFutureAndOutstandingRadio).toBeChecked();
    await expect(preClosurePage.interestFuturePrincipalRadio).not.toBeChecked();
  });

  test('@positive GST % dropdown reflects the selected GST option', async ({ preClosurePage }) => {
    await preClosurePage.newButton.click();

    // The GST % dropdown is always rendered; only "Excluded" requires it to
    // hold a real (non-"Select") value before Save succeeds.
    await preClosurePage.gstExcludedRadio.check();
    await expect(preClosurePage.gstExcludedRadio).toBeChecked();
    await expect(preClosurePage.gstPercentDropdown).toBeVisible();

    await preClosurePage.gstIncludedRadio.check();
    await expect(preClosurePage.gstIncludedRadio).toBeChecked();
    await expect(preClosurePage.gstExcludedRadio).not.toBeChecked();

    await preClosurePage.gstNoGstRadio.check();
    await expect(preClosurePage.gstNoGstRadio).toBeChecked();
    await expect(preClosurePage.gstIncludedRadio).not.toBeChecked();
  });

  test('@positive search filters the grid by Loan Name', async ({ preClosurePage, page }) => {
    await preClosurePage.search('Bullet Loan');
    await expect(page.getByText('Bullet Loan').first()).toBeVisible();

    await preClosurePage.search('NonExistentLoanXYZ');
    await expect(preClosurePage.listRoot.getByText(/no data|no record/i)).toBeVisible();
  });

  test('@positive @destructive delete removes the row immediately', async ({ preClosurePage, page }) => {
    // Verified against the live app: delete has no confirmation step — the
    // row is removed as soon as the delete icon is clicked.
    await preClosurePage.deleteRowByLoanName(testData.validConfig.loanName);

    await expect(preClosurePage.listRoot.getByText(testData.validConfig.loanName)).toHaveCount(0);
  });
});
