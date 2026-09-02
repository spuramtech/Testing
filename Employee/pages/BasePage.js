const logger = require('../utils/logger');
const { TIMEOUTS } = require('../constants/appConstants');

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    logger.info(`Navigating to ${path}`);
    await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: TIMEOUTS.NAVIGATION });
  }

  async click(locator, options = {}) {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await locator.click(options);
  }

  async fill(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await locator.fill(value);
  }

  async selectNgOption(comboboxLocator, optionText) {
    await this.click(comboboxLocator);
    // .ng-option elements from a previously-closed dropdown can linger in
    // the DOM (hidden) — scope to the live panel + :visible so a stale
    // option never gets picked up instead of the one actually open
    // (verified defect pattern reused from the Contact module framework).
    const option = this.page.locator('.ng-dropdown-panel .ng-option:visible', { hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  // Date of Joining is a readonly bsDatepicker-bound input (same pattern
  // verified on the Contact module's Date of Birth) — a plain .fill() is
  // rejected by Playwright's editability check. Strip readonly and
  // dispatch the events Angular's reactive form listens for.
  async fillReadonlyDate(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await locator.evaluate((el, val) => {
      el.removeAttribute('readonly');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, value);
  }

  async isVisible(locator) {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // The app's own JS-driven navigation links (sidebar menu items, the
  // "View" back-link on the Employee form) intermittently crash the
  // Chromium renderer when Playwright's actionability-checked .click()
  // waits on them under this app's page transitions. Dispatching the
  // click directly bypasses that wait entirely — verified reliable during
  // exploration where the checked click reproducibly crashed the page.
  async clickViaDispatch(locator) {
    await locator.evaluate((el) => el.click());
    await this.page.waitForTimeout(300);
  }
}

module.exports = BasePage;
