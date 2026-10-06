const BASE = 'http://host81.kapilits.com:8007';
const { dismissGlobalPopups } = require('../utils/navigation');

class AuctionPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(`${BASE}/#/AuctionConfig/Auction`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2500);
    await dismissGlobalPopups(this.page);
    await this.page.waitForTimeout(800);
  }

  saveBtn() {
    return this.page.locator('button:visible', { hasText: 'Save' }).first();
  }

  groupLabel(groupCode) {
    return this.page.locator('label', { hasText: groupCode }).first();
  }

  ticketSelect() {
    return this.page.locator('ng-select[formcontrolname="ticketno"]');
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

module.exports = { AuctionPage };
