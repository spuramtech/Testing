// Test case inventory for Gold Scheme Matrix (single source for the reports).
const M = 'Gold Scheme Matrix';
const S = 'Scheme Matrix';
const ADM = 'Admin (CHECKER_BH) logged in; Gold Loan Configuration → Gold Scheme Matrix open';
const NEW = `${ADM}; New Scheme clicked`;
const BLK = `${NEW}; save calls blocked (nothing reaches the server)`;
const SIM = `${NEW}; save answered by a SIMULATED server response`;
const REAL = `${ADM}; creates a real INACTIVE "AUTOTEST FT" scheme (code AT-T…) that is deleted after the test`;

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const G = 'tests/functional/grid.spec.js';
const NF = 'tests/functional/new-form.spec.js';
const V = 'tests/validation/fields.spec.js';
const B = 'tests/business-rules/slab-rules.spec.js';
const N = 'tests/negative/save-failures.spec.js';
const P = 'tests/positive/crud.spec.js';
const R = 'tests/functional/roles.spec.js';
const A = 'tests/api/scheme-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const mask = (id, field, typed, exp, desc, p = 'P2') => f(id, 'REQ-06', `${field} input`, `${field} "${typed}" → ${exp} (${desc})`, 'Validation', p, NEW, `${field}: "${typed}"`, [`Type "${typed}" into ${field}`, 'Tab'], `${field} shows ${exp}`, V);
const ltv = (id, type, t, r) => f(id, 'REQ-08', 'Internal LTV', `${type} ${t} mo at ${r}%`, 'Business rule / Calculation', 'P0', NEW, `Type ${type}, tenure ${t}, rate ${r}`,
  ['Fill tenure, type, rate', 'Apply to all slabs', 'Read Internal LTV'], `Internal LTV = RBI LTV ÷ (1 + rate × ${type === 'Bullet' ? 'tenure' : '1 month'} ÷ 12) for every slab (±0.01)`, B);

