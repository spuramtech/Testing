const BASE = 'http://host81.kapilits.com:8007';
const { dismissGlobalPopups } = require('../utils/navigation');

class ChitPaymentPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(`${BASE}/#/Transactions/ChitPayment`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2500);
    await dismissGlobalPopups(this.page);
    await this.page.waitForTimeout(800);
  }

  showBtn() {
    return this.page.locator('button:visible', { hasText: 'Show' }).first();
  }

  async selectFirstSubscriber() {
    await this.page.locator('ng-select[formcontrolname="contactid"]').click();
    await this.page.waitForTimeout(800);
    const count = await this.page.locator('.ng-dropdown-panel .ng-option').count();
    if (count > 0) {
      await this.page.locator('.ng-dropdown-panel .ng-option').first().click();
      await this.page.waitForTimeout(800);
      return true;
    }
    return false;
  }
}

module.exports = { ChitPaymentPage };
