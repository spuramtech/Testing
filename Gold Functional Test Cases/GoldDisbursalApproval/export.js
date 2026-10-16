// Builds the Gold Disbursal Approval Queue deliverables from the REAL execution results (GoldDisbursalApproval/reports/execution-results.json,
// written by utils/qmetry-report.js when QMETRY_CASES_OUT is set). Nothing here is invented: every status comes from the results file.
//   node GoldDisbursalApproval/export.js
// Outputs (GoldDisbursalApproval/reports/): QMetry-Import-GoldDisbursalApproval.csv, Execution-Results-GoldDisbursalApproval.csv, Traceability-GoldDisbursalApproval.csv,
// Reconciliation-and-Gaps-GoldDisbursalApproval.md, Defect-Candidates-GoldDisbursalApproval.md; and GoldDisbursalApproval/REQUIREMENTS_GoldDisbursalApproval.md
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

const TEST_DATA = 'No data is created: the suite reads the disbursals already in the queue (waiting, approved and reverted loans) and never approves or reverts one. Test-specific values are in the steps.';
const prefix = (c) => c.shortId.replace(/_\d+$/, '');
const priority = (c) => {
  if (['READ_01', 'READ_02', 'BUSINESS_01', 'BUSINESS_03', 'CONSISTENCY_01', 'API_04'].includes(c.shortId)) return 'P0';
  if (['REQUIRED', 'BOUNDARY', 'BUSINESS', 'CONSISTENCY', 'DUPLICATE', 'READ', 'API', 'ERROR', 'ROLE', 'UPDATE', 'DELETE'].includes(prefix(c)) || ['SESSION_01', 'SESSION_03'].includes(c.shortId)) return 'P1';
  if (['A11Y', 'LENGTH'].includes(prefix(c))) return 'P3';
  return 'P2';
};
const jiraPriority = { P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low' };
const screenOf = (c) => (c.shortId.startsWith('READ_0') || /^(BUSINESS|WORKFLOW|CONSISTENCY_01|CONSISTENCY_03)/.test(c.shortId) ? 'Gold Disbursal Approval (loan page)' : 'Gold Disbursal Approval Queue');
const reqsOf = (c) => REQS.filter((q) => q.tests.includes(c.shortId)).map((q) => q.id);
const defectIds = new Map();
cases.filter((c) => c.final === 'FAILED').forEach((c, i) => defectIds.set(c.shortId + c.title, `DC-DISBAPP-${String(i + 1).padStart(3, '0')}`));
const defectOf = (c) => defectIds.get(c.shortId + c.title) || '';
const actual = (c) => {
  if (c.final === 'PASSED') return 'Behaved as expected; all assertions passed.';
  if (c.final === 'FAILED') return oneLine(c.error, 300);
  if (c.final === 'BLOCKED') return 'BLOCKED by the environment (login / page-load timeout): ' + oneLine(c.error, 150);
  return oneLine(c.notes[0], 300) || c.final;
};
const steps = (c) => (c.meta.steps || []);
const script = (c) => (c.file || '').replace(/\\/g, '/');

// ---- QMetry import CSV (one row per step)
const qm = [['Test Case ID', 'Summary', 'Description', 'Precondition', 'Priority', 'Status', 'Labels', 'Component', 'Requirement', 'Automation Script', 'Step Summary', 'Test Data', 'Expected Result']];
for (const c of cases) {
  const st = steps(c).length ? steps(c) : ['See summary'];
  st.forEach((s, i) => {
    const first = i === 0, last = i === st.length - 1;
    qm.push([first ? c.id : '', first ? c.meta.summary : '', first ? `${c.meta.type}. Last execution: ${c.final}.` : '', first ? CFG.pre : '', first ? jiraPriority[priority(c)] : '', first ? 'Approved' : '',
      first ? ['GoldDisbursalApproval', 'Automated', c.meta.type.replace(/[^A-Za-z0-9]+/g, '-')].join(' ') : '', first ? screenOf(c) : '', first ? reqsOf(c).join(' ') : '', first ? script(c) : '', s, first ? TEST_DATA : '', last ? c.meta.expected : '']);
  });
}
fs.writeFileSync(path.join(outDir, 'QMetry-Import-GoldDisbursalApproval.csv'), csv(qm));

// ---- execution results CSV
const ex = [['Test Case ID', 'Requirement ID', 'Module', 'Screen', 'Feature', 'Scenario', 'Test Type', 'Priority', 'Preconditions', 'Test Data', 'Detailed Steps', 'Expected Result', 'Actual Result', 'Execution Status', 'Evidence', 'Defect ID', 'Automation Script Path', 'Execution Timestamp', 'Duration (s)']];
for (const c of cases) ex.push([c.id, reqsOf(c).join(' ') || 'UNMAPPED', 'Gold Disbursal Approval Queue', screenOf(c), c.meta.module, c.meta.summary, c.meta.type, priority(c), CFG.pre, TEST_DATA,
  steps(c).map((s, i) => `${i + 1}. ${s}`).join(' | '), c.meta.expected, actual(c), c.final, rel(c.shotPath), defectOf(c), script(c), c.startTime, (c.duration / 1000).toFixed(1)]);
fs.writeFileSync(path.join(outDir, 'Execution-Results-GoldDisbursalApproval.csv'), csv(ex));

// ---- traceability CSV
const byShort = new Map();
for (const c of cases) (byShort.get(c.shortId) || byShort.set(c.shortId, []).get(c.shortId)).push(c);
const tr = [['Requirement ID', 'Requirement', 'Basis', 'Requirement Status', 'Test Case ID', 'Scenario', 'Automation Script', 'Execution Status', 'Evidence', 'Defect ID']];
for (const q of REQS) {
  const linked = q.tests.flatMap((t) => byShort.get(t) || []);
  if (!linked.length) tr.push([q.id, q.text, q.basis, q.state, '(none)', '', '', 'NO TEST', '', '']);
  for (const c of linked) tr.push([q.id, q.text, q.basis, q.state, c.id, c.meta.summary, script(c), c.final, rel(c.shotPath), defectOf(c)]);
}
for (const c of cases.filter((x) => !reqsOf(x).length)) tr.push(['UNMAPPED', '', '', '', c.id, c.meta.summary, script(c), c.final, rel(c.shotPath), defectOf(c)]);
fs.writeFileSync(path.join(outDir, 'Traceability-GoldDisbursalApproval.csv'), csv(tr));

// ---- coverage by the 37 test categories
const r = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${p}_${String(a + i).padStart(2, '0')}`);
const CATS = [
  ['Positive functional testing', ['READ_01', 'READ_03', 'WORKFLOW_01'], 'The positive action (Approve & Disburse) is NOT executed: it posts an irreversible voucher.'],
  ['Negative functional testing', ['INPUT_01', 'INPUT_04', 'SEARCH_06', 'ERROR_02', 'SESSION_01', 'SESSION_02']],
  ['Required-field validation', ['REQUIRED_01'], 'The only possible required field is the Revert remark - not executed (needs the Revert dialog on a live loan).'],
  ['Empty, null and whitespace input', ['INPUT_02', 'INPUT_03', 'SEARCH_07']],
  ['Minimum and maximum length', ['LENGTH_01', 'LENGTH_02', 'BOUNDARY_01', 'BOUNDARY_02']],
  ['Boundary value analysis', r('BOUNDARY', 1, 3)],
  ['Equivalence partitioning', ['FILTER_01', 'READ_03', 'READ_04', 'BUSINESS_05'], 'One loan per status class (waiting / approved / reverted).'],
  ['Data type and format validation', ['DATE_01', 'READ_01']],
  ['Invalid and special characters', ['INPUT_01', 'INPUT_04']],
  ['Dropdown and autocomplete selection', ['FILTER_01', 'FILTER_02', 'FILTER_03']],
  ['Field dependency testing', ['FILTER_02'], 'Choosing "My submissions" removes the status filter.'],
  ['Conditional field behaviour', ['NAV_03', 'WORKFLOW_01', 'UPDATE_02'], 'Buttons depend on the loan status.'],
  ['Default value verification', ['DEFAULT_01', 'DEFAULT_02']],
  ['Create and Save', ['CREATE_01'], 'Not applicable: nothing is created here.'],
  ['Read and Search', [...r('READ', 1, 6), ...r('SEARCH', 1, 7)]],
  ['Edit and Update', ['UPDATE_01', 'UPDATE_02'], 'There is no edit; the only state changes are Approve and Revert (not executed).'],
  ['Delete, where supported', ['DELETE_01']],
  ['Cancel, Reset and Clear', ['CANCEL_01', 'CANCEL_02', 'CANCEL_03', 'CLEAR_01']],
  ['Duplicate record prevention', ['DUPLICATE_01']],
  ['Business rule validation', [...r('BUSINESS', 1, 5)]],
  ['Calculation and total validation', ['BUSINESS_01', 'READ_02', 'CONSISTENCY_02']],
  ['Date and time validation', r('DATE', 1, 3)],
  ['Cross-field validation', ['BUSINESS_01', 'BUSINESS_03', 'CONSISTENCY_01']],
  ['Error messages and validation placement', ['SEARCH_06', 'FILTER_02'], 'Message text is checked; the on-screen placement is not asserted.'],
  ['Double-click and repeated submission', ['SESSION_05'], 'Double-click on Approve & Disburse is not executed.'],
  ['Session timeout and recovery', ['SESSION_03', 'SESSION_04', 'ERROR_01'], 'A real server-side session expiry is not simulated.'],
  ['Role-based access control', ['ROLE_01', 'SESSION_01', 'SESSION_02']],
  ['Navigation and workflow transition', [...r('NAV', 1, 4), ...r('WORKFLOW', 1, 3)]],
  ['API integration and response validation', r('API', 1, 5)],
  ['Persistence and data consistency', ['READ_05', 'READ_06', ...r('CONSISTENCY', 1, 3)]],
  ['Sorting, filtering and pagination', ['SORT_01', ...r('FILTER', 1, 3), ...r('PAGINATION', 1, 3)]],
  ['File upload and download', ['FILE_01'], 'Not applicable: no export or upload.'],
  ['Concurrent updates', ['SESSION_06']],
  ['Regression testing', [], 'Provided as the full-suite command; not a separate set of test cases.'],
  ['UI usability and accessibility checks', ['A11Y_01', 'A11Y_02', 'A11Y_03', 'A11Y_05']],
  ['Browser compatibility and responsive behaviour', ['A11Y_01', 'A11Y_03', 'A11Y_04'], 'Responsive sizes run in Chromium; Firefox / WebKit are not installed.'],
  ['Recovery after failed or interrupted transactions', ['ERROR_01', 'ERROR_02']],
];

const catRows = CATS.map(([name, ids, note = '']) => {
  const list = ids.flatMap((i) => byShort.get(i) || []);
  const n = (s) => list.filter((c) => c.final === s).length;
  return `| ${name} | ${list.length} | ${n('PASSED')} | ${n('FAILED')} | ${n('BLOCKED')} | ${n('N/A') + n('NOT EXECUTED') + n('SKIPPED')} | ${list.length ? '' : 'GAP: no test. '}${note} |`;
});

const listBy = (s) => cases.filter((c) => c.final === s).map((c) => `- **${c.id}** - ${oneLine(c.notes[0] || c.error, 220)}`).join('\n') || '- none';
const md = `# Gold Disbursal Approval Queue - Coverage reconciliation and gap report

Generated ${data.generatedAt} from the real execution results. Environment: \`${data.environment}\`. Screen: Gold Disbursal Approval Queue (Loans > Gold > Gold Disbursal Approval Queue). READ-ONLY run: nothing was approved, reverted or created.

## Reconciliation

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| ${rec.generated} | ${rec.automated} | ${rec.discovered} | ${rec.executed} | ${rec.passed} | ${rec.failed} | ${rec.blocked} | ${rec.skipped} | ${rec.notExecuted} | ${rec.na} |

- Executed = Passed + Failed (a test that ran to its assertion).
- Passed + Failed + Blocked + Skipped + Not executed + N/A = ${rec.passed + rec.failed + rec.blocked + rec.skipped + rec.notExecuted + rec.na} = Discovered (${rec.discovered}) - ${rec.reconciles ? 'reconciles, no double counting' : '**DOES NOT RECONCILE - investigate**'}.
- Generated = designed cases (steps and expected result written in the metadata) plus any tests found. Designed cases without a script: ${data.designedNoScript.length ? data.designedNoScript.join(', ') : 'none'}.
- "Coverage" is only claimed against this denominator (${rec.generated} generated cases), not as 100% coverage of the application.

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
- Approve & Disburse (UPDATE_01, WORKFLOW_03), Revert (CANCEL_03) and the Revert remark rule (REQUIRED_01) - not executed: they post / change a live loan and a posted voucher cannot be undone from the screen. The existing script (npm run disbursal-approval) approves the flow's own loan.
- The approve / revert APIs called directly (API_05) - could post a real voucher.
- Two approvers on one loan (SESSION_06) - needs two real approvals.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Voucher posting, accounting entries and the customer's bank payment after approval - not verified (no access to the accounting screens in this suite).
- Behaviour while another user approves a loan that is open on the screen - not tested.
- Database verification - no database access was provided; checks used the grid, the loan pages and the list API.
`;
fs.writeFileSync(path.join(outDir, 'Reconciliation-and-Gaps-GoldDisbursalApproval.md'), md);

// ---- defect candidates
const fails = cases.filter((c) => c.final === 'FAILED');
fs.writeFileSync(path.join(outDir, 'Defect-Candidates-GoldDisbursalApproval.md'), `# Gold Disbursal Approval Queue - defect candidates

These tests FAILED on \`${data.environment}\`. They are **candidates**, not confirmed defects: each needs a human to confirm the expected behaviour.

${fails.map((c) => `## ${defectOf(c)} - ${c.meta.summary}
- Test case: ${c.id} (${c.meta.type})
- Requirement: ${reqsOf(c).join(', ') || 'unmapped'}
- Steps to reproduce:
${steps(c).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
- Expected: ${c.meta.expected}
- Actual: ${oneLine(c.error, 350)}
- Evidence: ${rel(c.shotPath) || 'none'}
`).join('\n') || 'No failed tests.'}
`);

// ---- requirements document
fs.writeFileSync(path.join(__dirname, 'REQUIREMENTS_GoldDisbursalApproval.md'), `# Gold Disbursal Approval Queue - requirements and business-rule inventory

Environment tested: \`${data.environment}\`. Source: behaviour observed in the running application (screen text, help text, API calls); **no business document was supplied**.

- **Observed** = seen in the application. **Hypothesis** = inferred, not confirmed by documentation; the linked tests check it and the status shows what they found.
- **Status** is computed from the test results: VERIFIED (all linked tests passed), DEFECT CANDIDATE (a linked test failed), NOT FULLY VERIFIED (a linked test was blocked), PARTLY VERIFIED / NOT VERIFIED (linked tests skipped or not executed).

| ID | Screen | Area | Requirement / business rule | Basis | Tests | Status |
|---|---|---|---|---|---|---|
${REQS.map((q) => `| ${q.id} | ${q.screen} | ${q.area} | ${q.text.replace(/\|/g, '/')} | ${q.basis === 'OBSERVED' ? 'Observed' : 'Hypothesis'} | ${q.tests.join(', ')} | ${(data.requirements.find((x) => x.id === q.id) || {}).state || ''} |`).join('\n')}
`);

console.log(`Exported: ${cases.length} test cases, ${REQS.length} requirements, ${fails.length} defect candidates -> ${rel(outDir)}`);
