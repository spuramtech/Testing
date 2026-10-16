const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const dates = require('../utils/dates');
const { LoginPage } = require('../pages/LoginPage');
const { ScheduledJobsPage } = require('../pages/ScheduledJobsPage');

// Admin runs the Scheduled Jobs for the CURRENT FLOW loan (after disbursal, before Loan Receipt):
//   Accrued Interest Job  – Type "Non EMI" (gold Bullet/Monthly schemes): runs on every MONTH-END after disbursal up to today
//                           (app note: "Month-end date only. Gold schemes accrue every month-end"). Type EMI uses Job Run Mode.
//   Instalment Receivables – every INSTALMENT DATE (disbursal date + n months) up to today
// Jobs are run in date order. Overrides: $env:JOB_TYPE="EMI"; $env:JOB_RUN_MODE="Instalment Date";
//   $env:ACCRUAL_DATES="31/07/2026,31/08/2026"; $env:RECEIVABLE_DATES="14/08/2026"
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

test('TC_SCHEDJOBS_001 - Run Accrued Interest + Instalment Receivables jobs for the flow loan dates (admin)', async ({ page }, testInfo) => {
  test.setTimeout(20 * 60_000);
  const jobs = new ScheduledJobsPage(page);
  const f = flow.read();
  const loan = flow.need('loanNumber', 'token');
  const disbursedOn = f.backDate || f.disbursedOn || dates.today();
  const now = new Date();
  const type = process.env.JOB_TYPE || 'Non EMI';
  const mode = process.env.JOB_RUN_MODE || 'Instalment Date';

  // Instalment dates: disbursal + 1..n months, up to today
  let receivable = list(process.env.RECEIVABLE_DATES);
  if (!receivable.length) for (let i = 1; i <= 60; i++) { const d = dates.addMonths(disbursedOn, i); if (dates.parse(d) > now) break; receivable.push(d); }
  // Accrual dates: Non EMI → month-ends after disbursal before today; EMI → same as instalment dates
  let accrual = list(process.env.ACCRUAL_DATES);
  if (!accrual.length) {
    if (/non/i.test(type)) {
      const start = dates.parse(disbursedOn);
      for (let i = 0; i < 60; i++) {
        const me = new Date(start.getFullYear(), start.getMonth() + i + 1, 0); // last day of month i
        if (me >= now) break;
        if (me >= start) accrual.push(dates.fmt(me));
      }
    } else accrual = [...receivable];
  }
  const plan = [...accrual.map((d) => ({ d, job: 'Accrued Interest Job' })), ...receivable.map((d) => ({ d, job: 'Instalment Receivables' }))]
    .sort((a, b) => dates.parse(a.d) - dates.parse(b.d) || (a.job < b.job ? -1 : 1));
  test.skip(!plan.length, `Loan ${loan} was disbursed on ${disbursedOn} – no month-end / instalment date has passed yet (use $env:BACK_DATE)`);
  console.log(`Flow loan ${loan} disbursed ${disbursedOn}`);
  console.log(`  Accrued Interest (${type}${/non/i.test(type) ? ', month-end' : ', ' + mode}): ${accrual.join(', ') || '-'}`);
  console.log(`  Instalment Receivables: ${receivable.join(', ') || '-'}`);
  testInfo.annotations.push({ type: 'job-plan', description: plan.map((p) => `${p.d} ${p.job}`).join('; ') });

  await test.step('Login as admin', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Jobs → Scheduled Jobs', () => jobs.open());

  const results = [];
  for (const { d, job } of plan) {
    await test.step(`${job} – ${d}`, async () => {
      const msg = await jobs.run(job, d, job === 'Accrued Interest Job' ? { Type: type, pJobRunMode: mode } : {});
      console.log(`${job} ${d}: ${msg}`);
      results.push(`${job} ${d}: ${msg}`);
      expect(msg).not.toMatch(/error|fail|exception/i);
    });
  }
  flow.update('scheduled-jobs', { accrualDates: accrual, receivableDates: receivable, jobType: type, jobResults: results });
});
