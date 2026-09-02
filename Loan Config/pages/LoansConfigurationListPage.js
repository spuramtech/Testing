const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

class LoansConfigurationListPage extends BasePage {
  constructor(page) {
    super(page);
    this.loansMenu = page.locator('nav li').filter({ hasText: 'Loans' }).first();
    this.loanConfigurationMenu = page.getByText('Loan Configuration', { exact: true }).first();
    // href-based, not text-based: "Loans Configuration" text is ambiguous with the page title
    // paragraph elsewhere in the DOM, which caused an intermittent hang when combined with a
    // visibility wait.
    this.loansConfigurationSubMenu = page.locator('nav a[href*="LoansCreation"]').first();

    this.pageTitle = page.getByText('Loans Configuration', { exact: true }).first();
    this.searchBox = page.locator('input[placeholder*="Search" i]:visible').first();
    this.clearSearchIcon = page.locator('.search-clear, [aria-label="clear"]').first();
    this.exportPdfButton = page.getByRole('button', { name: /export.*pdf/i });
    this.exportExcelButton = page.getByRole('button', { name: /export.*excel/i });
    this.newButton = page.getByRole('button', { name: /\+?\s*new/i });

    // The app keeps all 5 tabs' DOM mounted (only the active one is visible), so grid/pagination
    // locators must be scoped to :visible to avoid matching hidden tabs' tables/controls.
    this.gridRows = page.locator('table tbody tr:visible');
    this.paginationInfo = page.getByText(/\d+\s*-\s*\d+ of \d+ items/i).first();
    this.paginationPrevious = page.locator('a.page-link:visible', { hasText: 'Previous' }).first();
    this.paginationNext = page.locator('a.page-link:visible', { hasText: 'Next' }).first();
  }

  async navigateFromMainMenu() {
    logger.info('Navigating to Loans Configuration screen');
    // Regular (non-force) clicks so Playwright auto-waits for each submenu's expand animation
    // to finish before the next click - forcing them fires faster than the Angular animation.
    await this.loansMenu.click({ force: true });
    await this.loanConfigurationMenu.click();
    await this.loansConfigurationSubMenu.click();
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  rowByLoanName(loanName) {
    return this.gridRows.filter({ hasText: loanName });
  }

  async editButtonForRow(loanName) {
    return this.rowByLoanName(loanName).locator('button[aria-label*="edit" i], .fa-pencil, .edit-icon').first();
  }

  async deleteButtonForRow(loanName) {
    return this.rowByLoanName(loanName).locator('button[aria-label*="delete" i], .fa-trash, .delete-icon').first();
  }

  async search(term) {
    await this.searchBox.fill(term);
  }

  async clearSearch() {
    await this.clearSearchIcon.click().catch(() => this.searchBox.fill(''));
  }

  async clickNew() {
    await this.newButton.click();
  }

  async openEdit(loanName) {
    const editBtn = await this.editButtonForRow(loanName);
    await editBtn.click();
  }

  async deleteRow(loanName) {
    const deleteBtn = await this.deleteButtonForRow(loanName);
    await deleteBtn.click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /yes|confirm|ok/i }).click();
  }

  async cancelDelete() {
    await this.page.getByRole('button', { name: /no|cancel/i }).click();
  }

  async getRowCount() {
    await this.gridRows.first().waitFor({ state: 'visible' }).catch(() => {});
    return this.gridRows.count();
  }
}

module.exports = { LoansConfigurationListPage };
