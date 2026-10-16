// Builds the Vault deliverables from the REAL execution results (GoldVault/reports/execution-results.json,
// written by utils/qmetry-report.js when QMETRY_CASES_OUT is set). Nothing here is invented: every status comes from the results file.
//   node GoldVault/export.js
// Outputs (GoldVault/reports/): QMetry-Import-GoldVault.csv, Execution-Results-GoldVault.csv, Traceability-GoldVault.csv,
// Reconciliation-and-Gaps-GoldVault.md, Defect-Candidates-GoldVault.md; and GoldVault/REQUIREMENTS_GoldVault.md
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

const TEST_DATA = 'Synthetic vault AUTOTEST FT Vault nnnnn / HEAD OFFICE / ATFTnnnnn (one is created per run; vaults cannot be deleted); the existing vaults are only read. Test-specific values are in the steps.';
const prefix = (c) => c.shortId.replace(/_\d+$/, '');
const priority = (c) => {
  if (['CREATE_01', 'DUPLICATE_01', 'CONSISTENCY_03', 'READ_03'].includes(c.shortId)) return 'P0';
  if (['REQUIRED', 'BOUNDARY', 'BUSINESS', 'CONSISTENCY', 'DUPLICATE', 'READ', 'API', 'ERROR', 'ROLE', 'UPDATE', 'DELETE'].includes(prefix(c)) || ['SESSION_01', 'SESSION_03'].includes(c.shortId)) return 'P1';
  if (['A11Y', 'LENGTH'].includes(prefix(c))) return 'P3';
  return 'P2';
};
const jiraPriority = { P0: 'Highest', P1: 'High', P2: 'Medium', P3: 'Low' };
const screenOf = (c) => (c.shortId === 'CONSISTENCY_03' ? 'Vault + Safe & Lockers' : 'Vault');
const reqsOf = (c) => REQS.filter((q) => q.tests.includes(c.shortId)).map((q) => q.id);
const defectIds = new Map();
cases.filter((c) => c.final === 'FAILED').forEach((c, i) => defectIds.set(c.shortId + c.title, `DC-VAULT-${String(i + 1).padStart(3, '0')}`));
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
      first ? ['GoldVault', 'Automated', c.meta.type.replace(/[^A-Za-z0-9]+/g, '-')].join(' ') : '', first ? screenOf(c) : '', first ? reqsOf(c).join(' ') : '', first ? script(c) : '', s, first ? TEST_DATA : '', last ? c.meta.expected : '']);
  });
}
fs.writeFileSync(path.join(outDir, 'QMetry-Import-GoldVault.csv'), csv(qm));

// ---- execution results CSV
const ex = [['Test Case ID', 'Requirement ID', 'Module', 'Screen', 'Feature', 'Scenario', 'Test Type', 'Priority', 'Preconditions', 'Test Data', 'Detailed Steps', 'Expected Result', 'Actual Result', 'Execution Status', 'Evidence', 'Defect ID', 'Automation Script Path', 'Execution Timestamp', 'Duration (s)']];
for (const c of cases) ex.push([c.id, reqsOf(c).join(' ') || 'UNMAPPED', 'Vault', screenOf(c), c.meta.module, c.meta.summary, c.meta.type, priority(c), CFG.pre, TEST_DATA,
  steps(c).map((s, i) => `${i + 1}. ${s}`).join(' | '), c.meta.expected, actual(c), c.final, rel(c.shotPath), defectOf(c), script(c), c.startTime, (c.duration / 1000).toFixed(1)]);
fs.writeFileSync(path.join(outDir, 'Execution-Results-GoldVault.csv'), csv(ex));

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
fs.writeFileSync(path.join(outDir, 'Traceability-GoldVault.csv'), csv(tr));

