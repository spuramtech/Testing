const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

class ChargeConfigurationPage extends BasePage {
  constructor(page) {
    super(page);

    // Navigation
    this.loansMenu = page.locator('nav li').filter({ hasText: 'Loans' }).first();
    this.loanConfigurationMenu = page.getByText('Loan Configuration', { exact: true }).first();
    this.chargeConfigurationSubMenu = page.locator('nav a', { hasText: 'Charge Configuration' }).first();
    this.pageHeading = page.getByText('Charge Configuration', { exact: true }).first();
    this.viewButton = page.getByRole('link', { name: /view/i }).or(page.locator('a[routerlink*="ChargeconfigurationView"]')).first();

    // --- Header section: Loan Type / Loan Name / Charge Name ---
    this.loanTypeDropdown = page.locator('select[formcontrolname="pLoantypeid"]');
    this.loanNameDropdown = page.locator('select[formcontrolname="pLoanid"]');
    this.chargeNameDropdown = page.locator('select[formcontrolname="pChargeid"]');
    this.addAndSaveButton = page.getByText('Add and Save', { exact: false }).locator('visible=true').first();

    // Configured-charges sub-grid (Loan Type / Loan Name / Charge Fee / Config / Delete)
    this.configuredChargesTable = page.locator('#loanChargeTypeDataTable');
    this.configuredChargesRows = this.configuredChargesTable.locator('tbody tr:visible');
    this.configuredChargesEmptyState = this.configuredChargesTable.getByText('No data available in table');

    // --- Charge Amount panel (scoped) ---
    this.chargeAmountPanel = page.locator('#chargeamount');
    this.chargeAmountHeading = this.chargeAmountPanel.locator('p.bc-2');

    // Dependency toggle
    this.dependentOnRangeRadio = page.locator('#chargeloanrange');
    this.dependentOnRangeLabel = page.locator('label[for="chargeloanrange"]');
    this.notDependentOnRangeRadio = page.locator('#nondepend');
    this.notDependentOnRangeLabel = page.locator('label[for="nondepend"]');

    // Common fields
    this.applicantTypeDropdown = page.locator('select[formcontrolname="pApplicanttype"]');
    this.loanPayInDropdown = page.locator('select[formcontrolname="pLoanpayin"]');

    // Dependent-on-range mode
    this.onValueRadio = page.locator('#rangevalue');
    this.onValueLabel = page.locator('label[for="rangevalue"]');
    this.onTenureRadio = page.locator('#rangetenure');
    this.onTenureLabel = page.locator('label[for="rangetenure"]');
    this.minLoanValueInput = page.locator('input[formcontrolname="pMinLoanAmountorTenure"]');
    this.maxLoanValueInput = page.locator('input[formcontrolname="pMaxLoanAmountorTenure"]');
    this.rangePercentageInput = page.locator('input[formcontrolname="pChargePercentage"]');
    this.minChargeInput = page.locator('input[formcontrolname="pMinchargesvalue"]');
    this.maxChargeInput = page.locator('input[formcontrolname="pMaxchargesvalue"]');
    this.clearGridButton = page.getByText('Clear Grid', { exact: false }).locator('visible=true').first();
    this.addToGridButton = page.getByText('Add to Grid', { exact: false }).locator('visible=true').first();
    this.rangeGridTable = page.locator('#loanChargeAmountsDataTable');
    this.rangeGridRows = this.rangeGridTable.locator('tbody tr:visible');
    this.rangeGridEmptyState = this.rangeGridTable.getByText('No data available in table');

    // Not-dependent mode
    this.chargeTypeFixedRadio = page.locator('#chargetypefixed');
    this.chargeTypeFixedLabel = page.locator('label[for="chargetypefixed"]');
    this.chargeTypePercentageRadio = page.locator('#chargetypeper');
    this.chargeTypePercentageLabel = page.locator('label[for="chargetypeper"]');
    this.chargeTypePercentageInput = page.locator('input[formcontrolname="pChargeTypePercentage"]');
    this.minimumChargeAmountInput = page.locator('input[formcontrolname="pChargeTypePercentageMin"]');
    this.maximumChargeAmountInput = page.locator('input[formcontrolname="pChargeTypePercentageMax"]');

    // GST Type
    this.gstIncludeRadio = page.locator('#chargedependgstinc');
    this.gstIncludeLabel = page.locator('label[for="chargedependgstinc"]');
    this.gstExcludeRadio = page.locator('#chargedependgstexc');
    this.gstExcludeLabel = page.locator('label[for="chargedependgstexc"]');
    this.gstNoneRadio = page.locator('#chargedependgstnone');
    this.gstNoneLabel = page.locator('label[for="chargedependgstnone"]');
    this.gstPercentageDropdown = page.locator('select[formcontrolname="pGstvalue"]');

    // Effective date
    this.effectiveFromDateInput = page.locator('input[formcontrolname="pChargeEffectFrom"]');

    // Add Charge -> appends to master grid
    this.addChargeButton = page.getByText('Add Charge', { exact: false }).locator('visible=true').first();
    this.masterGridTable = page.locator('#loanChargeConfigDataTable');
    this.masterGridRows = this.masterGridTable.locator('tbody tr:visible');
    this.masterGridEmptyState = this.masterGridTable.getByText('No data available in table');

    // Page-level actions
    this.clearButton = page.getByText('Clear', { exact: true }).locator('visible=true').first();
    this.submitButton = page.getByText('Submit', { exact: true }).locator('visible=true').first();
  }

