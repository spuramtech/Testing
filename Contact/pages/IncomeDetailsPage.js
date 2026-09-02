const BasePage = require('./BasePage');
const { INCOME_SOURCE_TYPE } = require('../constants/appConstants');

// Scoped to #Income container. Radio ids match the constants exactly
// (INCOME/EXPENDETURE/ASSETS/LIABILITIES).
class IncomeDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#Income');
    const fc = (name) => this.container.locator(`[formcontrolname="${name}"]`);
    this.grossAnnualIncomeInput = fc('pgrossannualincome');
    this.netAnnualIncomeInput = fc('pnetannualincome');
    this.averageAnnualExpensesInput = fc('paverageannualexpenses');
    // Radios are zero-size/off-screen (a11y-hidden pattern) — click their
    // <label> instead, same as a real user would.
    this.incomeRadio = this.container.locator('label[for="INCOME"]');
    this.expenditureRadio = this.container.locator('label[for="EXPENDETURE"]');
    this.assetsRadio = this.container.locator('label[for="ASSETS"]');
    this.liabilitiesRadio = this.container.locator('label[for="LIABILITIES"]');
    this.selectSourceDropdown = this.container.locator('select#psourcename');
    this.annualAmountReceivedInput = fc('pgrossannual');
    // Verified live: "Add" is an <a class="btn">, not a <button>.
    this.addButton = this.container.locator('a.btn:visible').filter({ hasText: 'Add' });
    this.gridRows = this.container.locator('datatable-body-row');
    this.gridEmptyState = this.container.getByText('No records available.');
  }

  async fillTopLevelIncome({ grossAnnualIncome, netAnnualIncome, averageAnnualExpenses }) {
    if (grossAnnualIncome !== undefined) await this.fill(this.grossAnnualIncomeInput, String(grossAnnualIncome));
    if (netAnnualIncome !== undefined) await this.fill(this.netAnnualIncomeInput, String(netAnnualIncome));
    if (averageAnnualExpenses !== undefined) await this.fill(this.averageAnnualExpensesInput, String(averageAnnualExpenses));
  }

  async selectIncomeSourceType(type) {
    const map = {
      [INCOME_SOURCE_TYPE.INCOME]: this.incomeRadio,
      [INCOME_SOURCE_TYPE.EXPENDITURE]: this.expenditureRadio,
      [INCOME_SOURCE_TYPE.ASSETS]: this.assetsRadio,
      [INCOME_SOURCE_TYPE.LIABILITIES]: this.liabilitiesRadio,
    };
    await this.click(map[type]);
  }

  async addIncomeRow({ source, amount }) {
    await this.selectDropdown(this.selectSourceDropdown, source);
    await this.fill(this.annualAmountReceivedInput, String(amount));
    await this.click(this.addButton);
  }

  async getIncomeRowCount() {
    return this.gridRows.count();
  }
}

module.exports = IncomeDetailsPage;
