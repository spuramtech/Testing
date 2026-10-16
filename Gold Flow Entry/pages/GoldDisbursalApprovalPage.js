const { expect } = require('@playwright/test');

// Loans → Gold → Gold Disbursal Approval Queue (Branch Head queue) → Review → Gold Disbursal Approval
class GoldDisbursalApprovalPage {
  constructor(page) {
    this.page = page;
    this.search = page.getByPlaceholder(/Search loan no/i);
    this.queueSelect = page.locator('select', { has: page.locator('option', { hasText: 'Branch Head queue' }) });
    this.statusSelect = page.locator('select', { has: page.locator('option', { hasText: 'Waiting for Approval' }) });
    this.approve = page.locator('button:visible').filter({ hasText: /Approve & Disburse/i });
    this.revert = page.locator('button:visible').filter({ hasText: /^\W*Revert\s*$/ });
  }

  async open() {
    const p = this.page;
    const link = p.getByText('Gold Disbursal Approval Queue', { exact: true }).locator('visible=true').first();
    if (!(await link.isVisible().catch(() => false))) {
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Gold', { exact: true }).locator('visible=true').first().click();
    }
    await link.click();
    await p.waitForURL(/GoldDisbursalApprovalQueue/);
    await expect(this.search).toBeVisible();
    await p.locator('tr', { hasText: /GLNG|\d{10,}/ }).first().waitFor({ timeout: 10_000 }).catch(() => {});
  }

  async filter(status = 'Waiting for Approval', queue = 'Branch Head queue') {
    await this.queueSelect.selectOption({ label: queue });
    await this.statusSelect.selectOption({ label: status });
    await this.page.waitForTimeout(1500);
  }

  // [{ loanNo, customer, mobile, branch, amount, mode, enteredBy, enteredOn, status }]
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      if (c.length >= 9 && /\d{8,}/.test(c[0])) out.push({ loanNo: c[0], customer: c[1], mobile: c[2], branch: c[3], amount: c[4], mode: c[5], enteredBy: c[6], enteredOn: c[7], status: c[8] });
    }
    return out;
  }

  async review(loanNo) {
    await this.page.locator('tr', { hasText: loanNo }).getByRole('button', { name: /Review/ }).click();
    await this.page.waitForURL(/GoldDisbursalApprovalDetail/);
    await expect(this.page.getByText(loanNo, { exact: true })).toBeVisible();
  }

  // Label → value pairs on the approval detail page
  async details() {
    const read = async (label) => (await this.page.getByText(new RegExp(`^\\s*${label}\\s*$`, 'i')).first()
      .locator('xpath=following-sibling::*[1]').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    return {
      customer: await read('Customer'),
      sanctioned: await read('Sanctioned Amount'),
      netPayout: await read('Disbursal Amount \\(Net Payout\\)'),
      status: await read('Status'),
      disbursalType: await read('Disbursal Type'),
      mode: await read('Mode of Payment'),
      reference: await read('Cheque / Ref No'),
      customerAccount: await read('Customer Bank A/C'),
    };
  }

  // Approve & Disburse → popup "Approve & Disburse – Disburse ₹X to <customer> for loan <no>? The voucher is posted now
  // and cannot be undone from here." → Confirm Approve. Returns the popup text.
  async approveAndDisburse(remarks) {
    await this.approve.click();
    const dialog = this.page.getByText(/voucher is posted now/i).locator('xpath=ancestor::*[.//button[contains(.,"Confirm Approve")]][1]');
    await expect(dialog).toBeVisible();
    const text = (await dialog.innerText()).replace(/\s+/g, ' ').trim();
    const box = dialog.locator('textarea, input[type=text]').first();
    if (await box.isVisible().catch(() => false)) await box.fill(remarks);
    await dialog.getByRole('button', { name: /Confirm Approve/i }).click();
    return text;
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { GoldDisbursalApprovalPage };