  async navigateFromMainMenu() {
    logger.info('Navigating to Charge Configuration screen');
    await this.loansMenu.click({ force: true });
    await this.loanConfigurationMenu.click();
    await this.chargeConfigurationSubMenu.click();
    await this.pageHeading.waitFor({ state: 'visible' });
    // Loan Type options render asynchronously after the component initializes.
    await this.waitForOptionsToLoad(this.loanTypeDropdown);
  }

  async waitForOptionsToLoad(dropdownLocator, minOptions = 2) {
    await this.page.waitForFunction(
      ({ selector, min }) => {
        const el = document.querySelector(selector);
        return !!el && el.options.length >= min;
      },
      { selector: await dropdownLocator.evaluate((el) => `[formcontrolname="${el.getAttribute('formcontrolname')}"]`), min: minOptions }
    );
  }

  // --- Header section ---
  async selectLoanType(loanType) {
    await this.selectDropdownOption(this.loanTypeDropdown, loanType);
    // The Loan Name dropdown repopulates via AJAX once a Loan Type is chosen.
    await this.waitForOptionsToLoad(this.loanNameDropdown);
  }

  async selectLoanName(loanName) {
    await this.selectDropdownOption(this.loanNameDropdown, loanName);
    // The Charge Name dropdown and the configured-charges DataTable both refresh via AJAX
    // once a Loan Name is chosen; give the DataTable redraw time to settle before callers
    // inspect the grid.
    await this.waitForOptionsToLoad(this.chargeNameDropdown, 1);
    await this.page.waitForTimeout(800);
  }

  async selectChargeName(chargeName) {
    await this.selectDropdownOption(this.chargeNameDropdown, chargeName);
  }

  async getChargeNameOptions() {
    return this.chargeNameDropdown.locator('option').allTextContents();
  }

  async clickAddAndSave() {
    await this.addAndSaveButton.click();
  }

  configuredChargeRowByChargeName(chargeName) {
    return this.configuredChargesRows.filter({ hasText: chargeName });
  }

  async getConfiguredChargesCount() {
    const isEmpty = await this.configuredChargesEmptyState.isVisible().catch(() => false);
    return isEmpty ? 0 : this.configuredChargesRows.count();
  }

  async openConfigForCharge(chargeName) {
    const row = this.configuredChargeRowByChargeName(chargeName);
    await row.getByText(/config/i).click();
    await this.chargeAmountPanel.waitFor({ state: 'visible' });
  }

  // Reads the Charge/Fee column (4th <td>) directly instead of parsing the row's innerText -
  // the row's "Config" action renders on its own line, so a naive split('\n').pop() picks up
  // stray whitespace/tab text instead of the charge name.
  async getConfiguredChargeNames() {
    const isEmpty = await this.configuredChargesEmptyState.isVisible().catch(() => false);
    if (isEmpty) return [];
    const count = await this.configuredChargesRows.count();
    const names = [];
    for (let i = 0; i < count; i += 1) {
      const text = await this.configuredChargesRows.nth(i).locator('td').nth(3).innerText();
      names.push(text.trim());
    }
    return names;
  }

