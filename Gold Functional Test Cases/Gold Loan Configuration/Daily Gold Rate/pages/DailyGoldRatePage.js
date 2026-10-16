const { expect } = require('@playwright/test');
const { go } = require('../../../common/utils/nav');
const { MONTHS, fmt, parse } = require('../../../common/utils/dates');

// Loans → Gold → Gold Loan Configuration → Daily Gold Rate (Online Rate / Internal Rate tabs)
class DailyGoldRatePage {
  constructor(page) {
    this.page = page;
    // Side panel (New / Edit) – fields scoped by :visible because the panel is re-rendered
    this.panel = page.locator('#add-online-detail');
    this.panelTitle = page.getByText('Online Gold Rate Submission', { exact: true });
    this.loanType = page.locator('[formcontrolname=pLoantype]:visible');
    this.transDate = page.locator('[formcontrolname=ptransdate]:visible');
    this.rate24k = page.locator('[formcontrolname=pgoldrate]:visible').nth(0);
    this.rate22k = page.locator('[formcontrolname=pgoldrate]:visible').nth(1);
    this.rate18k = page.locator('[formcontrolname=pgoldrate]:visible').nth(2);
    this.saveBtn = this.button('Save');
    this.updateBtn = this.button('Update');
    this.clearBtn = this.button('Clear');
    this.newBtn = page.locator('a:has-text("New")').locator('visible=true').first();
    this.search = page.locator('input[kendotextbox][placeholder="Search in all columns..."]:visible').first();
    this.dateRange = page.locator('[formcontrolname=Daterange]:visible').first();
    this.pagerInfo = page.locator('.k-pager-info:visible').first();
    this.calendar = page.locator('bs-datepicker-container');
    this.toasts = page.locator('.toast-message, .toast-title');
  }

