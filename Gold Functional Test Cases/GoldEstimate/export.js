// Builds the Gold Estimate deliverables from the REAL execution results (GoldEstimate/reports/execution-results.json,
// written by utils/qmetry-report.js when QMETRY_CASES_OUT is set). Nothing here is invented: every status comes from the results file.
//   node GoldEstimate/export.js
// Outputs (GoldEstimate/reports/):
//   QMetry-Import-GoldEstimate.csv        one row per test step, for QMetry "Import from Excel/CSV" (map the columns in the Map Fields step)
//   Execution-Results-GoldEstimate.csv    one row per test with the full execution record
//   Traceability-GoldEstimate.csv         requirement -> test -> script -> status -> evidence
//   Reconciliation-and-Gaps-GoldEstimate.md   reconciliation table + coverage by the 37 test categories + not-executed reasons
//   Defect-Candidates-GoldEstimate.md     failed tests with reproducible steps (candidates, not confirmed)
//   ../REQUIREMENTS_GoldEstimate.md       requirement / business-rule inventory with computed verification status
const fs = require('fs');
const path = require('path');
const { COV, CFG, REQS } = require('./qmetry-meta');

const root = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'reports');
const data = JSON.parse(fs.readFileSync(path.join(outDir, 'execution-results.json'), 'utf8'));
const cases = data.cases;
const rec = data.reconciliation;

const csvCell = (v) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
const rel = (p) => (p ? path.relative(root, p).replace(/\\/g, '/') : '');
const oneLine = (s, n = 400) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

let contact = '';
try { const c = require('../Contact/test-data/coverage-contact.json').d; contact = `${c.firstName} ${c.lastName} / ${c.mobile}`; } catch { /* no contact file */ }
const TEST_DATA = `Synthetic data. Contact ${contact || 'AUTOTEST contact'} (from Contact CREATE_01); article RING qty 1, gross 10.5 g, stone wastage 0.5 g, stone count 0; scheme AUTOTEST SCHEME; image gold-article.png. Test-specific values are in the steps.`;

