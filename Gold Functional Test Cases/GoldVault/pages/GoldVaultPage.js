const zlib = require('zlib');
const { expect } = require('@playwright/test');

// Loans → Gold → Gold Loan Configuration → Vault  (route ?open=Vaultconfig, side panel "Vault Configuration").
// Grid: Vault Name | Vault Branch | Vault Code | edit icon. There is NO delete action, so a vault that is created stays.
//
// SAFETY: the existing vaults (including the hand-off vault the Safe & Lockers flow uses) are READ-ONLY for these tests.
// Only vaults whose code starts with TEST_PREFIX (created by the suite itself) may be edited.
const TEST_PREFIX = 'ATFT';

class GoldVaultPage {
  constructor(page) {
    this.page = page;
    this.name = page.locator('[formcontrolname=pVaultname]:visible');
    this.branch = page.locator('[formcontrolname=pVaultbranch]:visible');
    this.code = page.locator('[formcontrolname=pVaultcode]:visible');
    this.newButton = page.locator('button:visible, a:visible').filter({ hasText: /^\W*New\s*$/ }).first();
    this.save = page.locator('button:visible').filter({ hasText: /^\W*Save\s*$/ }).last();
    this.update = page.locator('button:visible').filter({ hasText: /^\W*Update\s*$/ }).last();
    this.search = page.getByPlaceholder(/Search in all columns/i).locator('visible=true').first();
  }

  async open() {
    try { await this.openOnce(); } catch (e) {
      await this.page.goto('/#/Dashboard');
      await this.page.waitForTimeout(3000);
      await this.openOnce();
    }
  }

  async openOnce() {
    const p = this.page;
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
    await p.locator('tr', { hasText: /\w/ }).nth(1).waitFor({ timeout: 15_000 }).catch(() => {});
    await p.waitForTimeout(800);
  }

  async openNew() {
    await this.newButton.click();
    await expect(this.name).toBeVisible();
  }

  async fill(v) {
    if (v.name !== undefined) await this.name.fill(String(v.name));
    if (v.branch !== undefined) await this.branch.fill(String(v.branch));
    if (v.code !== undefined) await this.code.fill(String(v.code));
  }

  async clickSave() {
    await this.save.scrollIntoViewIfNeeded();
    await this.save.click();
    await this.page.waitForTimeout(2500);
  }

  // adds a vault and returns the messages shown
  async add(v) {
    await this.openNew();
    await this.fill(v);
    await this.clickSave();
    return this.messages();
  }

  async closePanel() {
    await this.page.locator('button:visible', { hasText: '×' }).first().click();
    await this.page.waitForTimeout(600);
  }

  async panelOpen() { return (await this.name.count()) > 0; }

  clearLink() { return this.page.getByText('Clear', { exact: true }).locator('visible=true').last(); }

  // [{ name, branch, code }] of the rows on the CURRENT page of the grid
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      if (c.length >= 3 && c[0]) out.push({ name: c[0], branch: c[1], code: c[2] });
    }
    return out;
  }

  pagerText() { return this.page.getByText(/\d+ - \d+ of \d+ items/).first().innerText().then((t) => t.trim(), () => ''); }
  async total() { const m = (await this.pagerText()).match(/of (\d+) items/); return m ? Number(m[1]) : 0; }

  // every vault on every page (clears the search first)
  async allRows() {
    await this.searchFor('');
    const out = [];
    for (let i = 0; i < 30; i++) {
      out.push(...(await this.rows()));
      const t = await this.pagerText();
      const m = t.match(/(\d+) - (\d+) of (\d+)/);
      if (!m || Number(m[2]) >= Number(m[3])) break;
      await this.page.getByTitle('Go to the next page').click();
      await this.page.waitForTimeout(900);
    }
    return out;
  }

  async searchFor(text) {
    await this.search.fill(text);
    await this.page.waitForTimeout(1300);
  }

  // find a vault by code through the search box (it may be on another page)
  async findByCode(code) {
    // the grid filters a moment after typing; retry on a slow server before concluding the vault is missing
    for (let i = 0; i < 3; i++) {
      await this.searchFor(code);
      const hit = (await this.rows()).find((r) => r.code === code);
      if (hit) return hit;
      await this.page.waitForTimeout(1500);
    }
    return undefined;
  }

  guard(code) {
    if (!String(code).startsWith(TEST_PREFIX)) throw new Error(`Refusing to edit vault "${code}": tests may only edit vaults whose code starts with ${TEST_PREFIX}`);
  }

  async edit(code) {
    this.guard(code);
    await this.searchFor(code);
    await this.page.locator('tr', { hasText: code }).first().locator('#icon-edit').click();
    await expect(this.name).toBeVisible();
    await this.page.waitForTimeout(500);
  }

  async clickUpdate() {
    await this.update.scrollIntoViewIfNeeded();
    await this.update.click();
    await this.page.waitForTimeout(2500);
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }

  requiredMessages() {
    return this.page.getByText(/Vault (Name|Branch|Code) Required/i).allInnerTexts();
  }

  headerCell(title) { return this.page.locator('th', { hasText: title }).first(); }

  // Excel / PDF export icons (title "excel" / "pdf"); returns { name, buf }
  async download(kind) {
    const [dl] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 20_000 }),
      this.page.locator(`img[title="${kind}"]`).locator('visible=true').first().click(),
    ]);
    return { name: dl.suggestedFilename(), buf: require('fs').readFileSync(await dl.path()) };
  }
}

// Reads the text of every entry of an .xlsx / .zip buffer (uses the central directory; entries are deflated)
function zipTexts(buf) {
  const out = {};
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return out;
  let p = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let n = 0; n < count && buf.readUInt32LE(p) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    const lnLen = buf.readUInt16LE(off + 26), leLen = buf.readUInt16LE(off + 28);
    const data = buf.slice(off + 30 + lnLen + leLen, off + 30 + lnLen + leLen + csize);
    try { out[name] = (method === 8 ? zlib.inflateRawSync(data) : data).toString('utf8'); } catch { out[name] = ''; }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

module.exports = { GoldVaultPage, TEST_PREFIX, zipTexts };
