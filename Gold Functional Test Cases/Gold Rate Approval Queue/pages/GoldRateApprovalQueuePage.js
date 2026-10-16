const { expect } = require('@playwright/test');
const { go } = require('../../common/utils/nav');

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

// Gold Rate Approval Queue (Checker Approval Queue) – opened from the "Gold Rate Approval" card on Gold Loan Configuration.
// One card (.grq-batch-card) per day's Internal Rate submission: date, maker, Approve All (n), Reject All, carat table.
class GoldRateApprovalQueuePage {
  constructor(page) {
    this.page = page;
    this.cards = page.locator('.grq-batch-card');
    this.search = page.getByPlaceholder('Search by maker or gold type...');
    this.rejectModal = page.locator('#rejectGoldRateModal');
    this.remarks = this.rejectModal.locator('textarea');
    this.confirmReject = this.rejectModal.getByText('Confirm Reject', { exact: true });
    this.cancelReject = this.rejectModal.getByText('Cancel', { exact: true });
    this.toasts = page.locator('.toast-message, .toast-title');
    this.lockedCardText = 'Only Gold Rate checkers (Form-wise Approvals > Gold Rate)';
  }

  // Card on Gold Loan Configuration (visible to every user, locked for non-checkers)
  configCard() {
    return this.page.getByText('Gold Rate Approval', { exact: true }).first().locator('xpath=ancestor::*[contains(normalize-space(.),"Checker approval of the day")][1]');
  }

  async openConfiguration() {
    await go(this.page, 'Gold Loan Configuration', ['Loans', 'Gold']);
    await this.page.waitForURL(/GoldLoanConfiguration/);
    await expect(this.page.getByText('Gold Rate Approval', { exact: true }).first()).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  async open() {
    await this.openConfiguration();
    await this.page.getByText('Gold Rate Approval', { exact: true }).first().click();
    await this.page.waitForURL(/open=GoldRateApprovalQueue/);
    await expect(this.page.getByText('Checker Approval Queue').first()).toBeVisible();
    await this.waitLoaded();
  }

  async waitLoaded() {
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(800);
  }

  card(i) {
    return this.cards.nth(i);
  }

  cardFor(dateText) {
    return this.cards.filter({ has: this.page.locator('.grq-batch-date', { hasText: dateText }) }).first();
  }

  // [{ index, date ('06 Jul 2026'), iso ('2026-07-06'), maker, approveText, count, rates: { '24K': 14268.22, … } }]
  async readCards() {
    const out = [];
    const n = await this.cards.count();
    for (let i = 0; i < n; i++) {
      const c = this.card(i);
      const date = (await c.locator('.grq-batch-date').innerText()).trim();
      const maker = (await c.locator('.grq-batch-maker').innerText()).replace(/Submitted by/i, '').trim();
      const approveText = (await c.locator('.grq-btn-approve').innerText()).trim();
      const rates = {};
      for (const row of await c.locator('table.grq-carat-table tbody tr').all()) {
        const [type, rate] = (await row.locator('td').allInnerTexts()).map((x) => x.trim());
        rates[(type.match(/^(\d+K)/) || [type])[0]] = num(rate);
      }
      out.push({ index: i, date, iso: toIso(date), maker, approveText, count: Number((approveText.match(/\((\d+)\)/) || [])[1]), rates, rowCount: Object.keys(rates).length });
    }
    return out;
  }

  async pendingCountText() {
    const t = (await this.page.locator('.grq-page').innerText()).replace(/\s+/g, ' ');
    const m = t.match(/(\d+)\s+submissions?\s+pending/i);
    return m ? Number(m[1]) : null;
  }

  async emptyStateText() {
    const t = (await this.page.locator('.grq-page').innerText()).replace(/\s+/g, ' ');
    return (t.match(/No gold rate submissions[^.]*\.?/i) || [''])[0];
  }

  async openReject(i = 0) {
    await this.card(i).locator('.grq-btn-reject').click();
    await expect(this.rejectModal).toBeVisible();
    await this.page.waitForTimeout(300);
  }

  async closeReject() {
    if (await this.rejectModal.isVisible()) await this.cancelReject.click();
    await expect(this.rejectModal).toBeHidden();
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
    await this.page.waitForTimeout(300);
  }
}

function num(text) {
  const n = Number(String(text ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function toIso(date) {
  const m = String(date).match(/(\d{1,2}) (\w{3}) (\d{4})/);
  return m ? `${m[3]}-${String(MONTHS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

module.exports = { GoldRateApprovalQueuePage, num, toIso };
