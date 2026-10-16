const fs = require('fs');
const nav = require('../utils/nav');
const path = require('path');
const { expect } = require('@playwright/test');

const AUDIT_BARCODE_FILE = path.resolve(__dirname, '../test-data/last-audit-barcode.json');

// Loans → Gold → Gold Stock Audit: audit each pledged article of a loan (status + comment)
class GoldStockAuditPage {
  constructor(page) {
    this.page = page;
    this.auditDate = page.locator('[formcontrolname=pauditdate]');
    this.loan = page.locator('ng-select[formcontrolname=pvchapplicationid]');
    this.executive = page.locator('select[formcontrolname=pauditby]');
    this.overall = page.locator('textarea[formcontrolname=poverallcomments]');
    this.save = page.getByText('Save', { exact: true }).locator('visible=true').last(); // not a <button> on this screen
  }

  async open() {
    const p = this.page;
    // menu item was renamed: "Gold Stock Audit" (older build) → "Gold Audit" (host214 build 14-Oct-2026)
    const newName = await p.getByText('Gold Audit', { exact: true }).count();
    await nav.go(p, newName ? 'Gold Audit' : 'Gold Stock Audit', ['Loans', 'Gold']).catch(async () => nav.go(p, 'Gold Audit', ['Loans', 'Gold']));
    await p.waitForURL(/Audit/i);
    // New build: the single-form stock audit was replaced by the "Gold Audit" workflow dashboard
    // (auditor → custodian → Branch Head → Head Audit). Report it instead of failing.
    if (/GoldAuditDashboard/i.test(p.url())) return 'workflow';
    await expect(this.loan).toBeVisible();
    return 'form';
  }

  async selectLoan(loanNumber) {
    await this.loan.click();
    await this.loan.locator('input').fill(loanNumber);
    const opt = this.page.locator('ng-dropdown-panel .ng-option', { hasText: loanNumber }).first();
    await expect(opt, `loan ${loanNumber} not offered in Gold Stock Audit`).toBeVisible();
    await opt.click();
    await expect(this.articleRows().first()).toBeVisible();
  }

  // Article rows = rows holding a Status <select>
  articleRows() {
    return this.page.locator('tr', { has: this.page.locator('select', { has: this.page.locator('option', { hasText: 'Verified' }) }) });
  }

  async articles() {
    const out = [];
    for (const r of await this.articleRows().all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      out.push({ sno: c[0], details: c[1], purity: c[2], grossWt: c[3], netWt: c[4] });
    }
    return out;
  }

  async auditArticle(index, status, comment) {
    const row = this.articleRows().nth(index);
    await row.locator('select').selectOption({ label: status });
    await row.locator('textarea').fill(comment);
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  static readAuditBarcode() {
    return fs.existsSync(AUDIT_BARCODE_FILE) ? JSON.parse(fs.readFileSync(AUDIT_BARCODE_FILE, 'utf8')) : null;
  }

  static markAuditBarcode(extra) {
    const cur = GoldStockAuditPage.readAuditBarcode() || {};
    fs.writeFileSync(AUDIT_BARCODE_FILE, JSON.stringify({ ...cur, ...extra, updatedAt: new Date().toISOString() }, null, 2));
  }
}

module.exports = { GoldStockAuditPage, AUDIT_BARCODE_FILE };
