const { test, expect } = require('../fixtures/baseFixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const { loginAsDefaultUser } = require('../helpers/authHelper');

test.describe('@accessibility Employees module accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test('@accessibility Add Employee form has no critical a11y violations', async ({ page, employeeFormPage }) => {
    await employeeFormPage.open();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });

  test('@accessibility Employees list has no critical a11y violations', async ({ page, employeeFormPage, employeeListPage }) => {
    await employeeFormPage.open();
    await employeeFormPage.goToList();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });
});
