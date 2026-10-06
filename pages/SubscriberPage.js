const BASE = 'http://host81.kapilits.com:8007';
const { dismissGlobalPopups } = require('../utils/navigation');

class SubscriberPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(`${BASE}/#/configuration/NewSubscriberconfig`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2500);
    await dismissGlobalPopups(this.page);
    await this.page.waitForTimeout(500);
  }

  saveBtn() {
    return this.page.locator('button:visible', { hasText: 'Save' }).first();
  }

  async selectFirstNgOption(formcontrolname) {
    await this.page.locator(`ng-select[formcontrolname="${formcontrolname}"]`).first().click();
    await this.page.waitForTimeout(600);
    await this.page.locator('.ng-dropdown-panel .ng-option').first().click().catch(() => {});
    await this.page.waitForTimeout(400);
  }

  async goToTab(tabName) {
    await this.page.locator('a[data-toggle="tab"]', { hasText: tabName }).first().click();
    await this.page.waitForTimeout(900);
  }
}

module.exports = { SubscriberPage };