module.exports = [
  f('TC_GS_001', 'REQ-01', 'Navigation', 'Admin opens Gold Scheme Matrix', 'Positive / Navigation', 'P0', 'Admin account', 'CHECKER_BH', ['Login', 'Gold Loan Configuration', 'Click Gold Scheme Matrix'], 'URL open=GoldSchemeMatrix; "Unified scheme matrix" header and New Scheme shown', G, '@smoke'),
  f('TC_GS_002', 'REQ-02', 'Grid', 'Grid columns', 'Functional / UI', 'P1', ADM, '-', ['Read headers'], 'Scheme, Tenure, Type, Interest %, Paise/mo, Internal LTV by slab, Scheme on, Action', G, '@smoke'),
  f('TC_GS_003', 'REQ-02', 'Company', 'Company selector', 'Default value', 'P3', ADM, '-', ['Read company dropdown'], 'Logged-in company (BIJAY FINANCE …) selected', G),
  f('TC_GS_004', 'REQ-02', 'Grid', 'Paging 10 per page', 'Pagination', 'P3', ADM, '-', ['Read page 1', 'Next page'], '10 rows on page 1; next page shows other schemes', G),
  f('TC_GS_005', 'REQ-02', 'Grid', 'Sort by Interest %', 'Sorting', 'P3', ADM, '-', ['Click Interest % header'], 'Rows ordered by rate', G),
  f('TC_GS_006', 'REQ-07', 'Grid', 'Paise/mo = rate ÷ 12 for every scheme', 'Data consistency', 'P1', ADM, 'All pages', ['Read every row'], 'Paise/mo within 0.001 of rate/12', G),
  f('TC_GS_007', 'REQ-07', 'Grid', 'Paise/mo shown with consistent precision (HYPOTHESIS)', 'UI consistency', 'P3', ADM, '-', ['Read Paise/mo texts'], 'Same number of decimals on every row', G),
  f('TC_GS_008', 'REQ-08', 'Grid', 'Grid Internal LTV = resolved-LTV API', 'Data consistency / API', 'P1', ADM, 'getresolvedgoldschemeltv', ['Compare each row with the API'], 'Identical LTV per slab', G),
  f('TC_GS_009', 'REQ-02', 'Grid', 'Grid = scheme list API', 'Data consistency / API', 'P1', ADM, 'getgoldschemeconfigurationlist', ['Compare tenure/type/rate/status'], 'All rows match; same count', G),
  f('TC_GS_010', 'REQ-02', 'Grid', 'Tenure and Type formats', 'Functional / UI', 'P3', ADM, '-', ['Read rows'], '"<n> mo"; Type Bullet or Regular Monthly Repayment', G),
  f('TC_GS_011', 'REQ-03', 'New Scheme', 'Default values', 'Default value', 'P1', NEW, '-', ['Read the panel'], 'Loan "Select…", code/name empty, tenure 3, Bullet, rate 0, Effective From today, Active', NF, '@smoke'),
  f('TC_GS_012', 'REQ-03', 'New Scheme', 'Loan dropdown = loan list API', 'Dropdown', 'P2', NEW, 'getloanlist', ['Read options'], 'Extra (PLE), New Gold (GLNG) – as the API', NF),
  f('TC_GS_013', 'REQ-03', 'New Scheme', 'Scheme Type options', 'Dropdown', 'P2', NEW, '-', ['Read options'], 'Bullet …, Regular Monthly Repayment …', NF),
  f('TC_GS_014', 'REQ-08', 'Slab table', 'Slabs from LTV Slab Master, RBI LTV read-only', 'Functional / Field state', 'P1', NEW, 'getltvslabmaster', ['Read slab rows'], 'RBI LTV 85/80/75 % as the master; only rate and paise are inputs', NF),
  f('TC_GS_015', 'REQ-04', 'Effective From', 'Calendar only; past date selectable', 'Date validation', 'P2', NEW, '15th of previous month', ['Open calendar', 'Previous month', 'Pick 15'], 'Field read-only; picked past date shown', NF),
  f('TC_GS_016', 'REQ-05', 'Clear', 'Clear resets the form', 'Reset / Clear', 'P2', NEW, 'Filled form', ['Fill', 'Clear'], 'Code/name empty, tenure 3, rate 0, loan unselected', NF),
  mask('TC_GS_017', 'Tenure', 'abc', '""', 'letters rejected'),
  mask('TC_GS_018', 'Tenure', '-3', '"3"', 'minus stripped'),
  mask('TC_GS_019', 'Tenure', '1.5', 'not "15"', 'decimal not silently turned into 15 – HYPOTHESIS', 'P2'),
  mask('TC_GS_020', 'Rate', 'abc', '""', 'letters rejected'),
  mask('TC_GS_021', 'Rate', '-5', '"5"', 'minus stripped'),
  mask('TC_GS_022', 'Rate', '12.345', '"12.34"', 'max 2 decimals'),
  mask('TC_GS_023', 'Rate', '99.99', '"99.99"', 'upper boundary kept', 'P3'),
  mask('TC_GS_024', 'Rate', '150', 'not "15"', '150 % not silently cut to 15 % – HYPOTHESIS', 'P2'),
  f('TC_GS_025', 'REQ-06', 'Scheme Code', 'Code length limited (HYPOTHESIS)', 'Max length', 'P3', NEW, '60 × "A"', ['Type 60 characters'], 'A maxlength is set', V),
  f('TC_GS_026', 'REQ-06', 'Scheme Name', 'Unicode name accepted', 'Unicode', 'P3', NEW, 'स्वर्ण योजना – Gold ₹', ['Type the name'], 'Kept exactly', V),
  f('TC_GS_027', 'REQ-06', 'Tenure', 'Tenure 0 refused on save (HYPOTHESIS)', 'Boundary / Negative', 'P1', BLK, 'Tenure 0, rate 18', ['Fill', 'Apply', 'Save'], 'No save request is sent', V),
  f('TC_GS_028', 'REQ-05', 'Save', 'Save without Loan', 'Required field', 'P0', BLK, 'Loan not selected', ['Fill others', 'Save'], '"Please fill all mandatory fields…"; no request', V),
  f('TC_GS_029', 'REQ-05', 'Save', 'Save without Scheme Code', 'Required field', 'P1', BLK, 'Code empty', ['Fill others', 'Save'], 'Same warning; no request', V),
  f('TC_GS_030', 'REQ-05', 'Save', 'Save without Scheme Name', 'Required field', 'P1', BLK, 'Name empty', ['Fill others', 'Save'], 'Same warning; no request', V),
  f('TC_GS_031', 'REQ-05', 'Save', 'Save empty form', 'Required field', 'P0', BLK, '-', ['Save'], '"Please fill all mandatory fields, including the aligned Loan"; no request', V, '@smoke'),
  f('TC_GS_032', 'REQ-20', 'Interest rate', 'Rate 0 % refused', 'Boundary / Negative', 'P1', BLK, 'Rate 0', ['Fill', 'Apply', 'Save'], '"Interest rate must be between 2% and 24%, per this loan’s own Loan Configuration"; no request', V),
  f('TC_GS_071', 'REQ-20', 'Interest rate', 'Rate 1.99 % refused (below min)', 'Boundary value', 'P1', BLK, 'Rate 1.99', ['Fill', 'Apply', 'Save'], 'Same warning; no request', V),
  f('TC_GS_072', 'REQ-20', 'Interest rate', 'Rate 2 % accepted (min)', 'Boundary value', 'P1', BLK, 'Rate 2', ['Fill', 'Apply', 'Save'], 'Save request sent (blocked)', V),
  f('TC_GS_073', 'REQ-20', 'Interest rate', 'Rate 24 % accepted (max)', 'Boundary value', 'P1', BLK, 'Rate 24', ['Fill', 'Apply', 'Save'], 'Save request sent (blocked)', V),
  f('TC_GS_074', 'REQ-20', 'Interest rate', 'Rate 24.01 % refused (above max)', 'Boundary value', 'P1', BLK, 'Rate 24.01', ['Fill', 'Apply', 'Save'], 'Same warning; no request', V),
  f('TC_GS_033', 'REQ-07', 'Slab table', 'Apply to all slabs', 'Business rule', 'P0', NEW, 'Rate 18', ['Type 18', 'Apply to all slabs'], 'Every slab 18 %, Paise/mo 1.5', B, '@smoke'),
  ltv('TC_GS_034', 'Bullet', 9, 18), ltv('TC_GS_035', 'Bullet', 3, 22), ltv('TC_GS_036', 'Monthly', 6, 14), ltv('TC_GS_037', 'Monthly', 12, 18),
  f('TC_GS_038', 'REQ-08', 'Internal LTV', 'Monthly LTV independent of tenure', 'Business rule', 'P2', NEW, 'Monthly 18 %, 3 → 24 mo', ['Change tenure'], 'LTV unchanged', B),
  f('TC_GS_039', 'REQ-08', 'Slab table', 'One slab rate changed', 'Business rule / Field dependency', 'P1', NEW, 'Slab 1 → 24 %', ['Apply 20 %', 'Set slab 1 to 24'], 'Slab 1 paise 2.0 and LTV recalculated; other slabs unchanged', B),
  f('TC_GS_040', 'REQ-09', 'Slab table', 'Exclude / include a slab', 'Conditional behaviour', 'P1', NEW, 'Slab 3', ['Exclude', 'Include back'], '"Not offered"; button changes to "Include…"; LTV restored', B),
  f('TC_GS_041', 'REQ-07', 'Slab table', 'Default rate change needs "Apply" (HYPOTHESIS)', 'Field dependency', 'P3', NEW, '20 → 15', ['Apply 20', 'Type 15'], 'Slab rates stay 20 until Apply is pressed', B),
  f('TC_GS_042', 'REQ-10', 'Save – API', 'Header payload', 'API / Payload', 'P1', SIM, 'AT-SIM, 6 mo, 20 %, Inactive', ['Fill', 'Save', 'Inspect body'], 'pLoanId 88, code, name, tenure, rate, paise = 20/12, ISO Effective From, INACTIVE, BULLET', N),
  f('TC_GS_043', 'REQ-10', 'Save – API', 'Slab payload', 'API / Payload', 'P1', SIM, 'Slab 1 = 19 %, slab 3 excluded', ['Save', 'Inspect slab body'], 'Rates 19/20/20, status ACTIVE/ACTIVE/INACTIVE, new scheme id', N),
  f('TC_GS_044', 'REQ-11', 'Recovery', 'Network failure on save', 'Recovery / Negative', 'P2', SIM, 'Save call aborted', ['Save'], '"Unable to save scheme"; no success', N),
  f('TC_GS_045', 'REQ-11', 'Recovery', 'HTTP 500 on save', 'Recovery / Negative', 'P2', SIM, 'Simulated 500', ['Save'], 'Error shown; entered data kept', N),
  f('TC_GS_046', 'REQ-11', 'Recovery', 'Slab save fails after header saved (HYPOTHESIS)', 'Transaction integrity', 'P1', SIM, 'Header OK, slabs 500', ['Save'], 'User told about the failure; no "Scheme added successfully"', N),
  f('TC_GS_047', 'REQ-12', 'Save', 'Double-click Save Scheme', 'Double submit', 'P1', SIM, '-', ['Double-click Save'], 'One save request', N),
  f('TC_GS_048', 'REQ-10', 'Create', 'Create scheme with custom slab and exclusion', 'Positive / Create / Persistence', 'P0', REAL, '6 mo Bullet 20 %, slab 1 19 %, slab 3 excluded', ['Fill', 'Save', 'Find row'], '"Scheme added successfully"; row 6 mo / Bullet / 20.00 % / 1.667 / LTV 77.63 % / 72.73 %; switch off', P, '@smoke'),
  f('TC_GS_049', 'REQ-13', 'Read', 'Edit shows saved values', 'Read / Edit', 'P1', REAL, 'As TC_GS_048', ['Create', 'Edit'], 'Header and slab rates 19/20/20 + slab 3 "Not offered"', P),
  f('TC_GS_050', 'REQ-13', 'Update', 'Update name and tenure', 'Positive / Update', 'P1', REAL, 'Name + " UPD", tenure 12', ['Edit', 'Update'], '"Scheme updated successfully"; grid updated, LTV recalculated', P),
  f('TC_GS_051', 'REQ-13', 'Update', 'Update keeps slab overrides', 'Data integrity', 'P0', REAL, 'Slab 1 19 %, slab 3 excluded; tenure → 12', ['Create', 'Update tenure', 'Edit again'], 'Slab rates 19/20/20 and slab 3 still excluded', P),
  f('TC_GS_052', 'REQ-14', 'Create', 'Duplicate code + tenure refused, with no success message', 'Duplicate prevention', 'P1', REAL, 'Same code twice', ['Create', 'Create again with same code and tenure'], 'Only "already exists with a 6 month tenure"; no "Scheme added successfully"; count unchanged', P),
  f('TC_GS_053', 'REQ-15', 'Scheme on', 'Switch off and on', 'Workflow state', 'P1', REAL, 'Active scheme', ['Switch off', 'Reload', 'Switch on', 'Reload'], '"Scheme disabled" → off kept → on kept', P),
  f('TC_GS_054', 'REQ-16', 'Delete', 'Delete then Cancel', 'Cancel', 'P2', REAL, '-', ['Delete', 'Dismiss'], 'Dialog "Permanently delete scheme <code> (<name>) and its slab rates? This cannot be undone…"; scheme stays', P),
  f('TC_GS_055', 'REQ-16', 'Delete', 'Delete confirmed', 'Positive / Delete', 'P1', REAL, '-', ['Delete', 'Accept'], '"Scheme <code> deleted."; row gone', P),
  f('TC_GS_056', 'REQ-15', 'Effectiveness', 'Active scheme effective today; Inactive not', 'Business rule / API', 'P1', REAL, 'One Active + one Inactive scheme', ['Create both', 'Read resolved-LTV API'], 'Active → ACTIVE & pIsEffective; Inactive → INACTIVE', P),
  f('TC_GS_057', 'REQ-17', 'Access', 'User without rights sees locked card', 'Role-based access', 'P0', 'Maker (INT_APPRAISER1)', '-', ['Login as maker', 'Click Gold Scheme Matrix'], '"No view permission in User Rights for GoldSchemeMatrix"; screen does not open', R),
  f('TC_GS_058', 'REQ-17', 'Access', 'Direct URL without rights', 'Role-based access / Security', 'P0', 'Maker', 'open=GoldSchemeMatrix', ['Open the URL'], 'No screen, scheme list API not called', R),
  f('TC_GS_059', 'REQ-13', 'Edit', 'Scheme Code locked when editing (HYPOTHESIS)', 'Field state', 'P2', ADM, 'First scheme (not saved)', ['Edit', 'Check code field'], 'Code read-only', R),
  f('TC_GS_060', 'REQ-18', 'API', 'Scheme list schema', 'API / Schema', 'P2', ADM, '-', ['Validate records'], 'Every record well-formed', A),
  f('TC_GS_061', 'REQ-18', 'API security', 'List API without token', 'API / Authorization', 'P1', ADM, '-', ['Replay without token'], '401 / 403', A),
  f('TC_GS_062', 'REQ-18', 'API security', 'List API with a no-rights token', 'API / Authorization', 'P1', 'Maker + admin', 'Maker token', ['Replay with maker token'], '401 / 403', A),
  f('TC_GS_063', 'REQ-18', 'API security', 'Delete API with a no-rights token', 'API / Authorization', 'P0', 'Maker', 'Scheme id 999999999', ['POST delete as maker'], '401 / 403', A),
  f('TC_GS_064', 'REQ-18', 'API', 'Delete unknown scheme', 'API / Negative', 'P3', 'Admin', 'Scheme id 999999999', ['POST delete'], 'pIsDeleted false', A),
  f('TC_GS_065', 'REQ-19', 'Responsive', '768px width', 'Responsive', 'P3', NEW, '768×1024', ['Resize', 'Open New'], 'Save Scheme inside the viewport', U),
  f('TC_GS_066', 'REQ-19', 'Accessibility', 'Form fields labelled', 'Accessibility', 'P3', NEW, '-', ['Check labels'], 'Every field has an accessible name', U),
  f('TC_GS_067', 'REQ-19', 'Accessibility', 'Row action tooltips', 'Usability', 'P3', ADM, '-', ['Read button titles'], 'Edit, Delete', U),

  { ...f('TC_GS_068', 'REQ-15', 'Integration', 'Inactive / future-dated scheme not offered on Gold Estimates', 'Cross-screen workflow', 'P1', 'Scheme created; Gold Estimate screen', '-', ['Create inactive scheme', 'Open Gold Estimates scheme list'], 'Scheme not offered', null), status: 'NOT EXECUTED', reason: 'Needs the Gold Estimates form (separate suite) – planned when that form is built' },
  { ...f('TC_GS_069', 'REQ-14', 'Concurrency', 'Two admins edit the same scheme', 'Concurrent updates', 'P3', 'Two admin accounts', '-', ['Both edit', 'Both update'], 'Second update warned or merged', null), status: 'NOT EXECUTED', reason: 'Only one admin account in .env' },
  { ...f('TC_GS_070', 'REQ-19', 'Session / browser', 'Session timeout; Firefox / WebKit', 'Session timeout / Browser compatibility', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Idle time unknown; only Chromium run' },
  { ...f('TC_GS_NA1', '-', 'Files', 'File upload / download', 'File', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No upload or export on this screen' },
  { ...f('TC_GS_NA2', '-', 'Database', 'Database verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access; persistence checked by grid, Edit and API' },
];
