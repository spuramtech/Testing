const BasePage = require('./BasePage');
const { TABS } = require('../constants/appConstants');

/** Shared tab-strip + top controls present on every Contact wizard screen. */
class ContactTabsNav extends BasePage {
  constructor(page) {
    super(page);
    this.searchExistingContact = page.locator('#s2id_autogen1, .ng-select', {
      has: page.locator('text=Select'),
    }).first();
    this.individualRadio = page.getByLabel('Individual');
    this.businessEntityRadio = page.getByLabel('Business Entity');
    this.ucicLabel = page.locator('text=/UCIC\\s*:/');
    // Verified live: Back/Next/Clear/Save & Continue/Add are all <a
    // class="btn">, NOT <button> — getByRole('button') never matches them.
    // Each of the 8 tab sections also renders its own copy of these links
    // (hidden via CSS on inactive tabs), so scope with :visible.
    this.viewButton = page.locator('a.btn:visible').filter({ hasText: /View/i });
    this.backButton = page.locator('a.btn:visible').filter({ hasText: /^Back$/i });
    this.nextButton = page.locator('a.btn:visible').filter({ hasText: /^Next$/i });
    this.clearButton = page.locator('a.btn:visible').filter({ hasText: /^Clear$/i });
    // "Save & Continue" is the one exception — a real <button>, shared
    // globally across all tabs (not duplicated per-tab like Back/Next/Add).
    this.saveAndContinueButton = page.getByRole('button', { name: /Save\s*&\s*Continue/i });
  }

  tab(tabName) {
    // Verified live: tab strip is <li class="nav-item"><a>Tab Name</a></li>.
    // All 8 tab content sections coexist in the DOM (hidden via CSS), and
    // several repeat the tab's label as a section <h2> — scope strictly to
    // the nav-item anchor so those don't get matched instead.
    return this.page.locator('li.nav-item > a').filter({ hasText: tabName }).first();
  }

  async openTab(tabName) {
    await this.click(this.tab(tabName));
  }

  async goNext() {
    await this.click(this.nextButton);
  }

  async goBack() {
    await this.click(this.backButton);
  }

  async clearForm() {
    await this.click(this.clearButton);
  }

  async saveAndContinue() {
    await this.click(this.saveAndContinueButton);
  }

  async isTabActive(tabName) {
    const el = this.tab(tabName);
    const cls = (await el.getAttribute('class')) || '';
    return /active|selected/i.test(cls);
  }
}

module.exports = { ContactTabsNav, TABS };
