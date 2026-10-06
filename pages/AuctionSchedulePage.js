const BASE = 'http://host81.kapilits.com:8007';
const { dismissGlobalPopups } = require('../utils/navigation');

class AuctionSchedulePage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(`${BASE}/#/AuctionConfig/Auctionschedule`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2500);
    await dismissGlobalPopups(this.page);
    await this.page.waitForTimeout(800);
  }

  searchBox() {
    return this.page.locator('input[formcontrolname="searchtext"]:visible').first();
  }

  async searchByText(text) {
    await this.searchBox().fill(text);
    await this.page.waitForTimeout(1500);
  }
}

module.exports = { AuctionSchedulePage };
