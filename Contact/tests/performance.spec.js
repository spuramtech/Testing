const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

// Lightweight timing checks, not a real load test — same honest scope as
// the Employee module's performance spec: single-user page-load latency
// on the live demo, not concurrency/throughput. Real load/performance
// testing needs a dedicated tool (k6/Artillery) driving many virtual
// users directly against the API.
test.describe('@regression @performance Page load timing', () => {
  test('@positive Contact List loads within a reasonable time budget', async ({ page, contactListPage }) => {
    await loginAsDefaultUser(page);
    const start = Date.now();
    await contactListPage.open();
    await contactListPage.newButton.waitFor({ state: 'visible' });
    expect(Date.now() - start).toBeLessThan(10000);
  });

  test('@positive New Contact form loads within a reasonable time budget', async ({ page, contactListPage, contactInfoPage }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    const start = Date.now();
    await contactListPage.clickNew();
    await contactInfoPage.firstNameInput.waitFor({ state: 'visible' });
    expect(Date.now() - start).toBeLessThan(10000);
  });
});
