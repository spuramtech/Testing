const BasePage = require('./BasePage');

// Scoped to #gst container (see AddressDetailsPage comment on why).
class GstPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#gst');
    const fc = (name) => this.container.locator(`[formcontrolname="${name}"]`);
    this.gstTypeDropdown = fc('GSTType');
    this.gstInInput = fc('GSTIN');
    // GST State / Country / State are <ng-select> comboboxes, same pattern
    // as Address Details.
    this.ngSelects = this.container.locator('ng-select');
    this.gstStateCombobox = this.ngSelects.nth(0);
    this.countryCombobox = this.ngSelects.nth(1);
    this.stateCombobox = this.ngSelects.nth(2);
    this.addressInput = fc('pAddress1');
    this.areaInput = fc('pAddress2');
    this.cityVillageInput = fc('pCity');
    this.pincodeInput = fc('pPinCode');
    this.gstStartDateInput = fc('pGSTStartdate');
    // Verified live: Add/Clear are <a class="btn">, not <button>.
    this.clearButton = this.container.locator('a.btn:visible').filter({ hasText: /^Clear$/i });
    this.addButton = this.container.locator('a.btn:visible').filter({ hasText: 'Add' });
    this.gridEmptyState = this.container.getByText('No records available.');
    this.gridRows = this.container.locator('datatable-body-row');
  }

  async addGstRecord({ gstType, gstIn, address, city, pincode, startDate }) {
    if (gstType) await this.selectDropdown(this.gstTypeDropdown, gstType);
    if (gstIn) await this.fill(this.gstInInput, gstIn);
    if (address) await this.fill(this.addressInput, address);
    if (city) await this.fill(this.cityVillageInput, city);
    if (pincode) await this.fill(this.pincodeInput, pincode);
    if (startDate) await this.fill(this.gstStartDateInput, startDate);
    await this.click(this.addButton);
  }

  async getGstRowCount() {
    return this.gridRows.count();
  }
}

module.exports = GstPage;
