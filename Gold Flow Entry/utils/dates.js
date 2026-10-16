// Date helpers for back-dated flows. All app dates are dd/mm/yyyy (ngx-bootstrap calendars).
const { expect } = require('@playwright/test');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parse = (ddmmyyyy) => { const [d, m, y] = ddmmyyyy.split('/').map(Number); return new Date(y, m - 1, d); };
const fmt = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
const addMonths = (ddmmyyyy, n) => { const dt = parse(ddmmyyyy); dt.setMonth(dt.getMonth() + n); return fmt(dt); };
const today = () => fmt(new Date());
const monthsBetween = (fromDdmmyyyy, toDate = new Date()) => {
  const f = parse(fromDdmmyyyy);
  return (toDate.getFullYear() - f.getFullYear()) * 12 + (toDate.getMonth() - f.getMonth()) - (toDate.getDate() < f.getDate() ? 1 : 0);
};

// The back date for this run: $env:BACK_DATE (dd/mm/yyyy) or the flow's stored backDate. null = today (no back-dating).
function backDate(flow) {
  const v = process.env.BACK_DATE || (flow && flow.read().backDate) || null;
  if (v && !/^\d{2}\/\d{2}\/\d{4}$/.test(v)) throw new Error(`BACK_DATE must be dd/mm/yyyy, got "${v}"`);
  return v;
}

// Pick a date in the ngx-bootstrap calendar opened by clicking `field`.
// Throws a clear error when the calendar keeps that date disabled (the app does not allow it).
async function pickDate(page, field, ddmmyyyy, label = 'date') {
  const [d, m, y] = ddmmyyyy.split('/').map(Number);
  if ((await field.inputValue()) === ddmmyyyy) return;
  await field.click();
  const cal = page.locator('bs-datepicker-container');
  await expect(cal).toBeVisible();
  await cal.locator('button.current').last().click(); // → year view
  const year = cal.locator('td span', { hasText: new RegExp(`^${y}$`) });
  await expect(year, `${label}: year ${y} not selectable`).toBeVisible();
  await year.click();
  const month = cal.locator('td span', { hasText: new RegExp(`^${MONTHS[m - 1]}$`) });
  if (await month.evaluate((e) => e.classList.contains('disabled') || e.closest('td').classList.contains('disabled'))) {
    throw new Error(`${label}: ${MONTHS[m - 1]} ${y} is disabled in the calendar – the app does not allow ${ddmmyyyy} here`);
  }
  await month.click();
  const day = cal.locator('td span:not(.is-other-month)', { hasText: new RegExp(`^${d}$`) }).first();
  if (await day.evaluate((e) => e.classList.contains('disabled') || e.closest('td').classList.contains('disabled'))) {
    const allowed = (await cal.locator('td span:not(.disabled):not(.is-other-month)').allInnerTexts()).join(',');
    await page.keyboard.press('Escape');
    throw new Error(`${label}: ${ddmmyyyy} is disabled in the calendar (enabled days that month: ${allowed || 'none'})`);
  }
  await day.click();
  await expect(field, `${label} should now be ${ddmmyyyy}`).toHaveValue(ddmmyyyy);
}

module.exports = { MONTHS, parse, fmt, addMonths, today, monthsBetween, backDate, pickDate };
