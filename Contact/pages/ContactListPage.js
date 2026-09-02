const BasePage = require('./BasePage');
const { BASE_URL } = require('../utils/envLoader');

class ContactListPage extends BasePage {
  constructor(page) {
    super(page);
    // Left nav (present on every dashboard page) — used to reach the list
    // the same way a real user does, since deep-linking the hash route
    // does not reliably reload Angular module state.
    // IDs verified live: #a0 = "Contact" top menu, #mhalltitle66 = "Contact
    // Configuration" submenu header, #msm213 = "Contact" leaf link.
    this.contactMenuItem = page.locator('#a0');
    this.contactConfigurationMenuItem = page.locator('#mhalltitle66');
    this.contactSubMenuItem = page.locator('#msm213');

    // Verified live: split "New" control is an <a id="dropdownMenuButton1">,
    // not a <button> — do not match by hasText:'New' alone, it also matches
    // the "New Delhi" branch-selector button.
    this.newButton = page.locator('#dropdownMenuButton1');
    this.pendingContactsButton = page.getByRole('button', { name: /Pending Contacts/i });
    // Verified live: search box is inside a bootstrap input-group alongside
    // the "All" type dropdown (its class "search-k-cst" is shared with an
    // unrelated hidden grid-filter input elsewhere, so scope by structure).
    this.searchTypeDropdown = page.locator('div.input-group.mb-3 select');
    this.searchInput = page.locator('div.input-group.mb-3 input');
    this.searchIcon = page.locator('div.input-group.mb-3 button:has(i)');
    this.individualRadio = page.getByText('Individual', { exact: true });
    this.businessEntityRadio = page.getByText('Business Entity', { exact: true });
    // Verified live: a plain clickable <img title="Excel">, not wrapped in
    // an <a>/<button>.
    this.excelExportIcon = page.locator('img[title="Excel"]').first();
    // Verified live: clicking "New" reveals a dropdown with "Manual" /
    // "Digital" — not documented in the original prompt. "Manual" opens the
    // ContactNew wizard used throughout this framework.
    this.newManualOption = page.locator('a.dropdown-item[href="#/Contact/ContactNew"]');
    this.newDigitalOption = page.locator('.dropdown-item').filter({ hasText: 'Digital' });
    this.prevButton = page.locator('a, button').filter({ hasText: 'Prev' }).first();
    this.nextButton = page.locator('a, button').filter({ hasText: 'Next' }).first();
    this.pageInfo = page.locator('text=/Page \\d+ of \\d+/').first();
    this.noRecordsMessage = page.getByText('No records Found.');
    // Verified live: each result is a two-column card block containing the
    // contact name and a "UCIC :" label; no dedicated card class exists.
    this.contactCards = page.locator('.col-md-6, .col-12').filter({ hasText: 'UCIC' });
  }

  async open() {
    await this.click(this.contactMenuItem);
    await this.click(this.contactConfigurationMenuItem);
    await this.click(this.contactSubMenuItem);
    await this.page.waitForURL(/ContactViewNew/, { timeout: 15000 }).catch(() => null);
  }

  async clickNew() {
    await this.click(this.newButton);
    await this.click(this.newManualOption);
  }

  async searchContact(term) {
    await this.fill(this.searchInput, term);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async toggleIndividual() {
    await this.click(this.individualRadio);
  }

  async toggleBusinessEntity() {
    await this.click(this.businessEntityRadio);
  }

  async goToNextPage() {
    await this.click(this.nextButton);
  }

  async goToPrevPage() {
    await this.click(this.prevButton);
  }

  async getPageInfoText() {
    return this.getText(this.pageInfo);
  }

  contactCardByName(name) {
    return this.page.locator('.col-md-6, .col-12').filter({ hasText: 'UCIC' }).filter({ hasText: name });
  }
}

module.exports = ContactListPage;
