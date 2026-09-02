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
    // the DOM (hidden) — scope to :visible so a stale option from another
    // ng-select on the page is never picked up instead of the open one.
    const option = this.page.locator('.ng-dropdown-panel .ng-option:visible', { hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await option.click();
    // Dependent combobox chains (Country -> State -> District) repopulate
    // asynchronously after a parent selection; give the next one a beat to
    // update before it's opened, or it can still show the previous state's
    // (or an empty) option list.
    await this.page.waitForTimeout(400);
  }

  async selectDropdown(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    await locator.selectOption({ label: value });
  }

  // bsDatepicker-bound date fields render as readonly <input> — a plain
  // .fill() is rejected by Playwright's editability check. Strip the
  // readonly attribute and dispatch the events Angular's reactive form
  // listens for so the underlying FormControl actually updates.
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

  // Some radio inputs in this app are zero-size/off-screen AND share a
  // duplicate id with a sibling radio (e.g. both Resident/Non-Resident
  // options render id="presidentialstatus"), so neither a normal click nor
  // a label[for=...] click reliably targets the right one. Dispatch the
  // click directly on the resolved element instead — bypasses actionability
  // and label-ambiguity entirely.
  async forceCheckRadio(locator) {
    await locator.waitFor({ state: 'attached', timeout: TIMEOUTS.DEFAULT });
    await locator.evaluate((el) => {
      el.checked = true;
      el.dispatchEvent(new Event('click', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  async uploadFile(inputLocator, filePath) {
    await inputLocator.setInputFiles(filePath);
  }

  async getText(locator) {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
    return (await locator.textContent())?.trim();
  }

  async isVisible(locator) {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async takeScreenshot(name) {
    const filePath = `screenshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filePath, fullPage: true });
    logger.info(`Screenshot saved: ${filePath}`);
    return filePath;
  }

  async waitForToast() {
    const toast = this.page.locator('.toast-message, .swal2-popup, .alert').first();
    await toast.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT }).catch(() => null);
    return toast;
  }
}

module.exports = BasePage;
