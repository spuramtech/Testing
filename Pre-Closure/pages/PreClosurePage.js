class PreClosurePage {
  constructor(page) {
    this.page = page;

    // Left navigation — the app can render a hidden duplicate of the sidebar,
    // so filter to the visible copy rather than relying on .first().
    // "Loan Configuration" starts collapsed (shows a "+") right after
    // "Loans" opens, and must be clicked to reveal Pre-closure et al.
    this.loansModuleItem = page.getByText('Loans', { exact: true }).filter({ visible: true }).first();
    this.loanConfigurationItem = page.getByText('Loan Configuration', { exact: true }).filter({ visible: true }).first();
    this.preClosureLink = page.locator('a[href="#/Loans/PreclosureMaster"]').filter({ visible: true }).first();

    // The New/Edit form and the list grid render as separate Angular
    // components (app-preclosure-master / app-preclosure-view).
    this.formRoot = page.locator('app-preclosure-master');
    this.listRoot = page.locator('app-preclosure-view');

    // The "View" and "New" controls, search box, and export icons render in
    // a shared toolbar outside app-preclosure-view/-master (not role=button
    // elements either), so they're matched by text/attribute at page level.
    this.viewListLink = page.getByText('View', { exact: true }).filter({ visible: true }).first();
    this.searchBox = page.locator('input[type="search"], input[placeholder*="Search" i]').filter({ visible: true }).first();
    this.exportPdfIcon = page.locator('img[alt*="pdf" i], [title*="PDF" i]').filter({ visible: true }).first();
    this.exportExcelIcon = page.locator('img[alt*="excel" i], [title*="Excel" i]').filter({ visible: true }).first();
    this.newButton = page.getByText('New', { exact: true }).filter({ visible: true }).first();
    this.gridTitle = this.listRoot.getByText('PreClosure', { exact: true });
    this.gridRows = this.listRoot.locator('table tbody tr, .grid-row');
    this.paginationInfo = this.listRoot.getByText(/items$/);

    // New / Edit form — matched by Angular formcontrolname, which is far
    // more stable than DOM position (the form also has a hidden
    // pChargecaltype radio ahead of the percentage input in the DOM).
    this.loanTypeDropdown = this.formRoot.locator('select[formcontrolname="pLoantypeid"]');
    this.loanNameDropdown = this.formRoot.locator('select[formcontrolname="pLoanid"]');
    this.minLockInPeriodInput = this.formRoot.locator('input[formcontrolname="pLockingperiod"]');
    this.minLockInPeriodUnitDropdown = this.formRoot.locator('select[formcontrolname="pLockingperiodtype"]');
    this.chargeTypePercentageInput = this.formRoot.locator('input[formcontrolname="pChargesvalue"]');
    this.interestFuturePrincipalRadio = this.formRoot.locator('input[formcontrolname="pChargecalonfield"]').nth(0);
    this.interestFutureAndOutstandingRadio = this.formRoot.locator('input[formcontrolname="pChargecalonfield"]').nth(1);
    this.gstIncludedRadio = this.formRoot.locator('input[formcontrolname="pTaxtype"]#pregstinc');
    this.gstExcludedRadio = this.formRoot.locator('input[formcontrolname="pTaxtype"]#pregstexc');
    this.gstNoGstRadio = this.formRoot.locator('input[formcontrolname="pTaxtype"]#prenogst');
    this.gstPercentDropdown = this.formRoot.locator('select[formcontrolname="pTaxpercentage"]');
    this.clearButton = this.formRoot.locator('button, [role="tab"], a').filter({ hasText: 'Clear' });
    // The submit button reads "Save" when creating and "Update" when
    // editing an existing row.
    this.saveButton = this.formRoot.locator('button, [role="tab"], a').filter({ hasText: /^(Save|Update)$/ });
    this.viewButton = this.viewListLink;
  }

  // Sidebar "Pre-closure" navigates straight to the New/Edit form (Master route).
  async navigateToPreClosure() {
    await this.loansModuleItem.click();
    await this.loanConfigurationItem.click();
    await this.preClosureLink.click();
    await this.formRoot.waitFor({ state: 'visible' });
  }

  // The list grid lives on the View route, reached from the form via the "View" link.
  async navigateToPreClosureList() {
    await this.navigateToPreClosure();
    await this.viewListLink.click();
    await this.listRoot.waitFor({ state: 'visible' });
  }

  async openNewForm() {
    await this.navigateToPreClosureList();
    await this.newButton.click();
    await this.formRoot.waitFor({ state: 'visible' });
  }

  async editRowByLoanName(loanName) {
    // Kendo grid: each row's action cell has #icon-edit / #icon-delete divs.
    const row = this.listRoot.locator('tr', { hasText: loanName }).first();
    await row.locator('#icon-edit').click();
    await this.formRoot.waitFor({ state: 'visible' });
  }

  async deleteRowByLoanName(loanName) {
    const row = this.listRoot.locator('tr', { hasText: loanName }).first();
    await row.locator('#icon-delete').click();
  }

  async fillForm({ loanType, loanName, lockInPeriodValue, lockInPeriodUnit, chargePercentage, interestOn, gstOption, gstPercent }) {
    if (loanType) {
      await this.loanTypeDropdown.selectOption({ label: loanType });
      // Loan Name options reload asynchronously once Loan Type changes.
      await this.page.waitForFunction(
        (el) => el.options.length > 1,
        await this.loanNameDropdown.elementHandle()
      );
    }
    if (loanName) await this.loanNameDropdown.selectOption({ label: loanName });
    if (lockInPeriodValue !== undefined) await this.minLockInPeriodInput.fill(String(lockInPeriodValue));
    if (lockInPeriodUnit) await this.minLockInPeriodUnitDropdown.selectOption({ label: lockInPeriodUnit });
    if (chargePercentage !== undefined) await this.chargeTypePercentageInput.fill(String(chargePercentage));

    if (interestOn === 'Future Principal') {
      await this.interestFuturePrincipalRadio.check();
    } else if (interestOn === 'Future Principal and Outstanding Principal') {
      await this.interestFutureAndOutstandingRadio.check();
    }

    if (gstOption === 'Included') {
      await this.gstIncludedRadio.check();
    } else if (gstOption === 'Excluded') {
      await this.gstExcludedRadio.check();
      if (gstPercent) await this.gstPercentDropdown.selectOption({ label: String(gstPercent) });
    } else if (gstOption === 'No GST') {
      await this.gstNoGstRadio.check();
    }
  }

  async save() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.saveButton.click();
  }

  async clear() {
    await this.clearButton.scrollIntoViewIfNeeded();
    await this.clearButton.click();
  }

  async search(text) {
    await this.searchBox.fill(text);
  }

  async isLoanNamePresent(loanName) {
    return this.listRoot.getByText(loanName, { exact: true }).first().isVisible();
  }
}

module.exports = { PreClosurePage };
