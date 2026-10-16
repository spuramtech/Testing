const { expect } = require('@playwright/test');

// Loans → Gold → Gold Loan Configuration → Gold Rate Approval (Checker Approval Queue)
class GoldRateApprovalPage {
  constructor(page) {
    this.page = page;
    this.approveButtons = page.getByRole('button', { name: /Approve All/ });
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
    await p.getByText('Gold Rate Approval', { exact: true }).click();
    await p.waitForURL(/open=GoldRateApprovalQueue/);
    await p.waitForTimeout(1500);
  }

  // Card (one day's submission) that contains the given Approve button
  cardOf(button) {
    return button.locator('xpath=ancestor::*[.//*[contains(normalize-space(.),"Submitted by")] and .//td][1]');
  }

  // [{ index, date, submittedBy, rate24k, enabled, title }]
  async submissions() {
    const out = [];
    const n = await this.approveButtons.count();
    for (let i = 0; i < n; i++) {
      const btn = this.approveButtons.nth(i);
      const text = (await this.cardOf(btn).innerText()).replace(/\s+/g, ' ');
      out.push({
        index: i,
        date: (text.match(/\d{1,2} \w{3} \d{4}/) || [])[0],
        submittedBy: (text.match(/Submitted by (\S+)/) || [])[1],
        rate24k: (text.match(/24K \([^)]*\) ([\d,.]+)/) || [])[1],
        enabled: await btn.isEnabled(),
        title: await btn.getAttribute('title'),
      });
    }
    return out;
  }

  async approve(index) {
    await this.approveButtons.nth(index).click();
    // Confirm dialog, if the app shows one
    const confirm = this.page.locator('.swal2-confirm, .modal.show button:has-text("Yes"), .modal.show button:has-text("Approve"), .modal.show button:has-text("Confirm")').first();
    if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { GoldRateApprovalPage };
