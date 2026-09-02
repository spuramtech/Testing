const { test, expect } = require('../fixtures/baseFixtures');

test.describe('Pre-closure - Smoke @smoke', () => {
  test('should navigate to Pre-closure and display the New/Edit form', async ({ loggedInPage, preClosurePage }) => {
    await preClosurePage.navigateToPreClosure();

    await expect(preClosurePage.loanTypeDropdown).toBeVisible();
    await expect(preClosurePage.loanNameDropdown).toBeVisible();
    await expect(preClosurePage.saveButton).toBeVisible();
    await expect(preClosurePage.clearButton).toBeVisible();
    await expect(preClosurePage.viewListLink).toBeVisible();
  });

  test('should open the Pre-closure list grid via View', async ({ loggedInPage, preClosurePage }) => {
    await preClosurePage.navigateToPreClosureList();

    await expect(preClosurePage.gridTitle).toBeVisible();
    await expect(preClosurePage.newButton).toBeVisible();
    await expect(preClosurePage.searchBox).toBeVisible();
  });
});
