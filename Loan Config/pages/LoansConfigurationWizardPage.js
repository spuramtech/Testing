const { BasePage } = require('./BasePage');
const { logger } = require('../utils/logger');

const TABS = {
  LOAN_CREATION: 'Loan Creation',
  LOAN_CONFIGURATION: 'Loan Configuration',
  INSTALLMENT_DUE_DATE: 'Installment Due Date',
  PENAL_INTEREST: 'Penal Interest',
  IDENTIFICATION_DOCUMENTS: 'Identification Documents',
};

class LoansConfigurationWizardPage extends BasePage {
  constructor(page) {
    super(page);

    // Tab pills
    this.tabs = Object.fromEntries(
      Object.values(TABS).map((label) => [label, page.getByRole('tab', { name: label })])
    );

    // Common actions - rendered as tab/generic elements in the live DOM, not <button>.
    this.nextButton = page.getByText('Next', { exact: true }).locator('visible=true').first();
    this.clearButton = page.getByText('Clear', { exact: true }).locator('visible=true').first();
    this.submitButton = page.getByText('Submit', { exact: true }).locator('visible=true').first();

    // Tab 1 - Loan Creation
    this.loanTypeDropdown = page.locator('select').filter({ has: page.locator('option', { hasText: 'Bullet Loan' }) }).first();
    this.loanNameInput = page.getByPlaceholder(/enter loan name/i);
    this.loanCodeInput = page.getByPlaceholder(/loan code/i);
    // Company Code / Branch Code render as read-only <label> display fields (auto-populated),
    // not editable inputs, confirmed against the live DOM.
    this.companyCodeDisplay = page.locator('div.form-group', { hasText: 'Company Code' }).locator('label.border-warning');
    this.branchCodeDisplay = page.locator('div.form-group', { hasText: 'Branch Code' }).locator('label.border-warning');
    this.seriesInput = page.locator('div.col-md-3', { hasText: 'Series' }).locator('input');
    this.loanIdInput = page.locator('div.col-md-3', { hasText: 'Loan ID' }).locator('input, label.border-warning');
    this.creationGridRows = page.locator("table tbody tr:visible");

    // Tab 2 - Loan Configuration
    // Locators use the Angular formcontrolname attribute, scoped under the #loanconfig tabpanel -
    // several formcontrolname values are duplicated elsewhere in the live DOM (e.g. a hidden
    // second copy of the interest-rate-type select), and several <label>s here lack a matching
    // `for`/id association, so plain page-wide locators are unreliable.
    const tab2 = page.locator('#loanconfig');
    this.individualRadio = tab2.locator('input[formcontrolname="pContacttype"][value="Individual"]');
    this.businessEntityRadio = tab2.locator('input[formcontrolname="pContacttype"][value="Business Entity"]');
    this.applicantTypeInput = tab2.locator('select[formcontrolname="pApplicanttype"]');
    this.fixedInterestRadio = tab2.locator('input[formcontrolname="pintrestmode"][value="Fixed"]');
    this.floatingInterestRadio = tab2.locator('input[formcontrolname="pintrestmode"][value="Floating"]');
    this.loanPayInPeriodDropdown = tab2.locator('select[formcontrolname="pLoanpayin"]');
    this.interestRateTypeDropdown = tab2.locator('select[formcontrolname="pInteresttype"]');
    this.interestRateMinInput = tab2.locator('input[formcontrolname="pMininterest"]');
    this.interestRateMaxInput = tab2.locator('input[formcontrolname="pRateofinterest"]');
    this.loanAmountNotApplicableCheckbox = tab2.locator('input[formcontrolname="pIsamountrangeapplicable"]');
    this.minLoanAmountInput = tab2.locator('input[formcontrolname="pMinloanamount"]');
    this.maxLoanAmountInput = tab2.locator('input[formcontrolname="pMaxloanamount"]');
    this.tenureNotApplicableCheckbox = tab2.locator('input[formcontrolname="pIstenurerangeapplicable"]');
    this.tenureFromInput = tab2.locator('input[formcontrolname="pTenurefrom"]');
    this.tenureToInput = tab2.locator('input[formcontrolname="pTenureto"]');
    this.effectiveFromDatePicker = tab2.locator('input[formcontrolname="pEffectfromdate"]');
    this.addButton = page.getByRole('button', { name: /^add$/i });
    this.configurationGridRows = page.locator("table tbody tr:visible");
    this.configurationGridEmptyState = page.getByText('No data available in table').first();

    // Tab 3 - Installment Due Date
    // The EMI/No EMI radios share a duplicate id in the live DOM (an app bug), which breaks
    // label/role-based lookup - formcontrolname+value is unambiguous.
    this.emiRadio = page.locator('input[formcontrolname="loaninstalmentmode"][value="EMI"]').first();
    this.noEmiRadio = page.locator('input[formcontrolname="loaninstalmentmode"][value="NO EMI"]').first();
    this.loanInstallmentModeDropdown = page.locator('select[formcontrolname="loaninstalmenttype"]').first();
    this.dueDateFixedDateRadio = page.getByRole('radio', { name: /a fixed date of a month/i }).first();
    this.dueDateDisbursalRadio = page.getByRole('radio', { name: /based on loan disbursal date/i }).first();
    this.dueDateInstallmentRadio = page.getByRole('radio', { name: /installment due date/i }).first();
    this.dueDateEndOfMonthRadio = page.getByRole('radio', { name: /end of the month/i }).first();
    // Selecting "A fixed date of a month" reveals a required day-of-month input.
    this.fixedDateOfMonthInput = page.locator('input[formcontrolname="pInstalmentdueday"]').first();

    // Tab 4 - Penal Interest
    // Several ids on this tab are duplicated in the live DOM (an app bug, same as Tab 3),
    // breaking label/role-based lookup - formcontrolname is unambiguous.
    this.simpleInterestRadio = page.locator('input[formcontrolname="ptypeofpenalinterest"][value="Simple Interest"]').first();
    this.fixedPercentRadio = page.locator('input[formcontrolname="pduepenaltytype"][value="Fixed"]').first();
    this.fixedPercentInput = page.locator('input[formcontrolname="pduepenaltyvalue"]').first();
    this.gracePeriodInput = page.locator('input[formcontrolname="ppenaltygraceperiod"]').first();

    // Tab 5 - Identification Documents
    this.accordionHeaders = {
      panFormSixty: page.getByText('PAN / FORM 60').first(),
      identificationDocuments: page.getByText('Identification Documents', { exact: false }).first(),
      addressDocuments: page.getByText('Address Documents').first(),
      financialDocuments: page.getByText('Financial Documents').first(),
      bankProof: page.getByText('Bank Proof').first(),
    };
  }

