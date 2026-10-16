// Working-day helpers for Daily Gold Rate. The app treats Sunday as the only non-working day
// (getholidaylist returned [] for 2025/2026 on host214) – holidays would need adding here if the app starts using them.
const { fmt, parse } = require('./dates');

const isSunday = (d) => d.getDay() === 0;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function prevWorkingDay(from = today0()) {
  let d = addDays(from, -1);
  while (isSunday(d)) d = addDays(d, -1);
  return d;
}

function nextWorkingDay(from) {
  let d = addDays(from, 1);
  while (isSunday(d)) d = addDays(d, 1);
  return d;
}

module.exports = { isSunday, addDays, today0, prevWorkingDay, nextWorkingDay, fmt, parse };
