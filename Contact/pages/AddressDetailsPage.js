const BasePage = require('./BasePage');

// Verified live: all 8 tab sections coexist in the DOM simultaneously
// (hidden via CSS, not removed), and several formcontrolnames/empty-state
// texts repeat across tabs (e.g. pAddress1 in both Address and GST). Every
// locator here is scoped to the tab's own container: <... id="address">.
// Country/State/District are <ng-select> comboboxes (no formcontrolname on
// the visible input) and are REQUIRED — "Add" silently no-ops without them.
// The result grid is an <ngx-datatable>, not a native <table>.
class AddressDetailsPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.locator('#address');
    const fc = (name) => this.container.locator(`[formcontrolname="${name}"]`);
    this.addressTypeDropdown = fc('pAddressType');
    this.residenceDropdown = fc('pResidencetype');
    this.addressInput = fc('pAddress1');
    this.areaInput = fc('pAddress2');
    this.cityVillageInput = fc('pCity');
    this.ngSelects = this.container.locator('ng-select');
    this.countryCombobox = this.ngSelects.nth(0);
    this.stateCombobox = this.ngSelects.nth(1);
    this.districtCombobox = this.ngSelects.nth(2);
    this.pincodeInput = fc('pPinCode');
    this.longitudeInput = fc('plongitude');
    this.latitudeInput = fc('platitude');
    // Verified live: "Add" is an <a class="btn">, not a <button>.
    this.addButton = this.container.locator('a.btn:visible').filter({ hasText: 'Add' }).first();
    this.addressGridRows = this.container.locator('datatable-body-row');
  }

  async addAddress({ addressType, residence, address, city, state = 'Delhi', district, pincode, area, longitude, latitude }) {
    if (addressType) await this.selectDropdown(this.addressTypeDropdown, addressType);
    if (residence) await this.selectDropdown(this.residenceDropdown, residence);
    await this.fill(this.addressInput, address);
    if (area) await this.fill(this.areaInput, area);
    await this.fill(this.cityVillageInput, city);
    await this.selectNgOption(this.countryCombobox, 'India');
    await this.selectNgOption(this.stateCombobox, state);
    if (district) {
      await this.selectNgOption(this.districtCombobox, district);
    } else {
      // District options depend on the selected state — just take the
      // first available one when the caller doesn't care which.
      await this.click(this.districtCombobox);
      const firstOption = this.page.locator('.ng-dropdown-panel .ng-option:visible').first();
      await firstOption.waitFor({ state: 'visible', timeout: 15000 });
      await firstOption.click();
      await this.page.waitForTimeout(400);
    }
    await this.fill(this.pincodeInput, pincode);
    if (longitude) await this.fill(this.longitudeInput, longitude);
    if (latitude) await this.fill(this.latitudeInput, latitude);
    await this.click(this.addButton);
    // Grid insert (when it succeeds) is an async re-render (ngx-datatable).
    // Give it a moment to settle before a caller reads row count — but
    // don't assert an increase here: this method is also used by negative
    // tests where Add is expected to silently reject bad input.
    await this.page.waitForTimeout(1000);
  }

  async getAddressRowCount() {
    return this.addressGridRows.count();
  }
}

module.exports = AddressDetailsPage;