  button(text) {
    return this.page.locator('button, a').filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) }).locator('visible=true').last();
  }

  async open() {
    const p = this.page;
    await go(p, 'Gold Loan Configuration', ['Loans', 'Gold']);
    await p.waitForURL(/GoldLoanConfiguration/);
    await p.getByText('Daily Gold Rate', { exact: true }).first().click();
    await p.waitForURL(/open=GoldRateConfiguration/);
    await expect(p.getByText('Trans Date', { exact: true }).first()).toBeVisible();
    await this.waitGrid();
  }

  async waitGrid() {
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await expect(this.pagerInfo).toBeVisible();
  }

  async tab(name) {
    await this.page.getByText(name, { exact: true }).first().click();
    await this.page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(800);
  }

  async openNew() {
    await this.newBtn.click();
    await expect(this.rate24k).toBeVisible();
  }

  async setRange(option) {
    await this.dateRange.click();
    await this.page.locator('ng-dropdown-panel .ng-option', { hasText: new RegExp(`^${option}$`) }).click();
    await this.waitGrid();
    await this.page.waitForTimeout(800);
  }

  async rangeOptions() {
    await this.dateRange.click();
    const opts = await this.page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
    await this.page.keyboard.press('Escape');
    return opts.map((o) => o.trim());
  }

  // Type into 24K like a user (input mask applies) and leave the field
  async type24k(value) {
    await this.rate24k.fill('');
    if (String(value) !== '') await this.rate24k.pressSequentially(String(value));
    await this.rate24k.press('Tab');
    await this.page.waitForTimeout(200);
  }

  async values() {
    return { date: await this.transDate.inputValue(), r24: await this.rate24k.inputValue(), r22: await this.rate22k.inputValue(), r18: await this.rate18k.inputValue() };
  }

  // Online grid rows on the current page: [{ date, r24, r22, r18, editable, deletable, lockTitle }]
  async rows() {
    const out = [];
    for (const r of await this.page.locator('tr:visible', { hasText: /\d{2}\/\d{2}\/\d{4}/ }).all()) {
      const cells = (await r.locator('td').allInnerTexts()).map((c) => c.trim());
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cells[0] || '')) continue;
      out.push({
        date: cells[0], r24: num(cells[1]), r22: num(cells[2]), r18: num(cells[3]),
        editable: await r.locator('.fa-pencil').count() > 0,
        deletable: await r.locator('.fa-trash-o').count() > 0,
        lockTitle: await r.locator('.fa-lock').count() ? await r.locator('.fa-lock').locator('xpath=..').getAttribute('title') : null,
      });
    }
    return out;
  }

  async footerAverages() {
    const cells = await this.page.locator('tr:visible', { hasText: 'Average Rate' }).first().locator('td').allInnerTexts();
    return cells.slice(1, 4).map(num);
  }

  async totalItems() {
    const m = (await this.pagerInfo.innerText()).match(/of (\d+) items/);
    return m ? Number(m[1]) : 0;
  }

  // All online rows across every pager page (current range)
  async allRows() {
    const seen = new Map();
    for (let i = 0; i < 50; i++) {
      for (const r of await this.rows()) seen.set(r.date, r);
      const next = this.page.locator('.k-pager-nav[title*="next" i]:visible').first();
      if (!(await next.count()) || /disabled/.test(await next.getAttribute('class')) || (await next.getAttribute('aria-disabled')) === 'true') break;
      await next.click();
      await this.page.waitForTimeout(300);
    }
    return [...seen.values()];
  }

  rowLocator(date) {
    return this.page.locator('tr:visible', { hasText: date }).first();
  }

  // Bring the row for `date` on screen (range All + paging). Returns null if not found.
  async findRow(date) {
    await this.setRange('All');
    for (let i = 0; i < 50; i++) {
      if (await this.rowLocator(date).isVisible().catch(() => false)) return this.rowLocator(date);
      const next = this.page.locator('.k-pager-nav[title*="next" i]:visible').first();
      if (!(await next.count()) || /disabled/.test(await next.getAttribute('class')) || (await next.getAttribute('aria-disabled')) === 'true') return null;
      await next.click();
      await this.page.waitForTimeout(300);
    }
    return null;
  }

  // Internal Rate grid rows: [{ date (dd/mm/yyyy), status, avg30, prevClosing, rate }]
  async internalRows() {
    const out = [];
    for (const r of await this.page.locator('tr:visible', { hasText: /\d{2}-\d{2}-\d{4}/ }).all()) {
      const c = (await r.locator('td').allInnerTexts()).map((x) => x.trim());
      const m = (c[0] || '').match(/(\d{2})-(\d{2})-(\d{4})\s*(\w+)?/);
      if (!m) continue;
      out.push({ date: `${m[1]}/${m[2]}/${m[3]}`, status: m[4] || '', avg30: num(c[1]), prevClosing: num(c[2]), rate: num(c[3]) });
    }
    return out;
  }

  // --- calendar ---
  async openCalendar() {
    await this.transDate.click();
    await expect(this.calendar).toBeVisible();
  }

  async calendarMonth() {
    return (await this.calendar.locator('.current').allInnerTexts()).join(' ').trim();
  }

  async disabledDays() {
    return (await this.calendar.locator('td span.disabled:not(.is-other-month)').allInnerTexts()).map(Number);
  }

  async enabledDays() {
    return (await this.calendar.locator('td span:not(.disabled):not(.is-other-month)').allInnerTexts()).map(Number);
  }

  async calendarPrev() {
    await this.calendar.locator('.previous').click();
    await this.page.waitForTimeout(200);
  }

  // Selects a date; returns false if it is disabled
  async pickDate(ddmmyyyy) {
    const [d, m, y] = ddmmyyyy.split('/').map(Number);
    if (!(await this.calendar.isVisible())) await this.openCalendar();
    await this.calendar.locator('button.current').last().click();
    await this.calendar.locator('td span', { hasText: new RegExp(`^${y}$`) }).click();
    await this.calendar.locator('td span', { hasText: new RegExp(`^${MONTHS[m - 1]}$`) }).click();
    const day = this.calendar.locator('td span:not(.is-other-month)', { hasText: new RegExp(`^${d}$`) }).first();
    if (/disabled/.test(await day.getAttribute('class'))) { await this.page.keyboard.press('Escape'); return false; }
    await day.click();
    await this.page.waitForTimeout(200);
    return (await this.transDate.inputValue()) === ddmmyyyy;
  }

  // A past working day with no Online rate yet. With `cleanable`, also require that the next working day's
  // Internal Rate is not APPROVED – then the new row stays editable/deletable and the test can remove it.
  async freeDate({ cleanable = false, maxDaysBack = 365 } = {}) {
    const { prevWorkingDay, nextWorkingDay, addDays, isSunday } = require('../../../common/utils/workdays');
    await this.setRange('All');
    const taken = new Set((await this.allRows()).map((r) => r.date));
    let approved = new Set();
    if (cleanable) {
      await this.tab('Internal Rate');
      await this.setRange('All');
      for (let i = 0; i < 50; i++) {
        for (const r of await this.internalRows()) if (/APPROVED/i.test(r.status)) approved.add(r.date);
        const next = this.page.locator('.k-pager-nav[title*="next" i]:visible').first();
        if (!(await next.count()) || /disabled/.test(await next.getAttribute('class')) || (await next.getAttribute('aria-disabled')) === 'true') break;
        await next.click();
        await this.page.waitForTimeout(300);
      }
      await this.tab('Online Rate');
      await this.waitGrid();
    }
    for (let d = prevWorkingDay(), i = 0; i < maxDaysBack; d = addDays(d, -1), i++) {
      if (isSunday(d)) continue;
      const s = fmt(d);
      if (taken.has(s)) continue;
      if (cleanable && approved.has(fmt(nextWorkingDay(d)))) continue;
      return s;
    }
    return null;
  }

  async messages() {
    return (await this.toasts.allInnerTexts()).join(' | ');
  }

  async waitMessage() {
    await expect(this.toasts.first()).toBeVisible();
    await this.page.waitForTimeout(800); // a second toast (internal rate) follows the first
    return this.messages();
  }

  async closeToasts() {
    for (const b of await this.page.locator('.toast-close-button:visible').all()) await b.click().catch(() => {});
  }
}

function num(text) {
  const n = Number(String(text ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

const round2 = (n) => Math.round(n * 100) / 100;

module.exports = { DailyGoldRatePage, num, round2, fmt, parse };