  async goToTab(tabName) {
    logger.info(`Navigating to tab: ${tabName}`);
    await this.tabs[tabName].click();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickClear() {
    await this.clearButton.click();
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  // --- Tab 1: Loan Creation ---
  async fillLoanCreation({ loanType, loanName, loanCode, series }) {
    // Company Code / Branch Code / Loan ID are read-only, auto-populated by the app and are
    // not set by this method.
    if (loanType) await this.selectDropdownOption(this.loanTypeDropdown, loanType);
    if (loanName !== undefined) await this.loanNameInput.fill(loanName);
    if (loanCode !== undefined) await this.loanCodeInput.fill(loanCode);
    if (series !== undefined) await this.seriesInput.fill(series);
  }

  async creationGridRowByLoanName(loanName) {
    return this.creationGridRows.filter({ hasText: loanName });
  }

  // --- Tab 2: Loan Configuration ---
  async selectContactType(type) {
    if (/business/i.test(type)) await this.businessEntityRadio.check();
    else await this.individualRadio.check();
  }

  async selectInterestMode(mode) {
    if (/floating/i.test(mode)) await this.floatingInterestRadio.check();
    else await this.fixedInterestRadio.check();
  }

  async setLoanAmountNotApplicable(checked) {
    const isChecked = await this.loanAmountNotApplicableCheckbox.isChecked().catch(() => false);
    if (checked !== isChecked) await this.loanAmountNotApplicableCheckbox.click();
  }

  async setTenureNotApplicable(checked) {
    const isChecked = await this.tenureNotApplicableCheckbox.isChecked().catch(() => false);
    if (checked !== isChecked) await this.tenureNotApplicableCheckbox.click();
  }

  async fillLoanConfiguration(data = {}) {
    if (data.contactType) await this.selectContactType(data.contactType);
    if (data.applicantType) await this.applicantTypeInput.fill(data.applicantType);
    if (data.interestMode) await this.selectInterestMode(data.interestMode);
    if (data.loanPayInPeriod) await this.selectDropdownOption(this.loanPayInPeriodDropdown, data.loanPayInPeriod);
    if (data.interestRateType) await this.selectDropdownOption(this.interestRateTypeDropdown, data.interestRateType);
    if (data.interestRateMin !== undefined) await this.interestRateMinInput.fill(String(data.interestRateMin));
    if (data.interestRateMax !== undefined) await this.interestRateMaxInput.fill(String(data.interestRateMax));

    if (data.loanAmountNotApplicable !== undefined) {
      await this.setLoanAmountNotApplicable(data.loanAmountNotApplicable);
      if (!data.loanAmountNotApplicable) {
        if (data.minLoanAmount !== undefined) await this.minLoanAmountInput.fill(String(data.minLoanAmount));
        if (data.maxLoanAmount !== undefined) await this.maxLoanAmountInput.fill(String(data.maxLoanAmount));
      }
    }

    if (data.tenureNotApplicable !== undefined) {
      await this.setTenureNotApplicable(data.tenureNotApplicable);
      if (!data.tenureNotApplicable) {
        if (data.tenureFrom !== undefined) await this.tenureFromInput.fill(String(data.tenureFrom));
        if (data.tenureTo !== undefined) await this.tenureToInput.fill(String(data.tenureTo));
      }
    }
  }

  async addConfigurationRow() {
    await this.addButton.click();
  }

  async getConfigurationRowCount() {
    // The DataTable renders its "No data available in table" empty state as a <tr> itself,
    // so a naive row count always reads >= 1 even when the grid is empty.
    const isEmpty = await this.configurationGridEmptyState.isVisible().catch(() => false);
    return isEmpty ? 0 : this.configurationGridRows.count();
  }

  // --- Tab 3: Installment Due Date ---
  async selectInstallmentTypeConfig(type) {
    if (/no emi/i.test(type)) await this.noEmiRadio.check();
    else await this.emiRadio.check();
  }

  async selectInstallmentDueDateOption(option) {
    const map = {
      fixedDate: this.dueDateFixedDateRadio,
      disbursalDate: this.dueDateDisbursalRadio,
      installmentDueDate: this.dueDateInstallmentRadio,
      endOfMonth: this.dueDateEndOfMonthRadio,
    };
    await map[option].check();
    if (option === 'fixedDate') {
      await this.fixedDateOfMonthInput.fill('10');
    }
  }

  async fillInstallmentDueDate(data = {}) {
    if (data.installmentTypeConfig) await this.selectInstallmentTypeConfig(data.installmentTypeConfig);
    if (data.loanInstallmentMode) await this.selectDropdownOption(this.loanInstallmentModeDropdown, data.loanInstallmentMode);
    if (data.dueDateOption) await this.selectInstallmentDueDateOption(data.dueDateOption);
  }

  // --- Tab 4: Penal Interest ---
  async fillPenalInterest({ fixedPercent, gracePeriodDays } = {}) {
    await this.simpleInterestRadio.check().catch(() => {});
    if (fixedPercent !== undefined) {
      await this.fixedPercentRadio.check().catch(() => {});
      await this.fixedPercentInput.fill(String(fixedPercent)).catch(() => {});
    }
    if (gracePeriodDays !== undefined) await this.gracePeriodInput.fill(String(gracePeriodDays));
  }

  // --- Tab 5: Identification Documents ---
  async expandAccordion(sectionKey) {
    await this.accordionHeaders[sectionKey].click();
  }

  async toggleProofCheckbox(rowLabel, columnName) {
    // The Mandatory/Required checkboxes render with empty <label for=""> text (an app bug),
    // so they have no accessible name - select by fixed column position instead:
    // column 0 = Mandatory, column 1 = Required, per the documented table layout.
    const columnIndex = { mandatory: 0, required: 1 }[columnName.toLowerCase()];
    const row = this.page.locator('tr').filter({ hasText: rowLabel }).first();
    await row.locator('input[type="checkbox"]').nth(columnIndex).click();
  }

  async submitWizard() {
    logger.info('Submitting Loans Configuration wizard');
    await this.clickSubmit();
  }
}

module.exports = { LoansConfigurationWizardPage, TABS };