  async openConfigForRow(index = 0) {
    await this.configuredChargesRows.nth(index).getByText(/config/i).click();
    await this.chargeAmountPanel.waitFor({ state: 'visible' });
  }

  async deleteConfiguredCharge(chargeName) {
    const row = this.configuredChargeRowByChargeName(chargeName);
    await row.locator('a, button, i').filter({ hasText: '' }).last().click();
  }

  // --- Charge Amount panel ---
  async selectDependentOnRange() {
    await this.dependentOnRangeLabel.click();
    // Angular swaps in the mode-specific fieldset asynchronously after the radio's change event.
    await this.onValueRadio.waitFor({ state: 'visible' });
  }

  async selectNotDependentOnRange() {
    await this.notDependentOnRangeLabel.click();
    await this.chargeTypeFixedRadio.waitFor({ state: 'visible' });
  }

  async selectApplicantType(value) {
    await this.selectDropdownOption(this.applicantTypeDropdown, value);
  }

  async selectLoanPayIn(value) {
    await this.selectDropdownOption(this.loanPayInDropdown, value);
  }

  // Dependent-on-range mode
  async selectOnValue() {
    await this.onValueLabel.click();
  }

  async selectOnTenure() {
    await this.onTenureLabel.click();
  }

  async fillRange({ minLoanValue, maxLoanValue, percentage, minCharge, maxCharge } = {}) {
    if (minLoanValue !== undefined) await this.minLoanValueInput.fill(String(minLoanValue));
    if (maxLoanValue !== undefined) await this.maxLoanValueInput.fill(String(maxLoanValue));
    if (percentage !== undefined) await this.rangePercentageInput.fill(String(percentage));
    if (minCharge !== undefined) await this.minChargeInput.fill(String(minCharge));
    if (maxCharge !== undefined) await this.maxChargeInput.fill(String(maxCharge));
  }

  async clickAddToGrid() {
    await this.addToGridButton.click();
  }

  async clickClearGrid() {
    await this.clearGridButton.click();
  }

  async getRangeGridCount() {
    const isEmpty = await this.rangeGridEmptyState.isVisible().catch(() => false);
    return isEmpty ? 0 : this.rangeGridRows.count();
  }

  // Not-dependent mode
  async selectChargeTypeFixed() {
    await this.chargeTypeFixedLabel.click();
  }

  async selectChargeTypePercentage() {
    await this.chargeTypePercentageLabel.click();
  }

  async fillNotDependentAmounts({ percentage, minimumChargeAmount, maximumChargeAmount } = {}) {
    if (percentage !== undefined) await this.chargeTypePercentageInput.fill(String(percentage));
    if (minimumChargeAmount !== undefined) await this.minimumChargeAmountInput.fill(String(minimumChargeAmount));
    if (maximumChargeAmount !== undefined) await this.maximumChargeAmountInput.fill(String(maximumChargeAmount));
  }

  // GST Type
  async selectGstInclude() {
    await this.gstIncludeLabel.click();
  }

  async selectGstExclude(gstPercentage) {
    await this.gstExcludeLabel.click();
    if (gstPercentage !== undefined) await this.selectDropdownOption(this.gstPercentageDropdown, String(gstPercentage));
  }

  async selectNoGst() {
    await this.gstNoneLabel.click();
  }

  async setEffectiveFromDate() {
    // Read-only bsdatepicker input; defaults to current date. Exposed for explicit-wait assertions.
    return this.effectiveFromDateInput.inputValue();
  }

  async clickAddCharge() {
    await this.addChargeButton.click();
  }

  async getMasterGridCount() {
    const isEmpty = await this.masterGridEmptyState.isVisible().catch(() => false);
    return isEmpty ? 0 : this.masterGridRows.count();
  }

  // --- Page-level actions ---
  async clickClear() {
    await this.clearButton.click();
  }

  async clickSubmit() {
    logger.info('Submitting Charge Configuration form');
    await this.submitButton.click();
  }
}

module.exports = { ChargeConfigurationPage };
