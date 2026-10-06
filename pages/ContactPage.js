class ContactPage {
  constructor(page) {
    this.page = page;
    this.contactToolbarBtn = page.getByText('Contact', { exact: true }).first();
    this.searchBox = page.locator('#pSearchText');
    this.newBtn = page.getByText('New', { exact: true });
    this.saveBtn = page.getByRole('button', { name: 'Save Contact' });
    this.clearBtn = page.locator('a.btn-g-icon:visible', { hasText: 'Clear' });
    this.individualRadio = page.getByText('Individual', { exact: true });
    this.businessRadio = page.getByText('Business Entity', { exact: true });
    this.addAddressBtn = page.locator('.btn-b-icon').filter({ hasText: 'Add' }).first();
    this.previousLink = page.getByText('Previous', { exact: true });
  }

  async openTab(tabName) {
    await this.page.getByRole('link', { name: tabName, exact: true }).click();
    await this.page.waitForTimeout(700);
  }

  async blurToTrigger() {
    await this.page.locator('input[formcontrolname="pFatherName"]').click();
    await this.page.waitForTimeout(600);
  }

  async fillField(formcontrolname, value) {
    await this.page.locator(`input[formcontrolname="${formcontrolname}"]`).fill(value);
  }

  async fieldValue(formcontrolname) {
    return this.page.locator(`input[formcontrolname="${formcontrolname}"]`).inputValue();
  }

  async fillMandatoryExcept(data, skipField) {
    if (skipField !== 'title') await this.selectTitle(data.title);
    if (skipField !== 'relationTitle') await this.page.locator('select[formcontrolname="rTitleName"]').selectOption({ index: 1 });
    if (skipField !== 'name') await this.page.locator('input[formcontrolname="pName"]').fill(data.name);
    if (skipField !== 'fatherName') await this.page.locator('input[formcontrolname="pFatherName"]').fill(data.fatherName);
    if (skipField !== 'contactNumber') await this.page.locator('input[formcontrolname="pContactNumber"]').fill(data.contactNumber);
  }

  async fillAddressExcept(address, skipField) {
    if (skipField !== 'plot') await this.page.locator('input[formcontrolname="pAddress1"]').fill(address.plot);
    if (skipField !== 'street') await this.page.locator('input[formcontrolname="pAddress3"]').fill(address.street);
    if (skipField !== 'area') await this.page.locator('input[formcontrolname="pAddress2"]').fill(address.area);
    if (skipField !== 'city') await this.page.locator('input[formcontrolname="pCity"]').fill(address.city);
    await this.selectNgSelectByLabel('Country', address.country);
    await this.page.waitForTimeout(500);
    await this.selectNgSelectByLabel('State', address.state);
    await this.page.waitForTimeout(500);
    await this.selectNgSelectByLabel('District', address.district);
    if (skipField !== 'pincode') await this.page.locator('input[formcontrolname="pPinCode"]').fill(address.pincode);
  }

  async openFirstSearchResultEdit() {
    await this.page.locator('a:has-text("Edit")').first().click();
    await this.page.waitForTimeout(2000);
  }

  async openFromDashboard() {
    await this.contactToolbarBtn.click();
    await this.page.waitForTimeout(1500);
  }

  async openNewForm() {
    await this.newBtn.click();
    await this.page.waitForTimeout(1200);
  }

  async search(text) {
    await this.searchBox.fill('');
    await this.searchBox.fill(text);
    await this.page.waitForTimeout(1200);
  }

  async selectTitle(labelText) {
    const select = this.page.locator('select').first();
    await select.selectOption({ label: labelText });
  }

  async selectRelationTitle(labelText) {
    const select = this.page.locator('select').nth(1);
    await select.selectOption({ label: labelText });
  }

  async fillPersonalDetails({ name, surname, fatherName, contactNumber, email }) {
    await this.page.locator('input[formcontrolname="pName"]').fill(name);
    if (surname) await this.page.locator('input[formcontrolname="pSurName"]').fill(surname);
    await this.page.locator('input[formcontrolname="pFatherName"]').fill(fatherName);
    await this.page.locator('input[formcontrolname="pContactNumber"]').fill(contactNumber);
    if (email) await this.page.locator('input[formcontrolname="pEmailId"]').fill(email);
  }

  async selectNgSelectByLabel(fieldLabel, optionText) {
    const label = this.page.locator(`label:has-text("${fieldLabel}")`).first();
    const ngSelect = label.locator('xpath=following::ng-select[1]').first();
    await ngSelect.click();
    await this.page.waitForTimeout(500);
    const option = this.page.locator('.ng-option', { hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click({ timeout: 10000 });
    await this.page.waitForTimeout(300);
  }

  async fillAddress({ plot, street, area, city, pincode, country, state, district }) {
    await this.page.locator('input[formcontrolname="pAddress1"]').fill(plot);
    await this.page.locator('input[formcontrolname="pAddress3"]').fill(street);
    await this.page.locator('input[formcontrolname="pAddress2"]').fill(area);
    await this.page.locator('input[formcontrolname="pCity"]').fill(city);
    await this.selectNgSelectByLabel('Country', country);
    await this.page.waitForTimeout(500);
    await this.selectNgSelectByLabel('State', state);
    await this.page.waitForTimeout(500);
    await this.selectNgSelectByLabel('District', district);
    await this.page.locator('input[formcontrolname="pPinCode"]').fill(pincode);
  }
}

module.exports = { ContactPage };
