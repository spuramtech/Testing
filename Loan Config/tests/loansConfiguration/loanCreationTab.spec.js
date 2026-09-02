const { test, expect } = require('../../fixtures/pageFixtures');
const { buildLoanCreationPayload, LOAN_TYPES } = require('../../constants/testData');

test.describe('Loans Configuration - Loan Creation Tab @functional', () => {
  test.beforeEach(async ({ authenticatedPage: page, loansConfigurationListPage }) => {
    await loansConfigurationListPage.clickNew();
  });

  test('New button opens an empty Loan Creation tab @smoke', async ({ wizardPage }) => {
    await expect(wizardPage.loanNameInput).toHaveValue('');
    await expect(wizardPage.loanCodeInput).toHaveValue('');
  });

  test('Loan Type dropdown exposes the full predefined option list', async ({ wizardPage }) => {
    const optionTexts = await wizardPage.loanTypeDropdown.locator('option').allTextContents();
    for (const type of LOAN_TYPES) {
      expect(optionTexts.map((t) => t.trim())).toContain(type);
    }
  });

  test('blank mandatory fields block progression to next tab @negative @validation', async ({ wizardPage }) => {
    await wizardPage.clickNext();
    // Confirmed against the live app: submitting blank mandatory fields silently blocks
    // navigation (no visible inline/toast error text) rather than showing an error message -
    // the wizard simply stays on Loan Creation instead of advancing.
    await expect(wizardPage.loanNameInput).toBeVisible();
    await expect(wizardPage.applicantTypeInput).not.toBeVisible();
  });

  test('valid mandatory fields allow progression to Loan Configuration tab @positive', async ({ wizardPage }) => {
    const payload = buildLoanCreationPayload();
    await wizardPage.fillLoanCreation(payload);
    await wizardPage.clickNext();
    await expect(wizardPage.tabs['Loan Configuration']).toBeVisible();
  });

  test('duplicate Loan Name/Loan Code is rejected @negative @duplicate', async ({ wizardPage }) => {
    // Confirmed against the live app: like blank-field validation, a duplicate Loan Name/Code
    // blocks navigation silently (no visible error text) rather than showing a message.
    const payload = buildLoanCreationPayload({ loanName: 'GOLD', loanCode: 'CSBLG00001' });
    await wizardPage.fillLoanCreation(payload);
    await wizardPage.clickNext();
    await expect(wizardPage.loanNameInput).toBeVisible();
    await expect(wizardPage.tabs['Loan Configuration']).not.toHaveAttribute('aria-selected', 'true');
  });

  test('Clear button resets Loan Creation fields @positive', async ({ wizardPage }) => {
    await wizardPage.fillLoanCreation(buildLoanCreationPayload());
    await wizardPage.clickClear();
    await expect(wizardPage.loanNameInput).toHaveValue('');
    await expect(wizardPage.loanCodeInput).toHaveValue('');
  });

  test('SQL injection payload in Loan Name is safely handled @security @negative', async ({ wizardPage }) => {
    const payload = buildLoanCreationPayload({ loanName: "Loan'; DROP TABLE loans; --" });
    await wizardPage.fillLoanCreation(payload);
    await wizardPage.clickNext();
    await expect(wizardPage.page.getByText(/error|exception|500/i)).toHaveCount(0);
  });

  test('XSS payload in Loan Code is not executed @security @negative', async ({ wizardPage }) => {
    const payload = buildLoanCreationPayload({ loanCode: '<script>window.__xss=true</script>' });
    await wizardPage.fillLoanCreation(payload);
    await wizardPage.clickNext();
    const xssTriggered = await wizardPage.page.evaluate(() => window.__xss === true);
    expect(xssTriggered).toBe(false);
  });
});
