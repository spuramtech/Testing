const fs = require('fs');
const nav = require('../utils/nav');
const path = require('path');
const { expect } = require('@playwright/test');

// Shared hand-off file: the barcode generated here is used by the next form's test
const BARCODE_FILE = path.resolve(__dirname, '../test-data/last-barcode.json');

// Loans → Gold → Gold Packet Barcode Generator
class GoldBarcodePage {
  constructor(page) {
    this.page = page;
    this.loan = page.locator('ng-select[formcontrolname=ploanid]');
    this.generate = page.locator('button:visible').filter({ hasText: /Generate barcode/i });
  }

  async open() {
    const p = this.page;
    await nav.go(p, 'Gold Packet Barcode Generator', ['Loans', 'Gold']);
    await p.waitForURL(/GoldPacketBarcodeGenerate/);
    await expect(this.generate).toBeVisible();
  }

  async selectType(type = 'BH') {
    await this.page.locator('label', { hasText: new RegExp(`^\\s*${type}\\s*$`) }).first().click();
  }

  async loanOptions() {
    await this.loan.click();
    const opts = this.page.locator('ng-dropdown-panel .ng-option');
    await expect(opts.first()).toBeVisible();
    const list = (await opts.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    await this.page.keyboard.press('Escape');
    return list;
  }

  async selectLoan(loanNumber) {
    await this.loan.click();
    await this.loan.locator('input').fill(loanNumber);
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: loanNumber }).first().click();
  }

  // Clicks Generate barcode. Returns { preview: true } or, if the loan already has an unused barcode,
  // { existing: 'BH…' } after pressing Back (never "Cancel old barcode & generate new").
  async tryGenerate() {
    await this.generate.click();
    const preview = this.page.getByText(/Preview - not yet recorded/i).locator('visible=true').first();
    const already = this.page.getByText(/already has an unused barcode/i).locator('visible=true').first();
    await expect(preview.or(already).first()).toBeVisible();
    if (await already.isVisible()) {
      const box = (await this.page.getByText(/Existing barcode no/i).locator('visible=true').first().locator('xpath=..').innerText()).replace(/\s+/g, ' ');
      const existing = (box.match(/Existing barcode no\.?\s*(\S+)/i) || [])[1];
      await this.page.getByRole('button', { name: /^\s*Back\s*$/ }).click();
      return { existing };
    }
    return { preview: true };
  }

  // "Generate barcode" only previews; "Print sticker" records the barcode (opens a print popup, which we close).
  // Returns the recorded barcode number, e.g. BH2610000008.
  async printSticker() {
    // Close the print popup whenever it opens (only on success) – don't wait for it, the error toast is short-lived
    const onPopup = (p) => p.close().catch(() => {});
    this.page.context().on('page', onPopup);
    await this.page.locator('button:visible, a:visible').filter({ hasText: /Print sticker/i }).first().click();
    const recorded = this.page.getByText(/Recorded sticker/i);
    const failed = this.page.getByText(/Could not record the barcode/i).first();
    await expect(recorded.or(failed).first()).toBeVisible();
    setTimeout(() => this.page.context().off('page', onPopup), 5000);
    // e.g. Audit limit reached (API 409 CONFLICT) → "Could not record the barcode - nothing was printed."
    if (await failed.isVisible()) return null;
    const text = (await recorded.locator('xpath=..').innerText()).replace(/\s+/g, ' ');
    return (text.match(/Recorded sticker\s+(\S+)/i) || [])[1];
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  static saveHandOff(data) {
    fs.writeFileSync(BARCODE_FILE, JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2));
  }

  static readHandOff() {
    return fs.existsSync(BARCODE_FILE) ? JSON.parse(fs.readFileSync(BARCODE_FILE, 'utf8')) : null;
  }
}

module.exports = { GoldBarcodePage, BARCODE_FILE };
