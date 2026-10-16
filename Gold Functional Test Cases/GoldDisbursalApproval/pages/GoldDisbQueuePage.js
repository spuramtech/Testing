const { expect } = require('@playwright/test');

// Loans → Gold → Gold Disbursal Approval Queue  (route #/Loans/GoldDisbursalApprovalQueue) and its detail page
// (#/Loans/GoldDisbursalApprovalDetail;id=...). Grid: LOAN NO | CUSTOMER | MOBILE | BRANCH | DISBURSAL AMOUNT | MODE | ENTERED BY |
// ENTERED ON | STATUS | AGING | ACTION ("Review" on a waiting loan, "View" on a finished one).
//
// SAFETY: "Approve & Disburse" posts a voucher that "cannot be undone from here" and "Revert" sends a loan back. This page
// object deliberately has NO method that clicks Approve & Disburse or Revert - the tests only read.
const STATUS = { waiting: 'Waiting for Approval', approved: 'Approved & Disbursed', reverted: 'Reverted', all: 'All' };

const num = (t) => Number(String(t || '').replace(/[^\d]/g, ''));
const money = (t) => num((String(t || '').match(/₹\s*([\d,]+)/) || [])[1]);

// label order on the detail page (a label that is not present for a status is simply skipped)
const LABELS = ['LOAN NO', 'CUSTOMER', 'LOAN NAME', 'BRANCH', 'SANCTIONED AMOUNT', 'DISBURSAL AMOUNT (NET PAYOUT)', 'STATUS', 'ENTERED BY', 'APPROVED BY', 'REVERTED BY',
  'VOUCHER NO', 'Disbursal Details (as entered)', 'DISBURSAL DATE', 'DISBURSAL TYPE', 'TENURE / ROI', 'REPAYMENT', 'MODE OF PAYMENT', 'CHEQUE / REF NO', 'CUSTOMER BANK A/C',
  'CHARGES ADJUSTED', 'BROKEN INTEREST', 'History'];

function parseDetail(text) {
  const t = String(text).replace(/\s+/g, ' ');
  const start = t.indexOf('Gold Disbursal Approval Back');
  const body = start >= 0 ? t.slice(start) : t;
  const found = [];
  let pos = 0;
  for (const label of LABELS) {
    const i = body.indexOf(label, pos);
    if (i >= 0) { found.push({ label, i }); pos = i + label.length; }
  }
  const d = {};
  found.forEach((f, k) => { d[f.label] = body.slice(f.i + f.label.length, k + 1 < found.length ? found[k + 1].i : body.length).trim(); });
  const history = d.History || '';
  return {
    raw: body,
    loanNo: d['LOAN NO'], customer: d.CUSTOMER, loanName: d['LOAN NAME'], branch: d.BRANCH,
    sanctioned: money(d['SANCTIONED AMOUNT']), net: money(d['DISBURSAL AMOUNT (NET PAYOUT)']),
    status: (d.STATUS || '').trim(),
    enteredBy: d['ENTERED BY'], approvedBy: d['APPROVED BY'], revertedBy: d['REVERTED BY'], voucher: d['VOUCHER NO'],
    charges: money(d['CHARGES ADJUSTED']), brokenInterest: money(d['BROKEN INTEREST']), hasBrokenInterest: 'BROKEN INTEREST' in d,
    mode: d['MODE OF PAYMENT'], reference: d['CHEQUE / REF NO'], disbursalDate: d['DISBURSAL DATE'],
    // one action per history ROW: the word REVERT can also appear inside a remark
    history, actions: history.split(/(?=\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2})/).map((seg) => (seg.match(/\b(SUBMIT|APPROVE|REVERT)\b/) || [])[1]).filter(Boolean),
  };
}

class GoldDisbQueuePage {
  constructor(page) {
    this.page = page;
    this.search = page.getByPlaceholder(/Search loan no/i).locator('visible=true').first();
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
    const link = p.getByText('Gold Disbursal Approval Queue', { exact: true }).locator('visible=true').first();
    if (!(await link.isVisible().catch(() => false))) {
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Gold', { exact: true }).locator('visible=true').first().click();
    }
    await link.click();
    await p.waitForURL(/GoldDisbursalApprovalQueue/);
    await expect(this.search).toBeVisible();
    await p.waitForTimeout(1500);
  }

  selects() { return this.page.locator('select:visible'); }

  // queue = 'Branch Head queue' | 'My submissions'; status = Waiting for Approval | Approved & Disbursed | Reverted | All
  async setView(status, queue = 'Branch Head queue') {
    await this.selects().nth(0).selectOption({ label: queue });
    await this.page.waitForTimeout(1200);
    if (queue === 'Branch Head queue' && status) await this.selects().nth(1).selectOption({ label: status });
    await this.page.waitForTimeout(1500);
  }

  async currentView() {
    const s = this.selects();
    const n = await s.count();
    return { queue: await s.nth(0).evaluate((e) => e.options[e.selectedIndex].text.trim()), status: n > 1 ? await s.nth(1).evaluate((e) => e.options[e.selectedIndex].text.trim()) : null, selects: n };
  }

  // rows on the CURRENT page: [{ loanNo, customer, mobile, branch, amount, amountNum, mode, enteredBy, enteredOn, status, aging }]
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr', { has: this.page.locator('td') }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      if (c.length >= 9 && /^GLNG|\d{8,}/.test(c[0])) out.push({ loanNo: c[0], customer: c[1], mobile: c[2], branch: c[3], amount: c[4], amountNum: num(c[4]), mode: c[5], enteredBy: c[6], enteredOn: c[7], status: c[8], aging: c[9] });
    }
    return out;
  }

  pagerText() { return this.page.getByText(/\d+ - \d+ of \d+ items/).first().innerText().then((t) => t.trim(), () => ''); }
  async total() { const m = (await this.pagerText()).match(/of (\d+) items/); return m ? Number(m[1]) : 0; }

  // every row of the current view on every page
  async allRows() {
    await this.searchFor('');
    // right after the search is cleared the grid is briefly empty: wait for the rows (or an honest "0 items")
    for (let i = 0; i < 10 && !(await this.rows()).length && (await this.total()) > 0; i++) await this.page.waitForTimeout(700);
    const out = [];
    for (let i = 0; i < 40; i++) {
      out.push(...(await this.rows()));
      const m = (await this.pagerText()).match(/(\d+) - (\d+) of (\d+)/);
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

  actionButton(loanNo) { return this.page.locator('tr', { hasText: loanNo }).first().locator('button').first(); }

  // opens the detail page of a loan (button "Review" / "View") - READ ONLY
  async openDetail(loanNo) {
    await this.searchFor(loanNo);
    await this.actionButton(loanNo).click();
    await this.page.waitForURL(/GoldDisbursalApprovalDetail/);
    await expect(this.page.getByText(loanNo, { exact: true }).first()).toBeVisible();
    await this.page.waitForTimeout(1200);
  }

  async detail() { return parseDetail(await this.page.locator('body').innerText()); }

  detailButtons() { return this.page.locator('button:visible').allInnerTexts().then((t) => t.map((x) => x.trim()).filter(Boolean)); }

  async back() { await this.page.getByRole('button', { name: /Back/ }).click(); await this.page.waitForURL(/GoldDisbursalApprovalQueue/); await this.page.waitForTimeout(1500); }

  headerCell(title) { return this.page.locator('th', { hasText: title }).first(); }

  async messages() { return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts(); }
}

module.exports = { GoldDisbQueuePage, parseDetail, STATUS, num, money };
