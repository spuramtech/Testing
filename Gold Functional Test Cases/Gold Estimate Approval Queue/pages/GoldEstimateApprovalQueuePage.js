const { expect } = require('@playwright/test');
const { go } = require('../../common/utils/nav');

// Loans → Gold → Gold Estimate Approval Queue, its detail pages:
//   #/Loans/GoldEstimateApprovalDetail;id=<btoa(GE)>      (Branch Head / Checker: View / Review → Approve / Revert)
//   #/Loans/GoldEstimateInternalApproval;id=<btoa(GE)>    (Internal Appraiser 2: Verify → Approve / Revert)
class GoldEstimateApprovalQueuePage {
  constructor(page) {
    this.page = page;
    this.search = page.getByPlaceholder('Search GE number, customer, mobile or role...');
    this.statusFilter = page.locator('select:visible', { has: page.locator('option', { hasText: 'Ready for Approval' }) }).first();
    this.pagerInfo = page.locator('.k-pager-info:visible').first();
    this.toasts = page.locator('.toast-message, .toast-title');
    // buttons carry icon text, so match by accessible name
    this.approveBtn = page.getByRole('button', { name: /^\W*Approve$/ }).first();
    this.revertBtn = page.getByRole('button', { name: /^\W*Revert$/ }).first();
    this.backBtn = page.getByRole('button', { name: /^\W*Back$/ }).first();
  }

  async open() {
    await go(this.page, 'Gold Estimate Approval Queue', ['Loans', 'Gold']);
    await this.page.waitForURL(/GoldEstimateApprovalQueue/);
    await expect(this.search).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    // rows render after the inbox calls return; an empty inbox is legitimate
    await this.rowLocators().first().waitFor({ timeout: 10_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  rowLocators() {
    return this.page.locator('tr:visible', { hasText: /GE\d{10}/ });
  }

  row(ge) {
    return this.page.locator('tr:visible', { hasText: ge }).first();
  }

  // [{ ge, customer, mobile, date, value, role, status, token, aging, action }]
  async rows() {
    const out = [];
    for (const r of await this.rowLocators().all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      out.push({ ge: c[0], customer: c[1], mobile: c[2], date: c[3], value: num(c[4]), role: c[6], status: c[7], token: c[8], aging: c[9], action: c[10] });
    }
    return out;
  }

  async totalItems() {
    const m = (await this.pagerInfo.innerText().catch(() => '')).match(/of (\d+) items/);
    return m ? Number(m[1]) : 0;
  }

  async openAction(ge, label) {
    await this.row(ge).getByRole('button', { name: new RegExp(`^\\W*${label}\\s*$`) }).click();
    await expect(this.page.getByText(ge, { exact: true }).first()).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // Header fields on the detail page: label text → value text
  async field(label) {
    const lab = this.page.getByText(new RegExp(`^\\s*${label.replace(/[()/]/g, '\\$&')}\\s*$`, 'i')).first();
    return (await lab.locator('xpath=following-sibling::*[1]').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  }

  // Inline prompt (approve / revert) shown on the detail pages
  prompt() {
    return this.page.locator('.ge-prompt:visible, .ge-modal:visible, .modal.show:not(:has-text("Session Timeout")):not(:has-text("EMI Calculator"))').filter({ has: this.page.locator('button') }).last();
  }

  promptButton(text) {
    return this.page.getByRole('button', { name: new RegExp(text, 'i') }).last();
  }

  remarksBox() {
    return this.page.locator('textarea:visible').last();
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).join(' | ');
  }

  async waitMessage() {
    await expect(this.toasts.first()).toBeVisible();
    await this.page.waitForTimeout(500);
    return this.messages();
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(200);
  }
}

function num(text) {
  const m = String(text ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

const STATUS = {
  PENDING_IA_ENTRY: 'Awaiting Internal Appraiser',
  PENDING_IA_APPROVAL: 'Awaiting Internal Appraiser 2 verification',
  PENDING_IA_EDIT: 'Sent back to Internal Appraiser to edit',
  PENDING_EXTERNAL_1: 'Awaiting External Appraiser 1',
  PENDING_EXTERNAL_2: 'Awaiting External Appraiser 2',
  PENDING_CHECKER: 'Ready for Approval',
  APPROVED: 'Approved',
};

module.exports = { GoldEstimateApprovalQueuePage, num, STATUS };
