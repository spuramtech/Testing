const { expect } = require('@playwright/test');
const nav = require('../utils/nav');

// Loans → Gold → Inventory Form: bind a pledged loan's collateral to a printed packet barcode and store it in a vault/safe/locker
class InventoryPage {
  constructor(page) {
    this.page = page;
    this.loanType = page.locator('select[formcontrolname=ploantypeid]');
    this.loan = page.locator('ng-select[formcontrolname=pLoanid]');
    this.packetNo = page.locator('[formcontrolname=pPacketno]');
    this.scan = page.getByPlaceholder('Scan barcode here');
    this.photo = page.locator('input[type=file]:visible').first();
    this.vault = page.locator('ng-select[formcontrolname=pVaultid]');
    this.vaultCode = page.locator('[formcontrolname=pVaultloancode]');
    this.safe = page.locator('select[formcontrolname=pCabinetid]');
    this.locker = page.locator('select[formcontrolname=pLockerno]');
    this.remarks = page.locator('textarea[formcontrolname=pRemarks]');
    this.add = page.locator('button:visible').filter({ hasText: /^\W*Add\s*$/ });
    this.save = page.locator('button:visible').filter({ hasText: /^\W*Save\s*$/ }).last();
  }

  async open() {
    const p = this.page;
    await nav.go(p, 'Inventory Form', ['Loans', 'Gold']);
    await p.waitForURL(/InventoryForm/);
    await expect(this.loanType).toBeVisible();
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
    return this.page.locator('tr', { has: this.page.locator('td') }).filter({ hasNotText: 'No records available' });
  }

  async collateral() {
    return (await this.collateralRows().allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  async customerInfo() {
    const text = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    return {
      customer: (text.match(/Customer Name (.+?) Mobile No\./) || [])[1],
      mobile: (text.match(/Mobile No\. (\d+)/) || [])[1],
    };
  }

  // Tick all collateral, scan the barcode and press Enter (same as a scanner) → Packet No is bound
  async bindBarcode(barcode) {
    await this.page.locator('input#selectAll, th input[type=checkbox]').first().check({ force: true });
    await this.scan.fill(barcode);
    await this.scan.press('Enter');
    await expect(this.packetNo).toHaveValue(barcode);
  }

  async storeIn({ photo, vaultName, safeNo, lockerNo }) {
    await this.photo.setInputFiles(photo);
    await this.vault.click();
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: vaultName }).first().click();
    await expect(this.vaultCode).not.toHaveValue('');
    await this.safe.selectOption({ label: safeNo });
    await expect(this.locker.locator('option')).not.toHaveCount(1);
    if (lockerNo) await this.locker.selectOption({ label: String(lockerNo) });
    else await this.locker.selectOption({ index: 1 });
    return { vaultCode: await this.vaultCode.inputValue(), locker: (await this.locker.locator('option:checked').innerText()).trim() };
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { InventoryPage };
