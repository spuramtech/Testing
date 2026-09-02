const { expect } = require('@playwright/test');
const { logger } = require('../utils/logger');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(url) {
    logger.info(`Navigating to ${url}`);
    await this.page.goto(url);
  }

  async click(locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async fill(locator, value) {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(value);
  }

  async selectDropdownOption(triggerLocator, optionLocator) {
    await this.click(triggerLocator);
    await this.click(optionLocator);
  }

  async getText(locator) {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent())?.trim();
  }

  async isVisible(locator) {
    return locator.isVisible().catch(() => false);
  }

  async waitForToast(page) {
    const toast = page.locator('.toast, .Toastify__toast, [role="alert"]').first();
    await toast.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);
    return toast;
  }

  async assertUrlContains(fragment) {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  async assertTitle(title) {
    await expect(this.page).toHaveTitle(title);
  }
}

module.exports = { BasePage };
