const { expect } = require('@playwright/test');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Loans → Gold → Gold Loan Configuration → Daily Gold Rate
class GoldRatePage {
  constructor(page) {
    this.page = page;
    // The New form opens as a side panel; fields are scoped by :visible
    this.transDate = page.locator('[formcontrolname=ptransdate]:visible');
    this.rate24k = page.locator('[formcontrolname=pgoldrate]:visible').nth(0);
    this.rate22k = page.locator('[formcontrolname=pgoldrate]:visible').nth(1);
    this.rate18k = page.locator('[formcontrolname=pgoldrate]:visible').nth(2);
    this.save = page.locator('button, a').filter({ hasText: /^\s*Save\s*$/ }).locator('visible=true').last();
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
    await p.getByText('Daily Gold Rate', { exact: true }).click();
    await p.waitForURL(/open=GoldRateConfiguration/);
    await expect(p.getByText('Trans Date', { exact: true }).first()).toBeVisible();
  }

  async openNew() {
    await this.page.locator('a:has-text("New")').locator('visible=true').first().click();
    await expect(this.rate24k).toBeVisible();
  }

  async enter24k(rate) {
    await this.rate24k.fill(String(rate));
    await this.rate24k.press('Tab');
  }

  // Grid rows as [{ date: 'dd/mm/yyyy', rate24k }]
  async gridRows() {
    const rows = this.page.locator('tr', { hasText: /\d{2}\/\d{2}\/\d{4}/ });
    await expect(rows.first()).toBeVisible();
    const out = [];
    for (const r of await rows.all()) {
      const cells = await r.locator('td').allInnerTexts();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test((cells[0] || '').trim())) out.push({ date: cells[0].trim(), rate24k: GoldRatePage.num(cells[1]) });
    }
    return out;
  }

  // Realistic 24K rate: median of recent grid rates ± up to ₹150, rounded to 10 paise
  async auto24k() {
    const rates = (await this.gridRows()).slice(0, 15).map((r) => r.rate24k).sort((a, b) => a - b);
    const base = rates.length ? rates[Math.floor(rates.length / 2)] : 15000;
    return Math.round((base + (Math.random() * 300 - 150)) * 10) / 10;
  }

  // Candidate dates (from `fromDate` going back), skipping Sundays and dates that already have a rate
  async freeDates(fromDate, count = 10) {
    const taken = new Set((await this.gridRows()).map((r) => r.date));
    const [d, m, y] = fromDate.split('/').map(Number);
    const dt = new Date(y, m - 1, d);
    const out = [];
    for (let i = 0; i < 60 && out.length < count; i++, dt.setDate(dt.getDate() - 1)) {
      const s = GoldRatePage.fmt(dt);
      if (dt.getDay() !== 0 && !taken.has(s)) out.push(s);
    }
    if (!out.length) throw new Error('No free Trans Date found in the last 60 days');
    return out;
  }

  // Selects a date in the Trans Date calendar (ngx-bootstrap). Returns false if the date is disabled.
  async pickTransDate(ddmmyyyy) {
    const [d, m, y] = ddmmyyyy.split('/').map(Number);
    await this.transDate.click();
    const cal = this.page.locator('bs-datepicker-container');
    await cal.locator('button.current').last().click();
    await cal.locator('td span', { hasText: new RegExp('^' + y + '$') }).click();
    await cal.locator('td span', { hasText: new RegExp('^' + MONTHS[m - 1] + '$') }).click();
    await cal.locator('td span:not(.is-other-month)', { hasText: new RegExp('^' + d + '$') }).first().click();
    await this.page.waitForTimeout(300);
    if ((await this.transDate.inputValue()) === ddmmyyyy) return true;
    await this.page.keyboard.press('Escape');
    return false;
  }

  static fmt(dt) {
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  }

  static num(text) {
    return Number(String(text).replace(/[^\d.]/g, ''));
  }

  async rowFor(date) {
    return this.page.locator('tr', { hasText: date }).first();
  }

  async messages() {
    return this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts();
  }
}

module.exports = { GoldRatePage };
