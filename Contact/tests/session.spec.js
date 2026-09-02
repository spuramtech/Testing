const { test, expect } = require('../fixtures/baseFixtures');
const { loginAsDefaultUser } = require('../helpers/authHelper');

test.describe('@regression @security Session handling', () => {
  test('@negative clearing session storage mid-form redirects to login on reload', async ({ page, contactListPage }) => {
    await loginAsDefaultUser(page);
    await contactListPage.open();
    // Verified live: the app keeps its session (currentUser, token, etc.)
    // in sessionStorage, not a cookie — clearing it and reloading is a
    // reliable way to simulate an expired/invalidated session without
    // waiting out a real timeout. Same mechanism confirmed on the
    // Employee module.
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/returnUrl/);
  });
});
