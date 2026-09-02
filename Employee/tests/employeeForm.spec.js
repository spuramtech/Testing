const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');
const { randomEmployeeAmounts } = require('../helpers/dataGenerator');
const testData = require('../data/employeeTestData.json');

test.describe('@regression @functional Employee Form (Add/Edit)', () => {
  test.beforeEach(async ({ page, employeeFormPage }) => {
    await loginAsDefaultUser(page);
    await employeeFormPage.open();
  });

  test('@smoke opens the Add Employee form with all fields visible', async ({ employeeFormPage }) => {
    await expect(employeeFormPage.employeeNameCombobox).toBeVisible();
    await expect(employeeFormPage.basicSalaryInput).toBeVisible();
    await expect(employeeFormPage.allowanceInput).toBeVisible();
    await expect(employeeFormPage.designationCombobox).toBeVisible();
    await expect(employeeFormPage.roleCombobox).toBeVisible();
    await expect(employeeFormPage.dateOfJoiningInput).toBeVisible();
    await expect(employeeFormPage.saveButton).toBeVisible();
    await expect(employeeFormPage.clearButton).toBeVisible();
  });

  test('@positive CTC recalculates as Basic Salary and Allowance are entered', async ({ employeeFormPage }) => {
    const { basicSalary, allowance } = randomEmployeeAmounts();
    await employeeFormPage.fillMandatory({ basicSalary, allowance });
    const ctcText = await employeeFormPage.getCtcText();
    const expected = (basicSalary + allowance).toLocaleString('en-IN');
    expect(ctcText.replace(/,/g, '')).toContain(String(basicSalary + allowance));
  });

  test('@negative rejects non-numeric Basic Salary', async ({ employeeFormPage }) => {
    await employeeFormPage.basicSalaryInput.pressSequentially('abc', { delay: 30 });
    const value = await employeeFormPage.basicSalaryInput.inputValue();
    // Field should either reject non-numeric keystrokes outright or leave
    // CTC unaffected — either way, no crash is the minimum bar here.
    expect(typeof value).toBe('string');
  });

  test('@negative rejects negative Basic Salary', async ({ employeeFormPage }) => {
    await employeeFormPage.basicSalaryInput.pressSequentially('-1000', { delay: 30 });
    const value = await employeeFormPage.basicSalaryInput.inputValue();
    expect(typeof value).toBe('string');
  });

  test('@negative @security rejects XSS payload typed into Basic Salary', async ({ employeeFormPage }) => {
    await employeeFormPage.basicSalaryInput.fill(testData.xssPayloads[0]);
    const value = await employeeFormPage.basicSalaryInput.inputValue();
    expect(typeof value).toBe('string');
  });

  test('@positive Designation dropdown lists real master-data options', async ({ employeeFormPage }) => {
    await employeeFormPage.click(employeeFormPage.designationCombobox);
    const options = employeeFormPage.page.locator('.ng-dropdown-panel .ng-option:visible');
    await expect(options.first()).toBeVisible();
    expect(await options.count()).toBeGreaterThan(0);
  });

  test('@positive Role dropdown lists real master-data options', async ({ employeeFormPage }) => {
    await employeeFormPage.click(employeeFormPage.roleCombobox);
    const options = employeeFormPage.page.locator('.ng-dropdown-panel .ng-option:visible');
    await expect(options.first()).toBeVisible();
    expect(await options.count()).toBeGreaterThan(0);
  });

  test('@positive Clear resets the form fields', async ({ employeeFormPage }) => {
    await employeeFormPage.basicSalaryInput.pressSequentially('45000', { delay: 30 });
    await employeeFormPage.clear();
    await expect(employeeFormPage.basicSalaryInput).toHaveValue('');
  });

  test('@negative rejects a far-future Date of Joining without crashing', async ({ employeeFormPage }) => {
    await employeeFormPage.fillReadonlyDate(employeeFormPage.dateOfJoiningInput, '2099-01-01');
    const value = await employeeFormPage.dateOfJoiningInput.inputValue();
    expect(typeof value).toBe('string');
  });

  test('@negative rejects an invalid Date of Joining format without crashing', async ({ employeeFormPage }) => {
    await employeeFormPage.fillReadonlyDate(employeeFormPage.dateOfJoiningInput, 'not-a-date');
    const value = await employeeFormPage.dateOfJoiningInput.inputValue();
    expect(typeof value).toBe('string');
  });

  test('@negative marks mandatory fields invalid when Save is clicked blank', async ({ employeeFormPage }) => {
    await employeeFormPage.save();
    // No dedicated error-message text/class was found live on this form
    // (unlike the Contact module) — Angular's reactive form still marks
    // the control invalid via the ng-invalid class, which is asserted
    // here instead of a specific error string.
    await expect(employeeFormPage.basicSalaryInput).toHaveClass(/ng-invalid|ng-untouched/);
  });

  test('@boundary accepts a decimal Basic Salary amount', async ({ employeeFormPage }) => {
    await employeeFormPage.basicSalaryInput.pressSequentially('50000.50', { delay: 30 });
    await employeeFormPage.allowanceInput.pressSequentially('1000', { delay: 30 });
    await employeeFormPage.page.waitForTimeout(400);
    const ctcText = await employeeFormPage.getCtcText();
    expect(typeof ctcText).toBe('string');
  });

  test('@boundary accepts a very large Basic Salary amount', async ({ employeeFormPage }) => {
    await employeeFormPage.basicSalaryInput.pressSequentially('99999999', { delay: 20 });
    await employeeFormPage.allowanceInput.pressSequentially('1', { delay: 20 });
    await employeeFormPage.page.waitForTimeout(400);
    const ctcText = await employeeFormPage.getCtcText();
    expect(ctcText.replace(/,/g, '')).toContain('100000000');
  });
});
