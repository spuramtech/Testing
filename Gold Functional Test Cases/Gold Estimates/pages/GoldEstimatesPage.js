const { expect } = require('@playwright/test');
const { go } = require('../../common/utils/nav');

// Loans → Gold → Gold Estimates (New Estimate). Grid columns use aria-colindex:
// 1 Purity · 2 Article Type · 3 Quantity · 4 Gross Wt · 5 Stone/Wastage · 6 Stone Count · 7 Net Wt · 8 Purity Ded% ·
// 9 Pure Net Wt · 10 Gold Rate · 11 Total · 12 Defects · 13 Images
class GoldEstimatesPage {
  constructor(page) {
    this.page = page;
    this.contact = page.locator('ng-select[formcontrolname=pCustomername]');
    this.date = page.locator('[formcontrolname=ptodayDate]').first();
    this.loanName = page.locator('select[formcontrolname=pLoantypeid]');
    this.scheme = page.locator('select', { has: page.locator('option', { hasText: 'Not applied' }) });
    this.remarks = page.locator('textarea[formcontrolname=pRemarks]');
    this.saveBtn = page.locator('button:visible').filter({ hasText: /^\s*Save\s*$/ }).last();
    this.clearBtn = page.locator('button:visible, a:visible').filter({ hasText: /^\s*Clear\s*$/ }).last();
    this.addRowBtn = page.getByRole('button', { name: /Add Row/i });
    this.review = page.getByText('Review Gold Estimate', { exact: true }).locator('xpath=ancestor::*[.//button[contains(.,"Confirm")]][1]');
    this.confirmBtn = page.getByRole('button', { name: /Confirm & Save/i });
    this.backBtn = page.getByRole('button', { name: /Back to Edit/i });
    this.toasts = page.locator('.toast-message, .toast-title');
    this.calendar = page.locator('bs-datepicker-container');
  }

  async open() {
    await go(this.page, 'Gold Estimates', ['Loans', 'Gold']);
    await this.page.waitForURL(/#\/Loans\/GoldEstimates$/);
    await expect(this.contact).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  }

  // Search and pick a contact; returns the option text
  async selectContact(search = 'Autotest', index = 0) {
    await this.contact.click();
    await this.contact.locator('input').fill(search);
    const opt = this.page.locator('ng-dropdown-panel .ng-option').nth(index);
    await expect(opt).toBeVisible({ timeout: 15_000 });
    await this.page.waitForTimeout(1000);
    const text = (await opt.innerText()).replace(/\s+/g, ' ').trim();
    await opt.click();
    await expect(this.rows().first()).toBeVisible();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    return text;
  }

  rows() {
    return this.page.locator('tr:visible', { has: this.page.locator('td[aria-colindex="2"] select') });
  }

  cell(i, col) {
    return this.rows().nth(i).locator(`td[aria-colindex="${col}"] input`).first();
  }

  async typeCell(i, col, value) {
    const c = this.cell(i, col);
    await c.fill('');
    if (String(value) !== '') await c.pressSequentially(String(value));
    await c.press('Tab');
    await this.page.waitForTimeout(300);
  }

  async setPurity(i, label) {
    await this.rows().nth(i).locator('td[aria-colindex="1"] ng-select').click();
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: label }).first().click();
    await this.page.waitForTimeout(1200); // rate for that purity is fetched
  }

  // a = { type, quantity, gross, stone, count, purity }
  async fillRow(i, a) {
    if (a.purity) await this.setPurity(i, a.purity);
    if (a.type) await this.rows().nth(i).locator('td[aria-colindex="2"] select').selectOption({ label: a.type });
    if (a.quantity !== undefined) await this.cell(i, 3).fill(String(a.quantity));
    if (a.gross !== undefined) await this.cell(i, 4).fill(String(a.gross));
    if (a.stone !== undefined) await this.cell(i, 5).fill(String(a.stone));
    await this.cell(i, 6).fill(String(a.count ?? 0));
    await this.cell(i, 6).press('Tab');
    await this.page.waitForTimeout(800);
  }

  // { purityText, rateText, net, wastageText, purityDed, pureNet, rate, total }
  async readRow(i) {
    const td = (n) => this.rows().nth(i).locator(`td[aria-colindex="${n}"]`);
    const netText = (await td(7).innerText()).replace(/\s+/g, ' ');
    return {
      purityText: (await td(1).innerText()).replace(/\s+/g, ' ').trim(),
      net: num(netText.split(' ')[0]),
      wastageText: netText,
      purityDed: num(await td(8).innerText()),
      pureNet: num(await td(9).innerText()),
      rate: num(await td(10).innerText()),
      total: num(await td(11).innerText()),
    };
  }

  // Totals box: { pureNet, quantity, value, ratePerGram, ltv, ltvText, eligible }
  async totals() {
    const body = (await this.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const grab = (re) => (body.match(re) || [])[1];
    const eligibleInput = this.page.locator('#GoldEstimateValue').locator('xpath=following-sibling::div//input').first();
    return {
      pureNet: num(grab(/TOTAL PURE NETWEIGHT ([\d,.]+) g/i)),
      quantity: num(grab(/TOTAL QUANTITY (\d+)/i)),
      value: num(grab(/APPRAISAL VALUE ([\d,.]+)/i)),
      ratePerGram: num(grab(/RATE \/ GRAM ₹ ([\d,.]+)/i)),
      ltv: num(grab(/LTV % SCHEME ([\d.]+)%/i)),
      ltvText: grab(/LTV % (?:SCHEME )?([^A-Z]*?(?:Not Configured|[\d.]+%))/i),
      eligible: num(await eligibleInput.inputValue().catch(() => '')),
    };
  }

  async uploadImage(file) {
    const section = this.page.getByText(/Upload Gold Articles Images/i).first().locator('xpath=ancestor::div[.//button][1]');
    const [chooser] = await Promise.all([this.page.waitForEvent('filechooser'), section.locator('button').first().click()]);
    await chooser.setFiles(file);
    await expect(section.locator('input[type=text]').first()).toHaveValue(/\.png$/i, { timeout: 30_000 });
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).join(' | ');
  }

  async waitMessage() {
    await expect(this.toasts.first()).toBeVisible();
    await this.page.waitForTimeout(600);
    return this.messages();
  }

  async clearToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
    await this.page.waitForTimeout(200);
  }
}

function num(text) {
  const m = String(text ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}
const round2 = (n) => Math.round(n * 100) / 100;

// Stone wastage (Stone Deduction master on host214): % of (gross − stone) by stone share of gross
const WASTAGE = [[0, 5, 0], [5, 10, 1], [10, 25, 2], [25, 40, 5], [40, Infinity, 8]];
function expectedNet(gross, stone) {
  const share = (stone / gross) * 100;
  const pct = (WASTAGE.find(([lo, hi]) => share >= lo && share < hi) || [0, 0, 0])[2];
  return round2((gross - stone) * (1 - pct / 100));
}

module.exports = { GoldEstimatesPage, num, round2, expectedNet, WASTAGE };
