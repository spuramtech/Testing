const { expect } = require('@playwright/test');

// Loans → Gold → Gold Loan Configuration → Estimate Approval Slabs  (route ?open=GoldEstimateSlabConfig,
// screen title "Gold Estimate Slab Configuration"). Amount-range slabs that decide how many appraisal stages an estimate needs.
//
// SAFETY: the 5 real slabs (0 .. 10,00,00,000) decide who must approve every estimate, so this page object refuses to
// edit / delete any slab that starts at or below SANDBOX_MIN - 1. Tests only create slabs ABOVE 10 crore ("sandbox").
const SANDBOX_MIN = 100000001; // 10,00,00,001 = the first rupee above the top real slab

const num = (t) => (/none/i.test(String(t)) ? 0 : Number(String(t).replace(/[^\d]/g, '')));

class GoldSlabPage {
  constructor(page) {
    this.page = page;
    this.from = page.getByPlaceholder('e.g. 0');
    this.to = page.getByPlaceholder('Blank = no limit');
    // the first <select> on the page is the global search-type box; the form's own selects follow it
    this.internal = page.locator('select').nth(1);
    this.external = page.locator('select').nth(2);
    this.addButton = page.getByRole('button', { name: /Add Slab/ });
    this.save = page.locator('button').filter({ hasText: /^\s*Save\s*$/ }).last();
    this.cancel = page.locator('button').filter({ hasText: /^\s*Cancel\s*$/ }).last();
  }

  // The sidebar click occasionally times out on a slow server; retry once from the dashboard before giving up
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
    await p.getByText('Estimate Approval Slabs', { exact: true }).click();
    await expect(p.getByText('Gold Estimate Slab Configuration')).toBeVisible();
    await this.waitForGrid();
  }

  async waitForGrid() {
    await this.page.locator('tr', { hasText: /\d/ }).first().waitFor({ timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(800);
  }

  // [{ from, to, internal, external, text }]  (to = null when the cell is empty = no upper limit)
  async rows() {
    const out = [];
    for (const tr of await this.page.locator('tr').all()) {
      const cells = (await tr.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      if (cells.length < 4 || !/^\d/.test(cells[0])) continue;
      out.push({ from: num(cells[0]), to: cells[1] === '' || /unlimited|no limit|∞/i.test(cells[1]) ? null : num(cells[1]), internal: num(cells[2]), external: num(cells[3]), text: cells.join(' | ') });
    }
    return out;
  }

  rowByFrom(fromAmount) {
    // grid cells use Indian grouping (1,00,00,00,001), so match on the digits of the "From" cell
    // a row's text is its cells run together with no separator, so match the FIRST cell exactly
    return this.page.locator('tr').filter({ has: this.page.locator('td:first-child', { hasText: new RegExp(`^\\s*${indian(fromAmount)}\\s*$`) }) }).first();
  }

  async openAdd() {
    await this.addButton.click();
    await expect(this.from).toBeVisible();
  }

  async fill({ from, to, internal, external }) {
    if (from !== undefined && from !== null) await this.from.fill(String(from));
    if (to !== undefined && to !== null) await this.to.fill(String(to));
    if (internal !== undefined) await this.internal.selectOption({ label: String(internal) });
    if (external !== undefined) await this.external.selectOption({ label: String(external) });
  }

  async submit() {
    await this.save.scrollIntoViewIfNeeded();
    await this.save.click();
    await this.page.waitForTimeout(2500);
  }

  // Adds a slab and returns the messages shown (e.g. ["Slab saved."])
  async add(d) {
    await this.openAdd();
    await this.fill(d);
    await this.submit();
    return this.messages();
  }

  guard(fromAmount) {
    if (Number(fromAmount) < SANDBOX_MIN) throw new Error(`Refusing to touch slab starting at ${fromAmount}: only slabs from ${SANDBOX_MIN} (above 10 crore) may be edited or deleted by tests`);
  }

  async edit(fromAmount) {
    this.guard(fromAmount);
    await this.rowByFrom(fromAmount).getByTitle('Edit').click();
    await expect(this.from).toBeVisible();
    await this.page.waitForTimeout(500);
  }

  // Delete asks a native confirm("Delete this slab? ..."); `accept` decides the answer. Returns the dialog message.
  async remove(fromAmount, accept = true) {
    this.guard(fromAmount);
    let message = '';
    const handler = async (d) => { message = d.message(); accept ? await d.accept() : await d.dismiss(); };
    this.page.once('dialog', handler);
    await this.rowByFrom(fromAmount).getByTitle('Delete').click();
    await this.page.waitForTimeout(2500);
    return message;
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .invalid-feedback, .text-danger').allInnerTexts();
  }

  // Deletes every slab above 10 crore (never a real slab). Used for cleanup before / after the suite.
  // `keep` = From Amounts that must stay (the suite's main test slab is only removed by its own DELETE test, because
  // Playwright re-runs the setup hooks whenever a worker restarts after a failing test).
  async sandboxCleanup(keep = []) {
    for (let i = 0; i < 12; i++) {
      const extra = (await this.rows()).filter((r) => r.from >= SANDBOX_MIN && !keep.includes(r.from));
      if (!extra.length) return 0;
      await this.remove(extra[0].from, true);
      await this.page.reload();
      await this.open();
    }
    return -1;
  }
}

// 100000001 -> "10,00,00,001" (Indian digit grouping as shown in the grid)
function indian(n) {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts = [];
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest) parts.unshift(rest);
  return parts.join(',') + ',' + last3;
}

module.exports = { GoldSlabPage, SANDBOX_MIN, indian, num };
