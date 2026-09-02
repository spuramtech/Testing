const { expect } = require('@playwright/test');

const Assertions = {
  async assertVisible(locator, message = '') {
    await expect(locator, message).toBeVisible();
  },

  async assertHidden(locator, message = '') {
    await expect(locator, message).toBeHidden();
  },

  async assertEnabled(locator, message = '') {
    await expect(locator, message).toBeEnabled();
  },

  async assertDisabled(locator, message = '') {
    await expect(locator, message).toBeDisabled();
  },

  async assertText(locator, expected, message = '') {
    await expect(locator, message).toHaveText(expected);
  },

  async assertContainsText(locator, expected, message = '') {
    await expect(locator, message).toContainText(expected);
  },

  async assertUrl(page, pattern) {
    await expect(page).toHaveURL(pattern);
  },

  async assertTitle(page, pattern) {
    await expect(page).toHaveTitle(pattern);
  },

  async assertToastMessage(page, text) {
    const toast = page.locator('.toast, .Toastify__toast, [role="status"]').first();
    await expect(toast).toContainText(text);
  },

  async assertRowCount(locator, count) {
    await expect(locator).toHaveCount(count);
  },

  async assertDropdownOptions(page, optionsLocator, expectedOptions) {
    const actualTexts = await optionsLocator.allTextContents();
    expect(actualTexts.map((t) => t.trim())).toEqual(expect.arrayContaining(expectedOptions));
  },

  assertApiStatus(response, expectedStatus) {
    expect(response.status()).toBe(expectedStatus);
  },

  assertDbValue(actual, expected, message = '') {
    expect(actual, message).toEqual(expected);
  },
};

module.exports = { Assertions };
