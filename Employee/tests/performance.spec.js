const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

// Lightweight timing checks, not a real load test — closes the gap
// honestly: this asserts single-user page-load latency on the live demo,
// not concurrency/throughput. A genuine performance test needs a
// dedicated load-testing tool (k6, Artillery) driving many virtual users
// against the API directly, which is out of scope for a Playwright suite.
test.describe('@regression @performance Page load timing', () => {
  test('@positive Add Employee form loads within a reasonable time budget', async ({ page, employeeFormPage }) => {
    await loginAsDefaultUser(page);
    const start = Date.now();
    await employeeFormPage.open();
    await employeeFormPage.basicSalaryInput.waitFor({ state: 'visible' });
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(10000);
  });

  test('@positive Employees list loads within a reasonable time budget', async ({ page, employeeFormPage, employeeListPage }) => {
    await loginAsDefaultUser(page);
    await employeeFormPage.open();
    const start = Date.now();
    await employeeFormPage.goToList();
    await employeeListPage.grid.waitFor({ state: 'visible' });
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(10000);
  });
});
