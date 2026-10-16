// Test case inventory for Gold Estimate Approval Queue (single source for the reports).
const M = 'Gold Estimate Approval Queue';
const S = 'Approval Queue';
const BH = 'Branch Head (CHECKER_BH) logged in; queue open (real data, read-only)';
const IA2 = 'INT_APPRAISER2 logged in; SIMULATED estimate GE9999999901 "Awaiting Internal Appraiser 2 verification" served to the screen';
const CHK = 'CHECKER_BH logged in; SIMULATED estimate GE9999999902 "Ready for Approval" served to the screen';
const NOWRITE = ' (Approve/Revert blocked or answered by a simulated response)';

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const Q = 'tests/functional/queue.spec.js';
const I = 'tests/business-rules/ia2-verification.spec.js';
const C = 'tests/business-rules/checker-approval.spec.js';
const A = 'tests/api/queue-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const P = 'tests/positive/real-chain.spec.js';

module.exports = [
  f('TC_EQ_001', 'REQ-01', 'Queue', 'Columns', 'Positive / UI', 'P0', BH, '-', ['Open the queue'], 'GE NUMBER … ACTION (11 columns)', Q, '@smoke'),
  f('TC_EQ_002', 'REQ-02', 'Status filter', '7 workflow statuses', 'Dropdown', 'P2', BH, '-', ['Open status filter'], 'Awaiting Internal Appraiser … Approved', Q),
  f('TC_EQ_003', 'REQ-02', 'Status filter', 'Filter Approved', 'Filtering', 'P2', BH, 'Approved', ['Select Approved'], 'Only Approved rows', Q),
  f('TC_EQ_004', 'REQ-02', 'Queue', 'Total = queue API', 'Data consistency', 'P1', BH, 'GetGoldEstimateQueue', ['Compare pager with API'], 'Equal', Q),
  f('TC_EQ_005', 'REQ-03', 'Search', 'By GE number', 'Search', 'P2', BH, 'First GE', ['Type GE'], 'Only that GE', Q),
  f('TC_EQ_006', 'REQ-03', 'Search', 'By customer / mobile', 'Search', 'P2', BH, 'First row customer and mobile', ['Type each'], 'Only that customer\'s rows', Q),
  f('TC_EQ_007', 'REQ-03', 'Search', 'No match', 'Search / Negative', 'P3', BH, '"zzzz-no-such-ge"', ['Type'], 'No rows', Q),
  f('TC_EQ_008', 'REQ-04', 'Pledge token', 'Approved ↔ token', 'Business rule / Consistency', 'P1', BH, '-', ['Read rows and API'], 'Approved rows (and only those) have UID token', Q),
  f('TC_EQ_009', 'REQ-05', 'Role', 'Branch Head role and View action', 'Role-based UI', 'P2', BH, '-', ['Read rows'], '"Branch Head" + View on rows not waiting for them', Q),
  f('TC_EQ_010', 'REQ-02', 'Aging', 'Aging format', 'UI', 'P3', BH, '-', ['Read aging'], '<1h / Nh / Nd', Q),
  f('TC_EQ_011', 'REQ-06', 'Data', 'Completed ≤ required; approved have final value', 'Data consistency', 'P1', BH, 'Queue API', ['Check every estimate'], 'No inconsistent estimate', Q),
  f('TC_EQ_012', 'REQ-07', 'Detail', 'View content', 'Read', 'P0', BH, 'An Approved GE', ['View'], 'Header fields, entries, status history; no Approve', Q, '@smoke'),
  f('TC_EQ_013', 'REQ-07', 'Detail', 'Eligible = value × LTV; = API final value', 'Calculation / Consistency', 'P1', BH, 'Approved GE', ['View', 'Read fields'], 'Eligible ≈ value × LTV; equals pFinalapprovedvalue', Q),
  f('TC_EQ_014', 'REQ-07', 'Detail', 'Status history order', 'Audit trail', 'P2', BH, 'Approved GE', ['View'], 'SUBMIT first, time order, APPROVE last', Q),
  f('TC_EQ_015', 'REQ-07', 'Detail', 'Back', 'Navigation', 'P3', BH, '-', ['View', 'Back'], 'Queue shown', Q),
  f('TC_EQ_016', 'REQ-05', 'Inbox', 'IA2 inbox', 'Role-based access', 'P1', 'INT_APPRAISER2', '-', ['Open queue'], 'Only estimates awaiting IA2 (= inbox API)', Q),
  f('TC_EQ_017', 'REQ-05', 'Inbox', 'External Appraiser 1 inbox', 'Role-based access', 'P1', 'EXT_APPRAISER1', '-', ['Open queue'], 'Only estimates awaiting External 1', Q),
  f('TC_EQ_018', 'REQ-05', 'Inbox', 'Maker inbox', 'Role-based access', 'P2', 'INT_APPRAISER1', '-', ['Open queue'], 'Only own entries pending / sent back', Q),
  f('TC_EQ_019', 'REQ-05', 'Status filter', 'Not labelled "as Branch Head" for others (HYPOTHESIS)', 'UI text', 'P3', 'INT_APPRAISER2', '-', ['Read first option'], 'No "as Branch Head"', Q),
  f('TC_EQ_020', 'REQ-08', 'IA2', 'Verify action', 'Role-based UI', 'P0', IA2, 'GE9999999901', ['Open queue'], 'Role Internal Appraiser 2, status awaiting IA2, Verify', I, '@smoke'),
  f('TC_EQ_021', 'REQ-08', 'IA2', 'Verify page content', 'Read', 'P1', IA2, '-', ['Verify'], 'Maker entry weights, rate, eligible, articles', I),
  f('TC_EQ_022', 'REQ-08', 'IA2 Revert', 'Remarks prompt', 'Functional', 'P1', IA2 + NOWRITE, '-', ['Revert'], 'Required remarks, Confirm Revert, Cancel', I),
  f('TC_EQ_023', 'REQ-08', 'IA2 Revert', 'Empty remarks', 'Required field', 'P0', IA2 + NOWRITE, '""', ['Revert', 'Confirm'], '"A remark is required to revert this entry."; no request', I),
  f('TC_EQ_024', 'REQ-08', 'IA2 Revert', 'Whitespace remarks', 'Whitespace input', 'P1', IA2 + NOWRITE, '"    "', ['Revert', 'Confirm'], 'Same warning; no request', I),
  f('TC_EQ_025', 'REQ-08', 'IA2 Revert', 'Cancel', 'Cancel', 'P2', IA2 + NOWRITE, '-', ['Revert', 'Cancel'], 'Prompt closes; no request', I),
  f('TC_EQ_026', 'REQ-08', 'IA2 Revert', 'Revert payload + message', 'Workflow / API payload', 'P0', IA2 + NOWRITE, 'Remarks text', ['Revert', 'Confirm'], '{GE, IA2 id, REVERT, remarks}; "Sent back to the Internal Appraiser to edit."', I),
  f('TC_EQ_027', 'REQ-08', 'IA2 Approve', 'Approve payload + message', 'Workflow / API payload', 'P0', IA2 + NOWRITE, '-', ['Approve'], '{GE, IA2 id, APPROVE}; "Entry verified. Routed to the next stage."', I, '@smoke'),
  f('TC_EQ_028', 'REQ-08', 'IA2 Approve', 'Confirmation before approving (HYPOTHESIS)', 'Usability / Safety', 'P2', IA2 + NOWRITE, '-', ['Approve once'], 'A confirmation is asked first', I),
  f('TC_EQ_029', 'REQ-10', 'IA2 Approve', 'Server refusal shown', 'Error handling', 'P1', IA2 + NOWRITE, 'Simulated 400', ['Approve'], 'Server message shown; no success', I),
  f('TC_EQ_030', 'REQ-10', 'IA2 Approve', 'Double-click', 'Double submit', 'P1', IA2 + NOWRITE, '-', ['Double-click Approve'], 'One request', I),
  f('TC_EQ_031', 'REQ-05', 'Segregation of duties', 'Maker cannot verify own entry', 'Role-based access', 'P0', 'INT_APPRAISER1; simulated own pending estimate', '-', ['Open queue'], 'No Verify action for the maker', I),
  f('TC_EQ_032', 'REQ-09', 'Checker', 'Review action', 'Role-based UI', 'P0', CHK, 'GE9999999902', ['Open queue'], 'Branch Head, Ready for Approval, Review', C, '@smoke'),
  f('TC_EQ_033', 'REQ-09', 'Checker', 'Review content', 'Read', 'P1', CHK, '2 entries', ['Review'], 'Stages 2/2; both entries; Approve enabled, Revert', C),
  f('TC_EQ_034', 'REQ-09', 'Checker Approve', 'Entry list, none pre-selected', 'Functional', 'P1', CHK + NOWRITE, '2 entries', ['Approve'], '2 entries with value / eligible; none selected', C),
  f('TC_EQ_035', 'REQ-09', 'Checker Approve', 'Single entry pre-selected', 'Default value', 'P2', CHK + NOWRITE, '1 entry', ['Approve'], 'Radio pre-checked', C),
  f('TC_EQ_036', 'REQ-09', 'Checker Approve', 'Confirm without choice', 'Required selection', 'P0', CHK + NOWRITE, '2 entries', ['Approve', 'Confirm'], '"Select which entry to approve as the final value."; no request', C),
  f('TC_EQ_037', 'REQ-09', 'Checker Approve', 'Approve payload + message', 'Workflow / API payload', 'P0', CHK + NOWRITE, 'Entry 2 chosen', ['Approve', 'Pick', 'Confirm'], '{GE, entry id, checker id}; "Gold Estimate approved."', C, '@smoke'),
  f('TC_EQ_038', 'REQ-10', 'Checker Approve', 'Failure reported', 'Error handling', 'P1', CHK + NOWRITE, 'Simulated 500', ['Approve', 'Confirm'], 'Error shown; no success', C),
  f('TC_EQ_039', 'REQ-10', 'Checker Approve', 'Double-click Confirm', 'Double submit', 'P1', CHK + NOWRITE, '-', ['Double-click Confirm Approve'], 'One request', C),
  f('TC_EQ_040', 'REQ-09', 'Checker Revert', 'Warning + remarks required', 'Required field', 'P0', CHK + NOWRITE, '""', ['Revert', 'Confirm'], 'Voids-every-entry note; "A remark is required to revert this Gold Estimate."; no request', C),
  f('TC_EQ_041', 'REQ-09', 'Checker Revert', 'Revert payload + message', 'Workflow / API payload', 'P0', CHK + NOWRITE, 'Remarks text', ['Revert', 'Confirm'], '{GE, remarks, checker id}; "Gold Estimate reverted …"', C),
  f('TC_EQ_042', 'REQ-05', 'Segregation of duties', 'Branch Head cannot approve own estimate', 'Role-based access', 'P0', 'CHECKER_BH; simulated estimate made by the same user', '-', ['Open'], 'No Approve / Revert', C),
  f('TC_EQ_043', 'REQ-09', 'Checker', 'No Approve on Approved estimate', 'Workflow state', 'P1', BH, 'Approved GE', ['View'], 'No Approve button', C),
  f('TC_EQ_044', 'REQ-11', 'API security', 'Queue API without token', 'API / Authorization', 'P1', BH, '-', ['Replay without token'], '401 / 403', A),
  f('TC_EQ_045', 'REQ-11', 'API security', 'IA2 token reads Branch Head queue', 'API / Authorization', 'P0', 'BH + IA2', '-', ['Replay with IA2 token'], '401 / 403', A),
  f('TC_EQ_046', 'REQ-11', 'API security', 'ApproveGoldEstimate by non-BH', 'API / Authorization', 'P0', 'IA2', 'GE0000000000', ['POST'], 'Refused', A),
  f('TC_EQ_047', 'REQ-11', 'API', 'ApproveInternalAppraisal unknown GE', 'API / Negative', 'P2', 'IA2', 'GE0000000000', ['POST'], 'Refused', A),
  f('TC_EQ_048', 'REQ-11', 'API', 'RevertGoldEstimate without remarks', 'Server-side validation', 'P1', 'BH', 'GE0000000000, remarks ""', ['POST'], 'Refused', A),
  f('TC_EQ_049', 'REQ-12', 'Responsive', '768px', 'Responsive', 'P3', BH, '-', ['Resize'], 'No page-level horizontal scroll', U),
  f('TC_EQ_050', 'REQ-12', 'Accessibility', 'Search and filter labels', 'Accessibility', 'P3', BH, '-', ['Check labels'], 'Both labelled', U),
  f('TC_EQ_051', 'REQ-09', 'Real chain', 'Maker → IA2 → BH → token (ALLOW_DATA_CREATION=1)', 'Positive / End-to-end workflow', 'P0', 'All three accounts; ALLOW_DATA_CREATION=1', 'RING 10.5 g, GL-quick', ['Save estimate', 'IA2 Approve', 'BH Approve'], 'Approved, pledge token UID…', P),

  { ...f('TC_EQ_052', 'REQ-08', 'External Appraiser', 'External Appraiser 1 / 2 appraisal (> ₹10 lakh)', 'Workflow', 'P1', 'Estimate > ₹10 lakh pending External 1', '-', ['Appraise', 'Save'], 'Routed to next stage', null), status: 'NOT EXECUTED', reason: 'Appraise uses the Gold Estimates entry form (covered there); a real run needs a > ₹10 lakh estimate – Gold Flow Entry estimate-external covers it' },
  { ...f('TC_EQ_053', 'REQ-09', 'ED/MD', 'ED/MD sign-off before approval', 'Workflow', 'P2', 'Estimate with ED/MD-restricted article', '-', ['Approve ED/MD'], 'Approve enabled after ED/MD', null), status: 'NOT EXECUTED', reason: 'No estimate needing ED/MD exists; needs article-limit configuration' },
  { ...f('TC_EQ_054', 'REQ-09', 'Print', 'Pledge token print tab after approval', 'File / Print', 'P2', 'Real approval', '-', ['Approve'], 'Preview tab with token', null), status: 'NOT EXECUTED', reason: 'Opens only after a real approval (TC_EQ_051 opt-in)' },
  { ...f('TC_EQ_055', 'REQ-12', 'Session / browser / concurrency', 'Two checkers approve the same GE; session timeout; Firefox/WebKit', 'Concurrency / Session / Browser', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'One checker account; idle time unknown; Chromium only' },
  { ...f('TC_EQ_NA1', '-', 'Create / edit / delete', 'CRUD on the queue', 'CRUD', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'Queue only approves or reverts – estimates are created on Gold Estimates' },
  { ...f('TC_EQ_NA2', '-', 'Database', 'DB verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access; API and status history checked' },
];
