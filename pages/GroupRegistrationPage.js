const BASE = 'http://host81.kapilits.com:8007';
const { dismissGlobalPopups } = require('../utils/navigation');

class GroupRegistrationPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(`${BASE}/#/configuration/chitregistration`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2000);
    await dismissGlobalPopups(this.page);
    await this.page.waitForTimeout(300);
  }

  saveBtn() {
    return this.page.locator('button:visible', { hasText: 'Save' }).first();
  }

  async selectOptionJS(name, value) {
    return this.page.evaluate(({ name, value }) => {
      const els = [...document.querySelectorAll(`select[formcontrolname="${name}"]`)].filter(e => e.offsetParent !== null);
      const el = els[0];
      if (!el) return null;
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return el.value;
    }, { name, value });
  }

  async selectFirstRealOptionJS(name) {
    return this.page.evaluate((name) => {
      const els = [...document.querySelectorAll(`select[formcontrolname="${name}"]`)].filter(e => e.offsetParent !== null);
      const el = els[0];
      if (!el || el.options.length < 2) return null;
      const opt = el.options[1];
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { value: el.value, text: opt.text };
    }, name);
  }

  async setValueJS(name, value) {
    return this.page.evaluate(({ name, value }) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const inputs = [...document.querySelectorAll(`input[formcontrolname="${name}"]`)].filter(i => i.offsetParent !== null);
      const visible = inputs[0];
      if (!visible) return null;
      setter.call(visible, value);
      visible.dispatchEvent(new Event('input', { bubbles: true }));
      visible.dispatchEvent(new Event('blur', { bubbles: true }));
      return visible.value;
    }, { name, value });
  }
}

module.exports = { GroupRegistrationPage };
