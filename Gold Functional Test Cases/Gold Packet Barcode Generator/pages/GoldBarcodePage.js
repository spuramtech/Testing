const { expect } = require('@playwright/test');
const { go } = require('../../common/utils/nav');

// Loans → Gold → Gold Packet Barcode Generator (#/Loans/GoldPacketBarcodeGenerate) and its Register
// (#/Loans/GoldPacketBarcodeRegister). Generate = local preview; Print sticker = records (POST generatebarcode).
class GoldBarcodePage {
  constructor(page) {
    this.page = page;
    this.loan = page.locator('ng-select[formcontrolname=ploanid]');
    this.generateBtn = page.locator('button:visible').filter({ hasText: /Generate barcode/i });
    this.printBtn = page.locator('button:visible, a:visible').filter({ hasText: /Print sticker/i }).first();
    this.backBtn = page.getByRole('button', { name: /^\s*Back\s*$/ });
    this.cancelOldBtn = page.getByRole('button', { name: /Cancel old barcode & generate new/i });
    this.toasts = page.locator('.toast-message, .toast-title');
    // register
    this.regSearch = page.getByPlaceholder('Search barcode no. / loan no. / applicant');
    this.regStatus = page.locator('select:visible', { has: page.locator('option', { hasText: 'Not Used' }) }).first();
    this.pagerInfo = page.locator('.k-pager-info:visible').first();
  }

  async open() {
    await go(this.page, 'Gold Packet Barcode Generator', ['Loans', 'Gold']);
    await this.page.waitForURL(/GoldPacketBarcodeGenerate/);
    await expect(this.generateBtn).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async openRegister() {
    await this.open();
    await this.page.getByText('View Register').first().click();
    await this.page.waitForURL(/GoldPacketBarcodeRegister/);
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.locator('tr:visible', { hasText: /(BH|AUD)\d{8,}/ }).first().waitFor({ timeout: 10_000 }).catch(() => {});
  }

  async selectType(type) {
    await this.page.locator('label', { hasText: new RegExp(`^\\s*${type}\\s*$`) }).first().click();
    await this.page.waitForTimeout(800);
  }

  async checkedType() {
    return this.page.locator('input[type=radio][formcontrolname=ptype]:checked').getAttribute('value');
  }

  async loanOptions() {
    await this.loan.click();
    await this.page.locator('ng-dropdown-panel .ng-option').first().waitFor({ timeout: 10_000 }).catch(() => {});
    const list = (await this.page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    await this.page.keyboard.press('Escape');
    return list;
  }

  async selectLoan(loanNo) {
    await this.loan.click();
    await this.loan.locator('input').fill(loanNo);
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: loanNo }).first().click();
    await this.page.waitForTimeout(800);
  }

  async previewText() {
    return ((await this.page.locator('body').innerText()).replace(/\s+/g, ' ').split(/Generate barcode/i).pop() || '').trim();
  }

  // ---- register rows: [{ barcode, type, loan, applicant, createdBy, created, status, remarks, canCancel }]
  async regRows() {
    const out = [];
    for (const r of await this.page.locator('tr:visible', { hasText: /(BH|AUD)\d{8,}/ }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      out.push({ barcode: c[0], type: c[1], loan: c[2], applicant: c[3], createdBy: c[4], created: c[5], status: c[6], remarks: c[7], canCancel: (await r.getByRole('button', { name: /^\s*Cancel\s*$/ }).count()) > 0 });
    }
    return out;
  }

  async totalItems() {
    const m = (await this.pagerInfo.innerText().catch(() => '')).match(/of (\d+) items/);
    return m ? Number(m[1]) : 0;
  }

  cancelDialog() {
    return this.page.locator('.modal.show', { hasText: 'Cancel barcode' }).last();
  }

  // reason box shown with "Cancel old barcode & generate new" / in the register cancel dialog
  reasonBox(scope = this.page) {
    return scope.locator('textarea:visible, input[type=text]:visible:not([placeholder*="Search"])').last();
  }

  async filterStatus(label) {
    await this.regStatus.selectOption({ label });
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(1200);
  }

  async search(text) {
    await this.regSearch.fill(text);
    await this.page.waitForTimeout(1200);
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).join(' | ');
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(200);
  }
}

module.exports = { GoldBarcodePage };
