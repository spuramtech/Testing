const { expect } = require('@playwright/test');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class ContactPage {
  constructor(page) {
    this.page = page;
    this.saveAndContinue = page.getByText('Save & Continue', { exact: true }).locator('visible=true').first();
  }

  field(name) {
    return this.page.locator(`[formcontrolname=${name}]:visible`).first();
  }

  // Contact → Contact Configuration → Contact → New → Manual
  async openNewManualContact() {
    const p = this.page;
    await p.getByText('Contact', { exact: true }).first().click();
    await p.getByText('Contact Configuration', { exact: true }).click();
    await p.getByText('Contact', { exact: true }).last().click();
    await p.waitForURL(/#\/Contact\/ContactViewNew/);
    await p.locator('#dropdownMenuButton1').click();
    await p.getByText('Manual', { exact: true }).click();
    await p.waitForURL(/#\/Contact\/ContactNew/);
    await expect(this.field('pName')).toBeVisible();
  }

  async openTab(name) {
    await this.page.getByText(name, { exact: true }).locator('visible=true').first().click();
  }

  async selectNg(selector, text) {
    await this.page.locator(`${selector}:visible`).first().click();
    const option = this.page.locator('ng-dropdown-panel .ng-option', { hasText: text instanceof RegExp ? text : new RegExp(`^\\s*${text}\\s*$`, 'i') }).first();
    await option.click();
  }

  // Picks a date in the ngx-bootstrap calendar (the input itself is not typeable)
  async pickDate(control, dd, mm, yyyy) {
    await this.field(control).click();
    const cal = this.page.locator('bs-datepicker-container');
    await cal.locator('button.current').last().click(); // year view
    for (let i = 0; i < 10; i++) {
      const years = (await cal.locator('td span').allInnerTexts()).map(Number);
      if (years.includes(yyyy)) break;
      await cal.locator(yyyy < Math.min(...years) ? 'button.previous' : 'button.next').click();
    }
    await cal.locator('td span', { hasText: new RegExp(`^${yyyy}$`) }).click();
    await cal.locator('td span', { hasText: new RegExp(`^${MONTHS[mm - 1]}$`) }).click();
    await cal.locator('td span:not(.is-other-month)', { hasText: new RegExp(`^${dd}$`) }).first().click();
  }

  async fillContactInfo(d) {
    await this.selectNg('ng-select#pTitleName', d.title);
    await this.field('pName').fill(d.firstName);
    if (d.lastName) await this.field('pSurName').fill(d.lastName);
    if (d.fatherFirstName) await this.field('pFatherName').fill(d.fatherFirstName);
    await this.pickDate('pDob', ...d.dob);
    await this.page.locator(`input#${d.gender}[formcontrolname=pGender]`).first().check({ force: true });
    await this.field('pContactNumber').fill(d.mobile);
    if (d.email) await this.field('pEmailId').fill(d.email);
  }

  async fillAddress(a) {
    await this.openTab('Address Details');
    await this.field('pAddressType').selectOption({ label: a.addressType });
    await this.field('pResidencetype').selectOption({ label: a.residence });
    await this.field('pAddress1').fill(a.address);
    await this.field('pAddress2').fill(a.area);
    await this.field('pCity').fill(a.city);
    await this.selectNg('ng-select#pState', a.state);
    await this.selectNg('ng-select#pDistrict', a.district);
    await this.field('pPinCode').fill(a.pincode);
    await this.page.getByText('Add', { exact: true }).locator('visible=true').first().click();
    const row = this.page.getByText(a.pincode).locator('visible=true').first().locator('xpath=ancestor::*[.//input[@type="radio"]][1]');
    await expect(row).toBeVisible();
    await row.locator('input[type=radio]').check({ force: true });
  }

  async addDocument(doc) {
    await this.openTab('Documents');
    await this.selectNg('ng-select#pDocumentGroupId', doc.type);
    await this.selectNg('ng-select#pDocumentId', doc.name);
    await this.field('pDocReferenceno').fill(doc.reference);
    await this.page.getByText('Add', { exact: true }).locator('visible=true').first().click();
    await expect(this.page.getByText(doc.reference).locator('visible=true').first()).toBeVisible();
  }

  // Bank Details tab: IFSC → Bank Name / Branch (auto or pick first), Account Type, Mode, Name as per bank, Account No → Add → Primary
  async addBank(b) {
    const p = this.page;
    await this.openTab('Bank Details');
    await this.field('pBankifscCode').fill(b.ifsc);
    await this.field('pBankifscCode').press('Tab');
    await p.waitForTimeout(1500);
    // IFSC fills City only; Bank Name and Branch must be picked (type to filter, then choose)
    for (const [fc, text] of [['pBankName', b.bankName], ['pBankBranch', b.branch]]) {
      const sel = p.locator(`ng-select[formcontrolname=${fc}]`).locator('visible=true').first();
      const current = (await sel.locator('.ng-value-label').allInnerTexts()).join('').trim();
      if (current) continue;
      // options load from the server after typing – retry the pick up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        await sel.click();
        if (text) await sel.locator('input').fill(text);
        const opt = p.locator('ng-dropdown-panel .ng-option', text ? { hasText: new RegExp(text, 'i') } : {}).first();
        await opt.waitFor({ timeout: 5000 }).catch(() => {});
        await p.waitForTimeout(500);
        if (await opt.count()) await opt.click();
        await p.waitForTimeout(500);
        if ((await sel.locator('.ng-value-label').allInnerTexts()).join('').trim()) break;
        await p.keyboard.press('Escape');
        if (attempt === 3) throw new Error(`${fc}: could not select "${text}"`);
      }
    }
    if (b.city) await this.field('pCity').fill(b.city).catch(() => {});
    await this.field('pmodeofoperation').selectOption({ label: b.mode || 'Single' }).catch(() => {});
    await this.field('pNameasPerYourBank').fill(b.nameAsPerBank);
    await this.field('pBankAccountNo').fill(b.accountNo);
    await p.getByText('Add', { exact: true }).locator('visible=true').first().click();
    const row = p.locator('tr', { hasText: b.accountNo }).first();
    await expect(row).toBeVisible();
    await row.locator('input[type=radio], input[type=checkbox]').first().check({ force: true }).catch(() => {});
    return (await row.innerText()).replace(/\s+/g, ' ');
  }

  // Load an existing contact into the form ("Search Contact Name / Pan / Aadhar / Mobile Number / Email")
  async loadExisting(search) {
    const ng = this.page.locator('ng-select[formcontrolname=contactid]');
    await ng.click();
    await ng.locator('input').fill(search);
    const opt = this.page.locator('ng-dropdown-panel .ng-option', { hasText: search }).first();
    await expect(opt).toBeVisible();
    await this.page.waitForTimeout(800);
    await opt.click();
    await expect(this.field('pName')).not.toHaveValue('');
  }

  // Contact list: search by phone number and return the matching card text
  async findInList(mobile) {
    const p = this.page;
    await p.getByText('Contact', { exact: true }).last().click();
    await p.waitForURL(/#\/Contact\/ContactViewNew/);
    await p.locator('select:visible').first().selectOption({ label: 'Phone Number' });
    const box = p.locator('input[type=text]:visible').nth(1);
    await box.fill(mobile);
    await box.press('Enter');
    const card = p.getByText(`Mobile: ${mobile}`).locator('xpath=ancestor::div[3]');
    await expect(card).toBeVisible();
    return (await card.innerText()).replace(/\s+/g, ' ');
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { ContactPage };
