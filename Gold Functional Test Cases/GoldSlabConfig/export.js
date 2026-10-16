// Builds the Gold Slab Config deliverables from the REAL execution results (GoldSlabConfig/reports/execution-results.json,
// written by utils/qmetry-report.js when QMETRY_CASES_OUT is set). Nothing here is invented: every status comes from the results file.
//   node GoldSlabConfig/export.js
// Outputs (GoldSlabConfig/reports/): QMetry-Import-GoldSlabConfig.csv, Execution-Results-GoldSlabConfig.csv, Traceability-GoldSlabConfig.csv,
// Reconciliation-and-Gaps-GoldSlabConfig.md, Defect-Candidates-GoldSlabConfig.md; and GoldSlabConfig/REQUIREMENTS_GoldSlabConfig.md
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

const TEST_DATA = 'Synthetic sandbox slabs ABOVE 10 crore only (for example 10,00,00,001 - 10,10,00,000, Internal 2, External 1); the 5 real slabs are only read. Test-specific values are in the steps.';
const prefix = (c) => c.shortId.replace(/_\d+$/, '');
const priority = (c) => {
  if (['CREATE_01', 'DELETE_02', 'BOUNDARY_03', 'BOUNDARY_04', 'CONSISTENCY_03'].includes(c.shortId)) return 'P0';
  if (['REQUIRED', 'BOUNDARY', 'BUSINESS', 'CONSISTENCY', 'DUPLICATE', 'READ', 'API', 'ERROR', 'ROLE', 'UPDATE', 'DELETE'].includes(prefix(c)) || ['SESSION_01', 'SESSION_03'].includes(c.shortId)) return 'P1';
  if (['A11Y', 'LENGTH'].includes(prefix(c))) return 'P3';
  return 'P2';
};
const jiraPriority = { P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low' };
const screenOf = (c) => (c.shortId === 'CONSISTENCY_03' ? 'Estimate Slab Configuration + Estimate Summary' : 'Estimate Slab Configuration');
const reqsOf = (c) => REQS.filter((q) => q.tests.includes(c.shortId)).map((q) => q.id);
const defectIds = new Map();
cases.filter((c) => c.final === 'FAILED').forEach((c, i) => defectIds.set(c.shortId + c.title, `DC-SLAB-${String(i + 1).padStart(3, '0')}`));
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
      first ? ['GoldSlabConfig', 'Automated', c.meta.type.replace(/[^A-Za-z0-9]+/g, '-')].join(' ') : '', first ? screenOf(c) : '', first ? reqsOf(c).join(' ') : '', first ? script(c) : '', s, first ? TEST_DATA : '', last ? c.meta.expected : '']);
  });
}
fs.writeFileSync(path.join(outDir, 'QMetry-Import-GoldSlabConfig.csv'), csv(qm));

// ---- execution results CSV
const ex = [['Test Case ID', 'Requirement ID', 'Module', 'Screen', 'Feature', 'Scenario', 'Test Type', 'Priority', 'Preconditions', 'Test Data', 'Detailed Steps', 'Expected Result', 'Actual Result', 'Execution Status', 'Evidence', 'Defect ID', 'Automation Script Path', 'Execution Timestamp', 'Duration (s)']];
for (const c of cases) ex.push([c.id, reqsOf(c).join(' ') || 'UNMAPPED', 'Gold Slab Config', screenOf(c), c.meta.module, c.meta.summary, c.meta.type, priority(c), CFG.pre, TEST_DATA,
  steps(c).map((s, i) => `${i + 1}. ${s}`).join(' | '), c.meta.expected, actual(c), c.final, rel(c.shotPath), defectOf(c), script(c), c.startTime, (c.duration / 1000).toFixed(1)]);
fs.writeFileSync(path.join(outDir, 'Execution-Results-GoldSlabConfig.csv'), csv(ex));

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
fs.writeFileSync(path.join(outDir, 'Traceability-GoldSlabConfig.csv'), csv(tr));

