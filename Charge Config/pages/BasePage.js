const { logger } = require('../utils/logger');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(path = '/') {
    logger.info(`Navigating to ${path}`);
    await this.page.goto(path);
  }

  async selectDropdownOption(dropdownLocator, optionText) {
    const tagName = await dropdownLocator.evaluate((el) => el.tagName).catch(() => null);
    if (tagName === 'SELECT') {
      await dropdownLocator.selectOption({ label: optionText });
      return;
    }
    await dropdownLocator.click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async isVisible(locator) {
    return locator.isVisible().catch(() => false);
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ path: `screenshots/${name}-${Date.now()}.png`, fullPage: true });
  }
}

module.exports = { BasePage };
