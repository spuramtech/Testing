const { test, expect } = require('../fixtures/baseFixtures');
const AxeBuilder = require('@axe-core/playwright').default;
const { loginAsDefaultUser } = require('../helpers/authHelper');

test.describe('@accessibility Contact module accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
  });

  test('@accessibility Contact List has no critical a11y violations', async ({ page, contactListPage }) => {
    await contactListPage.open();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });

  test('@accessibility New Contact form has no critical a11y violations', async ({ page, contactListPage }) => {
    await contactListPage.open();
    await contactListPage.clickNew();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });
});
