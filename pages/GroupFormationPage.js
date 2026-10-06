const BASE = 'http://host81.kapilits.com:8007';

class GroupFormationPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(`${BASE}/#/configuration/chitformation`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2000);
  }

  saveBtn() {
    return this.page.locator('button:visible', { hasText: 'Save' }).first();
  }

  field(name) {
    return this.page.locator(`[formcontrolname="${name}"]:visible`).first();
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
}

module.exports = { GroupFormationPage };
