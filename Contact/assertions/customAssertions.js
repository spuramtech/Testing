const { expect } = require('@playwright/test');

async function assertVisible(locator, message) {
  await expect(locator, message).toBeVisible();
}

async function assertEnabled(locator, message) {
  await expect(locator, message).toBeEnabled();
}

async function assertDisabled(locator, message) {
  await expect(locator, message).toBeDisabled();
}

async function assertText(locator, expectedText, message) {
  await expect(locator, message).toHaveText(expectedText);
}

async function assertContainsText(locator, expectedText, message) {
  await expect(locator, message).toContainText(expectedText);
}

async function assertUrlContains(page, fragment) {
  await expect(page).toHaveURL(new RegExp(fragment));
}

async function assertTitle(page, expectedTitle) {
  await expect(page).toHaveTitle(expectedTitle);
}

async function assertToastMessage(page, expectedText) {
  const toast = page.locator('.toast-message, .swal2-popup, .alert').first();
  await expect(toast).toContainText(expectedText);
}

async function assertRowCount(locator, expectedCount) {
  await expect(locator).toHaveCount(expectedCount);
}

async function assertApiStatus(response, expectedStatus) {
  expect(response.status()).toBe(expectedStatus);
}

module.exports = {
  assertVisible,
  assertEnabled,
  assertDisabled,
  assertText,
  assertContainsText,
  assertUrlContains,
  assertTitle,
  assertToastMessage,
  assertRowCount,
  assertApiStatus,
};