// ---- coverage by the 37 test categories
const r = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${p}_${String(a + i).padStart(2, '0')}`);
const CATS = [
  ['Positive functional testing', ['CREATE_01', 'UPDATE_01', 'UPDATE_02', 'UPDATE_03']],
  ['Negative functional testing', [...r('REQUIRED', 1, 4), 'DUPLICATE_01', 'DUPLICATE_02', 'INPUT_01']],
  ['Required-field validation', r('REQUIRED', 1, 4)],
  ['Empty, null and whitespace input', ['REQUIRED_01', 'INPUT_01', 'INPUT_05']],
  ['Minimum and maximum length', ['LENGTH_01', 'BOUNDARY_01', 'BOUNDARY_02', 'BOUNDARY_03', 'BOUNDARY_04']],
  ['Boundary value analysis', r('BOUNDARY', 1, 5)],
  ['Equivalence partitioning', ['BOUNDARY_01', 'BOUNDARY_03', 'BOUNDARY_05']],
  ['Data type and format validation', ['INPUT_02', 'INPUT_04']],
  ['Invalid and special characters', ['INPUT_02', 'INPUT_03', 'INPUT_04', 'SEARCH_05']],
  ['Dropdown and autocomplete selection', ['CONSISTENCY_03'], 'Vault Branch is a free-text box (no dropdown); the only dropdown touched is the Vault list of Safe & Lockers.'],
  ['Field dependency testing', ['CONSISTENCY_03']],
  ['Conditional field behaviour', ['DEFAULT_01', 'CLEAR_01']],
  ['Default value verification', ['DEFAULT_01']],
  ['Create and Save', ['CREATE_01', 'API_02']],
  ['Read and Search', [...r('READ', 1, 4), ...r('SEARCH', 1, 6)]],
  ['Edit and Update', ['UPDATE_01', 'UPDATE_02', 'UPDATE_03', 'CONSISTENCY_02', 'BUSINESS_02']],
  ['Delete, where supported', ['DELETE_01']],
  ['Cancel, Reset and Clear', ['CANCEL_01', 'CANCEL_02', 'CLEAR_01', 'CLEAR_02']],
  ['Duplicate record prevention', ['DUPLICATE_01', 'DUPLICATE_02', 'READ_03']],
  ['Business rule validation', ['BUSINESS_01', 'BUSINESS_02', 'DUPLICATE_01', 'DUPLICATE_02']],
  ['Calculation and total validation', ['READ_03', 'PAGINATION_01'], 'There are no calculations; the only totals are the pager counts.'],
  ['Date and time validation', ['DATE_01']],
  ['Cross-field validation', ['DUPLICATE_01', 'DUPLICATE_02'], 'No rule links the three fields to each other.'],
  ['Error messages and validation placement', ['REQUIRED_01', 'REQUIRED_02', 'REQUIRED_03', 'REQUIRED_04', 'SEARCH_04'], 'Message text is checked; the exact on-screen PLACEMENT is not asserted.'],
  ['Double-click and repeated submission', ['SESSION_04', 'SESSION_05']],
  ['Session timeout and recovery', ['SESSION_02', 'SESSION_03', 'ERROR_02'], 'A real server-side session expiry / inactivity timeout is not simulated; browser storage is cleared instead.'],
  ['Role-based access control', ['ROLE_01', 'SESSION_01']],
  ['Navigation and workflow transition', ['NAV_01', 'NAV_02', 'WORKFLOW_01']],
  ['API integration and response validation', r('API', 1, 5)],
  ['Persistence and data consistency', ['READ_02', 'READ_04', ...r('CONSISTENCY', 1, 3)]],
  ['Sorting, filtering and pagination', [...r('SORT', 1, 3), 'FILTER_01', 'PAGINATION_01', 'PAGINATION_02']],
  ['File upload and download', r('FILE', 1, 3), 'Upload is not applicable (export only).'],
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
const md = `# Vault - Coverage reconciliation and gap report

Generated ${data.generatedAt} from the real execution results. Environment: \`${data.environment}\`. Screen: Vault (Loans > Gold > Gold Loan Configuration > Vault).

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
- A Vault Branch that is not a real branch (BUSINESS_01) - not executed: Vault Branch is free text and a saved vault cannot be deleted.
- Server-side validation by direct API calls (API_05) - needs the login token and could create undeletable vaults.
- Two users saving the same code at once (SESSION_06) - needs two real saves of one code.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Whether the server ignores a changed createdby user id in the save URL - not tested.
- Whether Safe & Lockers keeps working when a vault code is changed after safes exist - not tested.
- Database verification - no database access was provided; persistence was checked through the grid, a fresh login, the exports and the list API.
`;
fs.writeFileSync(path.join(outDir, 'Reconciliation-and-Gaps-GoldVault.md'), md);

// ---- defect candidates
const fails = cases.filter((c) => c.final === 'FAILED');
fs.writeFileSync(path.join(outDir, 'Defect-Candidates-GoldVault.md'), `# Vault - defect candidates

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
fs.writeFileSync(path.join(__dirname, 'REQUIREMENTS_GoldVault.md'), `# Vault - requirements and business-rule inventory

Environment tested: \`${data.environment}\`. Source: behaviour observed in the running application (screen text, help text, API calls); **no business document was supplied**.

- **Observed** = seen in the application. **Hypothesis** = inferred, not confirmed by documentation; the linked tests check it and the status shows what they found.
- **Status** is computed from the test results: VERIFIED (all linked tests passed), DEFECT CANDIDATE (a linked test failed), NOT FULLY VERIFIED (a linked test was blocked), PARTLY VERIFIED / NOT VERIFIED (linked tests skipped or not executed).

| ID | Screen | Area | Requirement / business rule | Basis | Tests | Status |
|---|---|---|---|---|---|---|
${REQS.map((q) => `| ${q.id} | ${q.screen} | ${q.area} | ${q.text.replace(/\|/g, '/')} | ${q.basis === 'OBSERVED' ? 'Observed' : 'Hypothesis'} | ${q.tests.join(', ')} | ${(data.requirements.find((x) => x.id === q.id) || {}).state || ''} |`).join('\n')}
`);

console.log(`Exported: ${cases.length} test cases, ${REQS.length} requirements, ${fails.length} defect candidates -> ${rel(outDir)}`);
