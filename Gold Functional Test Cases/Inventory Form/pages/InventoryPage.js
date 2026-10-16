const { expect } = require('@playwright/test');
const nav = require('../../common/utils/nav');

// Loans → Gold → Inventory Form (#/Loans/InventoryForm): bind a pledged loan's collateral to a printed BH packet barcode and store it
// in a vault/safe/locker. "View" opens the saved inventories (#/Loans/InventoryFormView).
class InventoryPage {
  constructor(page) {
    this.page = page;
    this.transDate = page.locator('[formcontrolname=pTransdate]');
    this.loanType = page.locator('select[formcontrolname=ploantypeid]');
    this.loan = page.locator('ng-select[formcontrolname=pLoanid]');
    this.packetNo = page.locator('[formcontrolname=pPacketno]');
    this.scan = page.getByPlaceholder('Scan barcode here');
    this.bindBtn = page.locator('button:visible').filter({ hasText: /Bind To Packet No/i });
    this.photo = page.locator('input[type=file]:visible').first();
    this.vault = page.locator('ng-select[formcontrolname=pVaultid]');
    this.vaultCode = page.locator('[formcontrolname=pVaultloancode]');
    this.safe = page.locator('select[formcontrolname=pCabinetid]');
    this.locker = page.locator('select[formcontrolname=pLockerno]');
    this.remarks = page.locator('textarea[formcontrolname=pRemarks]');
    this.add = page.locator('button:visible').filter({ hasText: /^\W*Add\s*$/ });
    this.save = page.locator('button:visible').filter({ hasText: /^\W*Save\s*$/ }).last();
    this.clear = page.locator('button:visible, a:visible, .btn:visible').filter({ hasText: /^\W*Clear\s*$/ }).last();
    this.toasts = page.locator('.toast-message, .swal2-html-container, .swal2-title');
  }

  async open() {
    const p = this.page;
    await nav.go(p, 'Inventory Form', ['Loans', 'Gold']);
    await p.waitForURL(/InventoryForm/);
    await expect(this.loanType).toBeVisible();
    await p.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async openView() {
    await this.open();
    await this.page.getByText('View', { exact: true }).first().click();
    await this.page.waitForURL(/InventoryFormView/);
    await this.page.locator('tr:visible', { hasText: /INV\d{8,}/ }).first().waitFor({ timeout: 15_000 }).catch(() => {});
  }

  async loanOptions() {
    await this.loanType.selectOption({ label: 'Gold Loan' });
    await this.loan.click();
    await this.page.locator('ng-dropdown-panel .ng-option').first().waitFor({ timeout: 10_000 }).catch(() => {});
    const list = (await this.page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    await this.page.keyboard.press('Escape');
    return list;
  }

  async selectLoan(loanNumber) {
    await this.loanType.selectOption({ label: 'Gold Loan' });
    await this.loan.click();
    const opt = this.page.locator('ng-dropdown-panel .ng-option', { hasText: loanNumber }).first();
    await expect(opt, `loan ${loanNumber} not offered in Inventory Form`).toBeVisible();
    await opt.click();
    await expect(this.collateralRows().first()).toBeVisible();
  }

  collateralRows() {
    return this.page.locator('tr', { has: this.page.locator('td') }).filter({ hasNotText: 'No records available' }).filter({ hasText: /\d/ });
  }

  async collateral() {
    return (await this.collateralRows().allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async customerInfo() {
    const text = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    return {
      customer: (text.match(/Customer Name (.+?) Mobile No\./) || [])[1],
      mobile: (text.match(/Mobile No\. (\d+)/) || [])[1],
      loan: (text.match(/Loan No\. (GLNG\d+)/) || [])[1],
    };
  }

  // Scan into the box and press Enter, as a scanner does. Returns the messages shown.
  async scanCode(code) {
    await this.clearToasts();
    await this.page.locator('input#selectAll, th input[type=checkbox]').first().check({ force: true }).catch(() => {});
    await this.scan.fill(code);
    await this.scan.press('Enter');
    await this.page.waitForTimeout(2000);
    return this.messages();
  }

  async bindBarcode(barcode) {
    await this.scanCode(barcode);
    await expect(this.packetNo).toHaveValue(barcode);
  }

  async chooseVault(vaultName) {
    await this.vault.click();
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: vaultName }).first().click();
    await expect(this.vaultCode).not.toHaveValue('');
    await this.page.waitForTimeout(800);
  }

  async storeIn({ photo, vaultName, safeNo, lockerNo }) {
    if (photo) await this.photo.setInputFiles(photo);
    await this.chooseVault(vaultName);
    await this.safe.selectOption({ label: safeNo });
    await expect(this.locker.locator('option')).not.toHaveCount(1);
    if (lockerNo) await this.locker.selectOption({ label: String(lockerNo) });
    else await this.locker.selectOption({ index: 1 });
    return { vaultCode: await this.vaultCode.inputValue(), locker: (await this.locker.locator('option:checked').innerText()).trim() };
  }

  async optionTexts(select) {
    return (await select.locator('option').allInnerTexts()).map((t) => t.trim()).filter((t) => t && t !== 'Select');
  }

  // View page rows: [{ applicant, loan, inventory, date, gross, net, remarks, items }]
  async viewRows() {
    const out = [];
    for (const r of await this.page.locator('tr:visible', { hasText: /INV\d{8,}/ }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      out.push({ applicant: c[0], loan: c[1], inventory: c[2], date: c[3], gross: c[4], net: c[5], remarks: c[6], items: c[7] });
    }
    return out;
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).map((t) => t.trim()).filter(Boolean).join(' | ');
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(200);
  }
}

module.exports = { InventoryPage };
