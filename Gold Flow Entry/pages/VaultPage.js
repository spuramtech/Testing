const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

// Hand-off file: the vault created here can be used by the next form (e.g. Safe & Lockers)
const VAULT_FILE = path.resolve(__dirname, '../test-data/last-vault.json');

// Loans → Gold → Gold Loan Configuration → Vault
class VaultPage {
  constructor(page) {
    this.page = page;
    this.name = page.locator('[formcontrolname=pVaultname]:visible');
    this.branch = page.locator('[formcontrolname=pVaultbranch]:visible');
    this.code = page.locator('[formcontrolname=pVaultcode]:visible');
    this.save = page.locator('button:visible').filter({ hasText: /^\W*Save\s*$/ }).last();
    this.search = page.locator('input[type=text]:visible').nth(1);
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
    await p.getByText('Vault', { exact: true }).click();
    await p.waitForURL(/open=Vaultconfig/);
    await expect(p.getByText('Vault Code', { exact: true }).first()).toBeVisible();
  }

  async openNew() {
    await this.page.locator('button:visible, a:visible').filter({ hasText: /^\W*New\s*$/ }).first().click();
    await expect(this.name).toBeVisible();
  }

  async fill(v) {
    await this.name.fill(v.name);
    await this.branch.fill(v.branch);
    await this.code.fill(v.code);
  }

  // [{ name, branch, code }]
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.trim());
      if (c[0] && c.length >= 3) out.push({ name: c[0], branch: c[1], code: c[2] });
    }
    return out;
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  static saveHandOff(data) {
    fs.writeFileSync(VAULT_FILE, JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2));
  }

  static readHandOff() {
    return fs.existsSync(VAULT_FILE) ? JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8')) : null;
  }
}

module.exports = { VaultPage, VAULT_FILE };
