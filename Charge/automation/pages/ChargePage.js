const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

class ChargePage extends BasePage {
  constructor(page) {
    super(page);

    // The Angular router keeps previous route components in the DOM (hidden);
    // scope every locator to the currently visible <app-charges> instance to
    // avoid strict-mode "multiple elements" errors.
    this.container = page.locator('app-charges:visible');

    // Charge list screen (Kendo grid)
    this.searchBox = this.container.locator('input.search-k-cst');
    this.newButton = this.container.locator('a.btn-b-icon').filter({ hasText: 'New' });
    this.exportPdfButton = this.container.locator('a.k-grid-pdf');
    this.exportExcelButton = this.container.locator('a.k-grid-excel');

    this.gridRows = this.container.locator('kendo-grid tbody tr[kendogridlogicalrow]');
    this.paginationInfo = this.container.locator('kendo-pager-info');
    this.firstPageButton = this.container.locator('.k-pager-first');
    this.previousPageButton = this.container.locator('a[title="Go to the previous page"]');
    this.nextPageButton = this.container.locator('a[title="Go to the next page"]');
    this.lastPageButton = this.container.locator('.k-pager-last');

    // New / Edit Charge panel (Bootstrap modal id="add-detail")
    this.panel = page.locator('#add-detail:visible');
    this.chargeNameInput = this.panel.locator('#idChargename');
    this.typeOfLedgerDropdown = this.panel.locator('#ledgertype');
    this.applicableDropdown = this.panel.locator('#applicable');
    this.dropdownPanel = page.locator('.ng-dropdown-panel:visible');
    this.clearButton = this.panel.locator('a.btn-g-icon').filter({ hasText: 'Clear' });
    this.saveButton = this.panel.locator('button.btn-b-icon').filter({ hasText: 'Save' });
    this.closeIcon = this.panel.locator('button.close');

    this.columnHeaders = this.container.locator('kendo-grid th.k-header');

    this.confirmDeleteButton = page.getByRole('button', { name: /^(yes|delete|confirm|ok)$/i });
    this.cancelDeleteButton = page.getByRole('button', { name: /^(no|cancel)$/i });

    this.validationMessage = page.locator('.error-message, .invalid-feedback, [role="alert"], .toast-error');
    this.toast = page.locator('.toast, .Toastify__toast, [role="status"], .toast-message');
  }

  async openNewChargePanel() {
    logger.info('Opening New Charge panel');
    await this.click(this.newButton);
    await this.panel.waitFor({ state: 'visible' });
  }

  async openEditChargePanel(chargeName) {
    logger.info(`Opening Edit panel for charge: ${chargeName}`);
    const row = this.getRowByChargeName(chargeName);
    await this.click(row.locator('#icon-edit, .k-grid-edit-command'));
    await this.panel.waitFor({ state: 'visible' });
  }

  getRowByChargeName(chargeName) {
    return this.gridRows.filter({ hasText: chargeName });
  }

  async fillChargeForm({ chargeName, typeOfLedger, applicable }) {
    if (chargeName !== undefined) {
      await this.fill(this.chargeNameInput, chargeName);
    }
    if (typeOfLedger) {
      await this.selectNgOption(this.typeOfLedgerDropdown, typeOfLedger);
    }
    if (applicable) {
      await this.selectNgOption(this.applicableDropdown, applicable);
    }
  }

  async selectNgOption(dropdownLocator, optionText) {
    await this.click(dropdownLocator);
    await this.dropdownPanel.waitFor({ state: 'visible' });
    await this.click(this.dropdownPanel.locator('.ng-option', { hasText: optionText }).first());
  }

  async saveCharge() {
    logger.info('Saving charge');
    await this.click(this.saveButton);
  }

  async clearForm() {
    await this.click(this.clearButton);
  }

  async closePanel() {
    await this.click(this.closeIcon);
  }

  async deleteCharge(chargeName, { confirm = true } = {}) {
    logger.info(`Deleting charge: ${chargeName} (confirm=${confirm})`);
    const row = this.getRowByChargeName(chargeName);
    await this.click(row.locator('#icon-delete, .k-grid-remove-command'));

    // NOTE: the live app deletes immediately on this click with no
    // confirmation dialog, despite the spec describing one. If a dialog
    // does appear (e.g. in a future build), honor it; otherwise this is a
    // no-op and the row is already gone.
    const dialogAppeared = await this.confirmDeleteButton
      .or(this.cancelDeleteButton)
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (dialogAppeared) {
      await this.click(confirm ? this.confirmDeleteButton : this.cancelDeleteButton);
    }
  }

  async search(term) {
    await this.fill(this.searchBox, term);
  }

  async clearSearch() {
    await this.fill(this.searchBox, '');
  }

  async isChargeVisible(chargeName) {
    return this.isVisible(this.getRowByChargeName(chargeName).first());
  }

  async getRowCount() {
    return this.gridRows.count();
  }

  async createCharge(chargeData) {
    await this.openNewChargePanel();
    await this.fillChargeForm(chargeData);
    await this.saveCharge();
  }

  async getPaginationText() {
    return (await this.paginationInfo.textContent())?.trim();
  }

  async goToFirstPage() {
    await this.click(this.firstPageButton);
  }

  async goToPreviousPage() {
    await this.click(this.previousPageButton);
  }

  async goToNextPage() {
    await this.click(this.nextPageButton);
  }

  async goToLastPage() {
    await this.click(this.lastPageButton);
  }

  async isFirstPageDisabled() {
    const disabled = await this.firstPageButton.getAttribute('aria-disabled');
    return disabled === 'true' || (await this.firstPageButton.locator('..').getAttribute('class'))?.includes('k-state-disabled');
  }

  async isLastPageDisabled() {
    const disabled = await this.lastPageButton.getAttribute('aria-disabled');
    return disabled === 'true' || (await this.lastPageButton.locator('..').getAttribute('class'))?.includes('k-state-disabled');
  }

  async isPreviousPageDisabled() {
    const disabled = await this.previousPageButton.getAttribute('aria-disabled');
    return disabled === 'true';
  }

  async isNextPageDisabled() {
    const disabled = await this.nextPageButton.getAttribute('aria-disabled');
    return disabled === 'true';
  }

  async sortByColumn(columnName) {
    const header = this.columnHeaders.filter({ hasText: columnName }).first();
    await this.click(header);
  }

  async getColumnValues(columnIndex) {
    return this.gridRows.evaluateAll(
      (rows, idx) => rows.map((row) => row.querySelectorAll('td')[idx]?.textContent?.trim() ?? ''),
      columnIndex
    );
  }

  async forceInvalidDropdownOption(dropdownLocator, invalidValue) {
    // Simulates a forced DOM/attacker manipulation of an Angular ng-select,
    // bypassing the UI's predefined option list, to verify Save still rejects it.
    await dropdownLocator.evaluate((el, value) => {
      el.setAttribute('data-forced-value', value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, invalidValue);
  }
}

module.exports = { ChargePage };