// ---- coverage by the 37 test categories
const r = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${p}_${String(a + i).padStart(2, '0')}`);
const CATS = [
  ['Positive functional testing', ['CREATE_01', 'BOUNDARY_02', 'BOUNDARY_06']],
  ['Negative functional testing', [...r('REQUIRED', 1, 2), ...r('BOUNDARY', 1, 5), ...r('DUPLICATE', 1, 2)]],
  ['Required-field validation', r('REQUIRED', 1, 2)],
  ['Empty, null and whitespace input', ['REQUIRED_01', 'REQUIRED_02', 'INPUT_03']],
  ['Minimum and maximum length', ['LENGTH_01', 'LENGTH_02']],
  ['Boundary value analysis', r('BOUNDARY', 1, 6)],
  ['Equivalence partitioning', ['BOUNDARY_02', 'BOUNDARY_03', 'BOUNDARY_04', 'BOUNDARY_05', 'BOUNDARY_06'], 'Valid / overlapping / gap / open-ended classes of slab ranges.'],
  ['Data type and format validation', ['INPUT_01', 'INPUT_02', 'INPUT_05']],
  ['Invalid and special characters', ['INPUT_01', 'INPUT_04', 'INPUT_05']],
  ['Dropdown and autocomplete selection', ['BUSINESS_01', 'BUSINESS_02', 'BUSINESS_03']],
  ['Field dependency testing', ['BUSINESS_01', 'BUSINESS_03']],
  ['Conditional field behaviour', ['BUSINESS_01', 'BUSINESS_03', 'DEFAULT_01']],
  ['Default value verification', ['DEFAULT_01']],
  ['Create and Save', ['CREATE_01', 'API_02']],
  ['Read and Search', [...r('READ', 1, 4), 'SEARCH_01']],
  ['Edit and Update', ['UPDATE_01', 'UPDATE_02', 'CANCEL_02', 'CONSISTENCY_02']],
  ['Delete, where supported', ['CANCEL_03', 'DELETE_01', 'DELETE_02']],
  ['Cancel, Reset and Clear', ['CANCEL_01', 'CANCEL_02', 'CANCEL_03', 'CLEAR_01']],
  ['Duplicate record prevention', ['DUPLICATE_01', 'DUPLICATE_02']],
  ['Business rule validation', [...r('BUSINESS', 1, 3), 'READ_03', 'READ_04', 'BOUNDARY_05', 'CONSISTENCY_03']],
  ['Calculation and total validation', ['CONSISTENCY_03'], 'There are no calculations on this screen; the only derived value is the stages an estimate needs (CONSISTENCY_03).'],
  ['Date and time validation', ['DATE_01']],
  ['Cross-field validation', ['BOUNDARY_01', 'BUSINESS_01', 'BUSINESS_03', 'READ_01']],
  ['Error messages and validation placement', ['REQUIRED_01', 'BOUNDARY_01'], 'Message text is checked; the on-screen PLACEMENT of messages is not asserted.'],
  ['Double-click and repeated submission', ['ERROR_01', 'SESSION_04']],
  ['Session timeout and recovery', ['SESSION_02', 'SESSION_03', 'ERROR_02']],
  ['Role-based access control', ['ROLE_01', 'SESSION_01']],
  ['Navigation and workflow transition', ['NAV_01', 'NAV_02', 'WORKFLOW_01']],
  ['API integration and response validation', r('API', 1, 5)],
  ['Persistence and data consistency', ['READ_02', ...r('CONSISTENCY', 1, 3)]],
  ['Sorting, filtering and pagination', ['SORT_01', 'FILTER_01', 'PAGINATION_01']],
  ['File upload and download', ['FILE_01']],
  ['Concurrent updates', ['SESSION_05']],
  ['Regression testing', [], 'Provided as the full-suite command; not a separate set of test cases.'],
  ['UI usability and accessibility checks', ['A11Y_01', 'A11Y_02', 'A11Y_03']],
  ['Browser compatibility and responsive behaviour', ['A11Y_01', 'A11Y_03', 'A11Y_04'], 'Responsive sizes run in Chromium; Firefox / WebKit are not installed.'],
  ['Recovery after failed or interrupted transactions', ['ERROR_01', 'ERROR_02']],
];
const catRows = CATS.map(([name, ids, note = '']) => {
  const list = ids.flatMap((i) => byShort.get(i) || []);
  const n = (s) => list.filter((c) => c.final === s).length;
  return `| ${name} | ${list.length} | ${n('PASSED')} | ${n('FAILED')} | ${n('BLOCKED')} | ${n('N/A') + n('NOT EXECUTED') + n('SKIPPED')} | ${list.length ? '' : 'GAP: no test. '}${note} |`;
});

const listBy = (s) => cases.filter((c) => c.final === s).map((c) => `- **${c.id}** - ${oneLine(c.notes[0] || c.error, 220)}`).join('\n') || '- none';
const md = `# Gold Slab Config - Coverage reconciliation and gap report

Generated ${data.generatedAt} from the real execution results. Environment: \`${data.environment}\`. Screen: Gold Estimate Slab Configuration (Loans > Gold > Gold Loan Configuration > Estimate Approval Slabs).

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
- Server-side validation by direct API calls (API_05) - needs the login token; invalid slabs were exercised through the screen instead.
- Two users changing slabs at the same time (SESSION_05) - too risky on the live approval configuration.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Overlap, duplicate and gap checks on the 5 REAL slabs - deliberately not run: a slab accepted by mistake there would change who must approve every estimate. They were run in the sandbox range above 10 crore only.
- Whether the server ignores a changed \`createdby\` user id in the save URL - not tested (would need a tampered request).
- Database verification - no database access was provided; persistence was checked through the list, a fresh login and the list API.
`;
fs.writeFileSync(path.join(outDir, 'Reconciliation-and-Gaps-GoldSlabConfig.md'), md);

// ---- defect candidates
const fails = cases.filter((c) => c.final === 'FAILED');
fs.writeFileSync(path.join(outDir, 'Defect-Candidates-GoldSlabConfig.md'), `# Gold Slab Config - defect candidates

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
fs.writeFileSync(path.join(__dirname, 'REQUIREMENTS_GoldSlabConfig.md'), `# Gold Slab Config - requirements and business-rule inventory

Environment tested: \`${data.environment}\`. Source: behaviour observed in the running application (screen text, help text, API calls); **no business document was supplied**.

- **Observed** = seen in the application. **Hypothesis** = inferred, not confirmed by documentation; the linked tests check it and the status shows what they found.
- **Status** is computed from the test results: VERIFIED (all linked tests passed), DEFECT CANDIDATE (a linked test failed), NOT FULLY VERIFIED (a linked test was blocked), PARTLY VERIFIED / NOT VERIFIED (linked tests skipped or not executed).

| ID | Screen | Area | Requirement / business rule | Basis | Tests | Status |
|---|---|---|---|---|---|---|
${REQS.map((q) => `| ${q.id} | ${q.screen} | ${q.area} | ${q.text.replace(/\|/g, '/')} | ${q.basis === 'OBSERVED' ? 'Observed' : 'Hypothesis'} | ${q.tests.join(', ')} | ${(data.requirements.find((x) => x.id === q.id) || {}).state || ''} |`).join('\n')}
`);

console.log(`Exported: ${cases.length} test cases, ${REQS.length} requirements, ${fails.length} defect candidates -> ${rel(outDir)}`);
