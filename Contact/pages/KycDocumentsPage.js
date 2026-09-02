const BasePage = require('./BasePage');

// Scoped to #kyc container (see AddressDetailsPage comment on why).
class KycDocumentsPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#kyc');
    this.documentTypeCombobox = this.container.locator('.ng-select').nth(0);
    this.documentNameCombobox = this.container.locator('.ng-select').nth(1);
    this.referenceNumberInput = this.container.locator('[formcontrolname="pDocReferenceno"]');
    // Verified live: "Add" is an <a class="btn">, not a <button>.
    this.addButton = this.container.locator('a.btn:visible').filter({ hasText: 'Add' });
    this.gridEmptyState = this.container.getByText('No data to display');
    this.gridRows = this.container.locator('datatable-body-row');
  }

  async addKycDocument({ documentType, documentName, referenceNumber }) {
    await this.selectNgOption(this.documentTypeCombobox, documentType);
    await this.selectNgOption(this.documentNameCombobox, documentName);
    await this.fill(this.referenceNumberInput, referenceNumber);
    await this.click(this.addButton);
  }

  async getDocumentRowCount() {
    return this.gridRows.count();
  }
}

module.exports = KycDocumentsPage;
