const { expect } = require('@playwright/test');

// Loans → Loan Management → Loan Receipt
class LoanReceiptPage {
  constructor(page) {
    this.page = page;
    this.branch = page.locator('select[formcontrolname=pbranch]');
    this.loanType = page.locator('select[formcontrolname=loanname]');
    this.show = page.locator('button:visible').filter({ hasText: /^\W*Show\s*$/ });
    this.loan = page.locator('ng-select[formcontrolname=loanapplication]');
    this.receiptDate = page.locator('[formcontrolname=pDattransdate]');
    this.totalReceipt = page.locator('[formcontrolname=totalReceipt]');
    this.narration = page.locator('textarea:visible').last();
    this.save = page.locator('button:visible').filter({ hasText: /^\W*Save\s*$/ }).last();
  }

  async open() {
    const p = this.page;
    const link = p.getByText('Loan Receipt', { exact: true }).locator('visible=true').first();
    if (!(await link.isVisible().catch(() => false))) {
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Loan Management', { exact: true }).locator('visible=true').first().click();
    }
    await link.click();
    await p.waitForURL(/Loanreceipt/i);
    await expect(this.loanType).toBeVisible();
  }

  async selectLoan(loanNumber, loanType = 'Gold Loan') {
    await this.loanType.selectOption({ label: loanType });
    await this.show.click();
    await this.loan.click();
    await this.loan.locator('input').fill(loanNumber);
    const opt = this.page.locator('ng-dropdown-panel .ng-option', { hasText: loanNumber }).first();
    await expect(opt, `loan ${loanNumber} is not offered in Loan Receipt (not disbursed yet?)`).toBeVisible();
    await opt.click();
    await expect(this.page.getByText('Grand Total')).toBeVisible();
    await this.waitForDues();
  }

  // Outstanding badge next to the loan field, e.g. "93,000.00 Dr"
  async outstanding() {
    return (await this.page.getByText(/[\d,]+\.\d{2}\s*(Dr|Cr)/).first().innerText().catch(() => '')).trim();
  }

  // Dues grid rows: [{ particulars, due, waiver, received, balance }]
  async dues() {
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).filter({ hasNotText: 'Grand Total' }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      if (c.length >= 4 && /^\d+$/.test(c[0])) out.push({ particulars: c[1], due: c[2], waiver: c[3], balance: c[c.length - 1] });
    }
    return out;
  }

  // Dues table (table#example): body rows = dues, tfoot = Grand Total. Rows arrive ~1.5 s after the loan is chosen.
  async waitForDues() {
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await this.page.locator('#example tbody tr').first().waitFor({ timeout: 5000 }).catch(() => {}); // stays empty when nothing is due
    // the row appears before its amounts are bound – wait until the Grand Total is filled and stable
    let last = '';
    for (let i = 0; i < 12; i++) {
      const now = (await this.page.locator('#example').innerText().catch(() => '')).replace(/\s+/g, ' ');
      if (now === last && !/INSTALMENT DUE 0\.00/.test(now) && (await this.page.locator('#example tbody tr').count()) > 0 && /[1-9][\d,]*\.\d{2}/.test(now)) return;
      if (now === last && (await this.page.locator('#example tbody tr').count()) === 0 && i > 3) return;
      last = now;
      await this.page.waitForTimeout(500);
    }
  }

  // [{ particulars, due, balance }]
  async dueRows() {
    const out = [];
    for (const r of await this.page.locator('#example tbody tr').all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      const num = (s) => Number(String(s || '').replace(/[^\d.]/g, '')) || 0;
      if (c[1]) out.push({ particulars: c[1], due: num(c[2]), balance: num(c[5]) });
    }
    return out;
  }

  // Grand Total row → { due, waiver, received, balance }
  async grandTotal() {
    const c = (await this.page.locator('#example tfoot tr').first().locator('td').allInnerTexts()).map((t) => Number(t.replace(/[^\d.]/g, '')) || 0);
    return { due: c[1] || 0, waiver: c[2] || 0, received: c[3] || 0, balance: c[4] || 0 };
  }

  // Click "INSTALMENT DUE" → side panel "Receivables Detailed": one row per due date (after the Scheduled Jobs ran)
  // → [{ date: 'dd/mm/yyyy', principal, interest, amount, adjusted, balance }]
  async receivablesDetailed() {
    const link = this.page.locator('#example tbody a', { hasText: /INSTALMENT DUE/ }).first();
    if (!(await link.count())) return [];
    await link.click();
    const panel = this.page.getByText('Receivables Detailed', { exact: true }).last().locator('xpath=ancestor::*[.//table][1]'); // last = panel title (first is the page button)
    await expect(panel).toBeVisible();
    await this.page.waitForTimeout(800);
    const out = [];
    for (const r of await panel.locator('tbody tr').all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.trim());
      if (!/^\d{2}-\d{2}-\d{4}$/.test(c[0] || '')) continue;
      const n = (s) => Number(String(s).replace(/[^\d.]/g, '')) || 0;
      out.push({ date: c[0].replace(/-/g, '/'), principal: n(c[1]), interest: n(c[2]), amount: n(c[3]), adjusted: n(c[4]), balance: n(c[5]) });
    }
    // close the side panel (× in its header)
    const close = this.page.getByText('Receivables Detailed', { exact: true }).last().locator('xpath=ancestor::*[.//*[normalize-space(.)="×" or normalize-space(.)="✖"]][1]')
      .locator('xpath=.//*[normalize-space(.)="×" or normalize-space(.)="✖"]').first();
    if (await close.count()) await close.click().catch(() => {});
    else await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    return out;
  }

  // Mode of Receipt buttons "Cash : 4,782.00 Dr" / "Bank : … Cr"
  async selectMode(mode = 'CASH') {
    const btn = this.page.getByText(new RegExp(`^\\s*${mode}\\s*:`, 'i')).locator('visible=true').first();
    await btn.click();
    await expect(this.page.locator(`input[formcontrolname=pmodofreceipt][value="${mode.toUpperCase()}"]`)).toBeChecked();
    return (await btn.innerText()).replace(/\s+/g, ' ').trim();
  }

  async summary() {
    const text = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const pick = (l) => (text.match(new RegExp(`${l}\\s*:\\s*([\\d,.]+)`, 'i')) || [])[1];
    return { emi: pick('EMI Amount'), penalty: pick('Penalty / Charges'), advance: pick('Advance') };
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { LoanReceiptPage };
