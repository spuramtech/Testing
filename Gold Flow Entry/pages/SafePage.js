const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

// Hand-off file for later forms that need a safe / locker
const SAFE_FILE = path.resolve(__dirname, '../test-data/last-safe.json');

// Loans → Gold → Gold Loan Configuration → Safe & Lockers (Safe Configuration)
class SafePage {
  constructor(page) {
    this.page = page;
    this.vault = page.locator('ng-select[formcontrolname=pVaultid]:visible');
    this.vaultBranch = page.locator('[formcontrolname=pVaultbranch]:visible');
    this.vaultCode = page.locator('[formcontrolname=pVaultcode]:visible');
    this.safeNo = page.locator('[formcontrolname=pCabinetno]:visible');
    this.lockerStart = page.locator('[formcontrolname=pLockerno]:visible');
    this.noOfLockers = page.locator('[formcontrolname=pNooflockers]:visible');
    this.save = page.locator('button:visible').filter({ hasText: /^\W*Save\s*$/ }).last();
  }

  async open() {
    const p = this.page;
    // The sidebar may already be expanded (Gold submenu open) – only expand when the link is not visible
    const glc = p.getByText('Gold Loan Configuration', { exact: true }).locator('visible=true').first();
    if (!(await glc.isVisible().catch(() => false))) {
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Gold', { exact: true }).locator('visible=true').first().click();
    }
    await glc.click();
    await p.waitForURL(/GoldLoanConfiguration/);
    await p.getByText('Safe & Lockers', { exact: true }).click();
    await p.waitForURL(/open=Chabinetconfig/);
    await expect(p.getByText('Safe Number', { exact: true }).first()).toBeVisible();
  }

  async openNew() {
    await this.page.locator('button:visible, a:visible').filter({ hasText: /^\W*New\s*$/ }).first().click();
    await expect(this.vault).toBeVisible();
  }

  async vaultOptions() {
    await this.vault.click();
    const opts = this.page.locator('ng-dropdown-panel .ng-option');
    await expect(opts.first()).toBeVisible();
    const list = (await opts.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
    await this.vault.locator('.ng-arrow-wrapper').click(); // close dropdown (Escape would close the whole side panel)
    return list;
  }

  async selectVault(name) {
    await this.vault.click();
    await this.vault.locator('input').fill(name);
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: name }).first().click();
  }

  async fill(s) {
    await this.safeNo.fill(String(s.safeNo));
    await this.lockerStart.fill(String(s.lockerStart));
    await this.noOfLockers.fill(String(s.noOfLockers));
  }

  // [{ vaultName, branch, code, safeNo, lockers }]
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.trim());
      if (c[0] && c.length >= 5) out.push({ vaultName: c[0], branch: c[1], code: c[2], safeNo: c[3], lockers: c[4] });
    }
    return out;
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  static saveHandOff(data) {
    fs.writeFileSync(SAFE_FILE, JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2));
  }

  static readHandOff() {
    return fs.existsSync(SAFE_FILE) ? JSON.parse(fs.readFileSync(SAFE_FILE, 'utf8')) : null;
  }
}

module.exports = { SafePage, SAFE_FILE };
