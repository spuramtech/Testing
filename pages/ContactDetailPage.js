const BASE = 'http://host81.kapilits.com:8007';

class ContactDetailPage {
  constructor(page) {
    this.page = page;
    this.detailViewIcon = page.locator('img[title="detailed view"]').first();
    this.previousLink = page.locator('a, button, span').filter({ hasText: /^\s*Previous\s*$/ });
  }

  async openFirstContactDetail() {
    await this.detailViewIcon.click();
    await this.page.waitForTimeout(2000);
  }

  getContactId() {
    const url = this.page.url();
    const match = url.match(/ID=(\d+)/);
    return match ? match[1] : null;
  }

  async goToRoleTabByUrl(id, roleQueryName) {
    await this.page.goto(`${BASE}/#/configuration/ContactMore?ID=${id}&name=${roleQueryName}&TYPE=Individual`, { waitUntil: 'load' });
    await this.page.waitForTimeout(2000);
  }

  async goToRoleTab(tabName) {
    await this.page.locator('a[data-toggle="tab"]', { hasText: tabName }).first().click();
    await this.page.waitForTimeout(1200);
  }

  saveBtn() {
    return this.page.locator('button:visible', { hasText: 'Save' }).first();
  }

  // "+ Create" links inside the role table, in column order:
  // 0 = Subscriber (ticket create), 1 = Employee, 2 = Referral, 3 = Party, 4 = Advocate
  createLink(index) {
    return this.page.locator('a:has-text("Create")').nth(index);
  }

  async clickCreateLink(index) {
    const links = await this.page.locator('a:has-text("Create")').all();
    await links[index].click();
    await this.page.waitForTimeout(2000);
  }

  async expandPanel(dataTarget) {
    await this.page.locator(`a[data-target="${dataTarget}"]`).click();
    await this.page.waitForTimeout(1200);
  }

  async goToEmployeeSubTab(subTabName) {
    await this.page.locator('a[data-toggle="tab"]', { hasText: subTabName }).first().click();
    await this.page.waitForTimeout(900);
  }
}

module.exports = { ContactDetailPage };