const prefix = (c) => c.shortId.replace(/_\d+$/, '');
const priority = (c) => {
  if (['CREATE_01', 'API_01', 'WORKFLOW_01'].includes(c.shortId)) return 'P0';
  if (['REQUIRED', 'BOUNDARY', 'BUSINESS', 'CONSISTENCY', 'DUPLICATE', 'READ', 'API', 'ERROR', 'ROLE', 'INPUT'].includes(prefix(c)) || ['SESSION_01', 'SESSION_02'].includes(c.shortId)) return 'P1';
  if (['A11Y', 'LENGTH'].includes(prefix(c))) return 'P3';
  return 'P2';
};
const jiraPriority = { P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low' };
const screenOf = (c) => {
  const t = c.title + ' ' + c.meta.summary;
  if (/Summary page|Approval Detail|Status History/i.test(t)) return 'Summary (Approval Detail)';
  if (/My Gold Estimates|My Saved Estimates|My GE|list API|pager|page 2/i.test(t)) return 'My Gold Estimates';
  return 'New Estimate';
};
const reqsOf = (c) => REQS.filter((q) => q.tests.includes(c.shortId)).map((q) => q.id);
const defectIds = new Map();
cases.filter((c) => c.final === 'FAILED').forEach((c, i) => defectIds.set(c.shortId + c.title, `DC-EST-${String(i + 1).padStart(3, '0')}`));
const defectOf = (c) => defectIds.get(c.shortId + c.title) || '';
const actual = (c) => {
  if (c.final === 'PASSED') return 'Behaved as expected; all assertions passed.';
  if (c.final === 'FAILED') return oneLine(c.error, 300);
  if (c.final === 'BLOCKED') return 'BLOCKED by the environment (login / page-load timeout): ' + oneLine(c.error, 150);
  return oneLine(c.notes[0], 300) || c.final;
};
const steps = (c) => (c.meta.steps || []);

// ---------------------------------------------------------------- QMetry import CSV (one row per step)
const qm = [['Test Case ID', 'Summary', 'Description', 'Precondition', 'Priority', 'Status', 'Labels', 'Component', 'Requirement', 'Automation Script', 'Step Summary', 'Test Data', 'Expected Result']];
for (const c of cases) {
  const st = steps(c).length ? steps(c) : ['See summary'];
  st.forEach((s, i) => {
    const first = i === 0, last = i === st.length - 1;
    qm.push([
      first ? c.id : '', first ? c.meta.summary : '', first ? `${c.meta.type}. Last execution: ${c.final}.` : '', first ? CFG.pre : '',
      first ? jiraPriority[priority(c)] : '', first ? 'Approved' : '', first ? ['GoldEstimate', 'Automated', c.meta.type.replace(/[^A-Za-z0-9]+/g, '-')].join(' ') : '',
      first ? screenOf(c) : '', first ? reqsOf(c).join(' ') : '', first ? rel(c.file ? path.resolve(root, c.file.startsWith('GoldEstimate') ? c.file : 'GoldEstimate/tests/' + c.file) : '') : '',
      s, first ? TEST_DATA : '', last ? c.meta.expected : '',
    ]);
  });
}
fs.writeFileSync(path.join(outDir, 'QMetry-Import-GoldEstimate.csv'), csv(qm));

// ---------------------------------------------------------------- execution results CSV (one row per test)
const ex = [['Test Case ID', 'Requirement ID', 'Module', 'Screen', 'Feature', 'Scenario', 'Test Type', 'Priority', 'Preconditions', 'Test Data', 'Detailed Steps', 'Expected Result', 'Actual Result', 'Execution Status', 'Evidence', 'Defect ID', 'Automation Script Path', 'Execution Timestamp', 'Duration (s)']];
for (const c of cases) {
  ex.push([c.id, reqsOf(c).join(' ') || 'UNMAPPED', 'Gold Estimate', screenOf(c), c.meta.module, c.meta.summary, c.meta.type, priority(c), CFG.pre, TEST_DATA,
    steps(c).map((s, i) => `${i + 1}. ${s}`).join(' | '), c.meta.expected, actual(c), c.final, rel(c.shotPath), defectOf(c), (c.file || '').replace(/\\/g, '/'), c.startTime, (c.duration / 1000).toFixed(1)]);
}
fs.writeFileSync(path.join(outDir, 'Execution-Results-GoldEstimate.csv'), csv(ex));

// ---------------------------------------------------------------- traceability CSV
const byShort = new Map();
for (const c of cases) (byShort.get(c.shortId) || byShort.set(c.shortId, []).get(c.shortId)).push(c);
const tr = [['Requirement ID', 'Requirement', 'Basis', 'Requirement Status', 'Test Case ID', 'Scenario', 'Automation Script', 'Execution Status', 'Evidence', 'Defect ID']];
for (const q of REQS) {
  const linked = q.tests.flatMap((t) => byShort.get(t) || []);
  if (!linked.length) tr.push([q.id, q.text, q.basis, q.state, '(none)', '', '', 'NO TEST', '', '']);
  for (const c of linked) tr.push([q.id, q.text, q.basis, q.state, c.id, c.meta.summary, (c.file || '').replace(/\\/g, '/'), c.final, rel(c.shotPath), defectOf(c)]);
}
for (const c of cases.filter((x) => !reqsOf(x).length)) tr.push(['UNMAPPED', '', '', '', c.id, c.meta.summary, (c.file || '').replace(/\\/g, '/'), c.final, rel(c.shotPath), defectOf(c)]);
fs.writeFileSync(path.join(outDir, 'Traceability-GoldEstimate.csv'), csv(tr));

// ---------------------------------------------------------------- coverage by the 37 test categories
const r = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${p}_${String(a + i).padStart(2, '0')}`);
const CATS = [
  ['Positive functional testing', ['CREATE_01']],
  ['Negative functional testing', [...r('REQUIRED', 1, 7), ...r('BOUNDARY', 1, 3)]],
  ['Required-field validation', r('REQUIRED', 1, 7)],
  ['Empty, null and whitespace input', ['INPUT_03', 'REQUIRED_01', 'REQUIRED_02']],
  ['Minimum and maximum length', ['LENGTH_01', 'LENGTH_02', 'BOUNDARY_04', 'BOUNDARY_05']],
  ['Boundary value analysis', r('BOUNDARY', 1, 9)],
  ['Equivalence partitioning', ['BOUNDARY_09', 'BOUNDARY_05', 'BOUNDARY_04']],
  ['Data type and format validation', ['INPUT_01', 'INPUT_04', 'BOUNDARY_06']],
  ['Invalid and special characters', ['INPUT_02', 'INPUT_04', 'INPUT_05']],
  ['Dropdown and autocomplete selection', ['SEARCH_01', 'SEARCH_02', 'SEARCH_03', 'INPUT_06']],
  ['Field dependency testing', ['BUSINESS_08', 'BUSINESS_02', 'BUSINESS_06']],
  ['Conditional field behaviour', ['BUSINESS_08', 'UPDATE_02']],
  ['Default value verification', ['DEFAULT_01']],
  ['Create and Save', ['CREATE_01', 'CANCEL_02']],
  ['Read and Search', [...r('READ', 1, 4), 'SEARCH_01', 'SEARCH_02', 'SEARCH_03']],
  ['Edit and Update', ['UPDATE_01', 'UPDATE_02'], 'Editing a SAVED estimate (for example one sent back to the appraiser) is not covered: no estimate is in that state on this server.'],
  ['Delete, where supported', ['DELETE_01']],
  ['Cancel, Reset and Clear', ['CANCEL_01', 'CANCEL_02', 'CLEAR_01']],
  ['Duplicate record prevention', ['DUPLICATE_01', 'DUPLICATE_02']],
  ['Business rule validation', [...r('BUSINESS', 1, 9), 'REQUIRED_07']],
  ['Calculation and total validation', [...r('BUSINESS', 1, 7), 'BOUNDARY_09']],
  ['Date and time validation', r('DATE', 1, 3)],
  ['Cross-field validation', ['BOUNDARY_02', 'BOUNDARY_07', 'BUSINESS_04']],
  ['Error messages and validation placement', ['REQUIRED_01', 'REQUIRED_06', 'ERROR_01'], 'Message text and timing are checked; the on-screen PLACEMENT of messages is not asserted.'],
  ['Double-click and repeated submission', ['SESSION_04'], 'Double-click on Save is covered. Double-click on Confirm & Save is not run: it could create duplicate estimates that cannot be deleted.'],
  ['Session timeout and recovery', ['SESSION_02', 'SESSION_03'], 'Real server-side session expiry is not simulated; browser storage is cleared instead.'],
  ['Role-based access control', ['ROLE_01', 'BUSINESS_09']],
  ['Navigation and workflow transition', [...r('NAV', 1, 3), 'WORKFLOW_01', 'WORKFLOW_02']],
  ['API integration and response validation', r('API', 1, 5)],
  ['Persistence and data consistency', ['READ_02', 'READ_03', 'READ_04', ...r('CONSISTENCY', 1, 3)]],
  ['Sorting, filtering and pagination', ['SORT_01', 'FILTER_01', 'PAGINATION_01', 'PAGINATION_02']],
  ['File upload and download', r('FILE', 1, 3), 'Download is not applicable (the screen has no download).'],
  ['Concurrent updates', ['SESSION_05']],
  ['Regression testing', [], 'Provided as the "npm run estimate-smoke" and full-suite commands; not a separate set of test cases.'],
  ['UI usability and accessibility checks', ['A11Y_01', 'A11Y_02', 'A11Y_03']],
  ['Browser compatibility and responsive behaviour', ['A11Y_01', 'A11Y_03', 'A11Y_04'], 'Responsive sizes run in Chromium; Firefox / WebKit are not installed.'],
  ['Recovery after failed or interrupted transactions', ['ERROR_01', 'ERROR_02']],
];
const catRows = CATS.map(([name, ids, note = '']) => {
  const list = ids.flatMap((i) => byShort.get(i) || []);
  const n = (s) => list.filter((c) => c.final === s).length;
  return `| ${name} | ${list.length} | ${n('PASSED')} | ${n('FAILED')} | ${n('BLOCKED')} | ${n('N/A') + n('NOT EXECUTED') + n('SKIPPED')} | ${list.length ? '' : 'GAP: no test. '}${note} |`;
});

// ---------------------------------------------------------------- reconciliation + gaps markdown
const listBy = (s) => cases.filter((c) => c.final === s).map((c) => `- **${c.id}** - ${oneLine(c.notes[0] || c.error, 220)}`).join('\n') || '- none';
const md = `# Gold Estimate - Coverage reconciliation and gap report

Generated ${data.generatedAt} from the real execution results. Environment: \`${data.environment}\`.

## Reconciliation

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| ${rec.generated} | ${rec.automated} | ${rec.discovered} | ${rec.executed} | ${rec.passed} | ${rec.failed} | ${rec.blocked} | ${rec.skipped} | ${rec.notExecuted} | ${rec.na} |

- Executed = Passed + Failed (a test that ran to its assertion).
- Passed + Failed + Blocked + Skipped + Not executed + N/A = ${rec.passed + rec.failed + rec.blocked + rec.skipped + rec.notExecuted + rec.na} = Discovered (${rec.discovered}) - ${rec.reconciles ? 'reconciles, no double counting' : '**DOES NOT RECONCILE - investigate**'}.
- Generated = designed cases (steps and expected result written in the metadata) plus any tests found. Designed cases without a script: ${data.designedNoScript.length ? data.designedNoScript.join(', ') : 'none'}.
- "Coverage" is only claimed against this denominator (${rec.generated} generated cases). It is not a claim of 100% coverage of the application.

## Not executed, not applicable and blocked - with reasons

**N/A**
${listBy('N/A')}

**NOT EXECUTED**
${listBy('NOT EXECUTED')}

**SKIPPED**
${listBy('SKIPPED')}

**BLOCKED (environment: login or page-load timeout, not an application result)**
${listBy('BLOCKED')}

## Coverage by the 37 test categories

| Category | Tests | Passed | Failed | Blocked | N/A / not executed | Gap / note |
|---|---|---|---|---|---|---|
${catRows.join('\n')}

## Not covered (final gap list)
- Server-side validation by direct API calls (API_05) - not executed for data safety (could create an undeletable invalid estimate).
- Concurrent saves for one contact (SESSION_05) - needs two real estimates.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Editing a saved / sent-back estimate - no estimate in that state; the Approval suite covers the approver side.
- Double-click on Confirm & Save, and a retry after a failed save, - would create real estimates.
- The estimate "Take Photo" (camera) button - needs a camera.
- Database verification - no database access was provided; persistence was checked through the Summary page and the list API instead.
`;
fs.writeFileSync(path.join(outDir, 'Reconciliation-and-Gaps-GoldEstimate.md'), md);

// ---------------------------------------------------------------- defect candidates
const fails = cases.filter((c) => c.final === 'FAILED');
const dmd = `# Gold Estimate - defect candidates

These are tests that FAILED on \`${data.environment}\`. They are **candidates**, not confirmed defects: each needs a human to confirm the expected behaviour.

${fails.map((c) => `## ${defectOf(c)} - ${c.meta.summary}
- Test case: ${c.id} (${c.meta.type})
- Requirement: ${reqsOf(c).join(', ') || 'unmapped'}
- Steps to reproduce:
${steps(c).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
- Expected: ${c.meta.expected}
- Actual: ${oneLine(c.error, 350)}
- Evidence: ${rel(c.shotPath) || 'none'}
`).join('\n') || 'No failed tests.'}
`;
fs.writeFileSync(path.join(outDir, 'Defect-Candidates-GoldEstimate.md'), dmd);

// ---------------------------------------------------------------- requirements document
const reqMd = `# Gold Estimate - requirements and business-rule inventory

Environment tested: \`${data.environment}\`. Source: behaviour observed in the running application and in the existing automation; **no business document was supplied**.

- **Observed** = seen in the application (screen, API response, existing script).
- **Hypothesis** = inferred, not confirmed by documentation. The linked tests check it; the status shows what they found.
- **Status** is computed from the test results: VERIFIED (all linked tests passed), DEFECT CANDIDATE (a linked test failed), NOT FULLY VERIFIED (a linked test was blocked), PARTLY VERIFIED / NOT VERIFIED (linked tests skipped or not executed).

| ID | Screen | Area | Requirement / business rule | Basis | Tests | Status |
|---|---|---|---|---|---|---|
${REQS.map((q) => `| ${q.id} | ${q.screen} | ${q.area} | ${q.text.replace(/\|/g, '/')} | ${q.basis === 'OBSERVED' ? 'Observed' : 'Hypothesis'} | ${q.tests.join(', ')} | ${(data.requirements.find((x) => x.id === q.id) || {}).state || ''} |`).join('\n')}
`;
fs.writeFileSync(path.join(__dirname, 'REQUIREMENTS_GoldEstimate.md'), reqMd);

console.log(`Exported: ${cases.length} test cases, ${REQS.length} requirements, ${fails.length} defect candidates -> ${rel(outDir)}`);
