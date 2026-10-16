// Test case inventory for Gold Estimates (single source for the reports).
const M = 'Gold Estimates';
const S = 'New Estimate';
const MK = 'Maker (INT_APPRAISER1) logged in; Loans → Gold → Gold Estimates open';
const C = `${MK}; an AUTOTEST contact selected`;
const BLK = `${C}; SaveMakerEntry blocked (image upload allowed – stores a file only)`;
const SIM = `${C}; SaveMakerEntry answered by a SIMULATED response`;

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const F = 'tests/functional/form.spec.js';
const V = 'tests/validation/inputs.spec.js';
const B = 'tests/business-rules/calculations.spec.js';
const N = 'tests/negative/review-and-failures.spec.js';
const P = 'tests/positive/create-estimate.spec.js';
const A = 'tests/api/estimate-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const mask = (id, field, typed, exp, desc, p = 'P2') => f(id, 'REQ-07', `${field} input`, `${field} "${typed}" → ${exp} (${desc})`, 'Validation', p, C, `Row 1 ${field}: "${typed}"`, [`Type "${typed}"`, 'Tab'], `${field} shows ${exp}`, V);
const net = (id, g, s, band) => f(id, 'REQ-09', 'Net weight', `${g} g gross, ${s} g stone: ${band}`, 'Business rule / Calculation', 'P0', C, `CHAIN, gross ${g}, stone ${s}`, ['Fill the row', 'Read Net weight'], `Net = (gross − stone) × (1 − wastage %), ${band}`, B);

module.exports = [
  f('TC_GE_001', 'REQ-01', 'Navigation', 'Form layout', 'Positive / Navigation', 'P0', MK, '-', ['Open Gold Estimates'], 'Customer Details, Gold Details, Gold Article Details, Totals, Attachments & Remarks; View, My Saved Estimates, Clear, Save', F, '@smoke'),
  f('TC_GE_002', 'REQ-02', 'Date', 'Default today, calendar only', 'Default value / Date', 'P2', MK, '-', ['Read Date'], 'Today; read-only input', F),
  f('TC_GE_003', 'REQ-02', 'Date', 'Future dates disabled', 'Date validation', 'P1', MK, '-', ['Open calendar'], 'Every day after today disabled', F),
  f('TC_GE_004', 'REQ-02', 'Loan Name', 'Defaults to New Gold', 'Default value', 'P2', MK, '-', ['Read Loan Name'], 'New Gold', F),
  f('TC_GE_005', 'REQ-03', 'Scheme', 'Scheme list = active effective schemes', 'Dropdown / Cross-screen', 'P1', MK, 'getresolvedgoldschemeltv', ['Read options'], '"Not applied" default + every ACTIVE effective scheme "<name> — <n> mo"', F),
  f('TC_GE_006', 'REQ-04', 'Contact', 'Search by name', 'Autocomplete', 'P0', MK, '"Autotest"', ['Type in Contact Name'], 'Matching contacts with mobile/e-mail', F, '@smoke'),
  f('TC_GE_007', 'REQ-04', 'Contact', 'Search by mobile', 'Autocomplete', 'P2', MK, 'Mobile of an AUTOTEST contact', ['Type mobile'], 'That contact listed', F),
  f('TC_GE_008', 'REQ-05', 'Article grid', '5 rows, 22K, approved rate', 'Default value / Cross-screen', 'P1', C, 'getgoldrate', ['Read row 1'], '5 rows; 22K; "₹ <rate> / g as of <date>" = API rate', F),
  f('TC_GE_009', 'REQ-05', 'Purity', 'Purity choices', 'Dropdown', 'P3', C, '-', ['Open purity'], '24K, 22K, 21K, 20K, 19K, 18K', F),
  f('TC_GE_010', 'REQ-06', 'Article type', 'Prohibited types not offered', 'Business rule / Dropdown', 'P1', C, 'GetGoldArticleLimitMaster', ['Compare options with prohibited list'], 'No prohibited type offered', F),
  f('TC_GE_011', 'REQ-05', 'Defects', 'Defect list', 'Dropdown', 'P3', C, '-', ['Open Defects'], 'Configured defects (Nil, Cut, Missing Stone, Soldering, …)', F),
  f('TC_GE_012', 'REQ-05', 'Article grid', 'Auto new row + Add Row', 'Functional', 'P2', C, '5 rows filled', ['Fill every row', 'Add Row'], '+1 row automatically, +1 with Add Row', F),
  f('TC_GE_013', 'REQ-08', 'Clear', 'Clear resets', 'Reset / Clear', 'P2', C, 'Row + remarks', ['Clear'], 'Remarks empty; totals 0', F),
  f('TC_GE_014', 'REQ-13', 'View', 'Saved estimates list', 'Read / Search', 'P2', MK, '-', ['Click View'], 'Token Number, Customer Name, Mobile, Appraisal Value', F),
  f('TC_GE_015', 'REQ-13', 'My Saved Estimates', 'Maker\'s GE list', 'Read', 'P2', MK, 'GetMyGoldEstimates', ['Click My Saved Estimates'], 'Newest GE first, status and actions', F),
  mask('TC_GE_016', 'Quantity', 'abc', '""', 'letters rejected'),
  mask('TC_GE_017', 'Quantity', '-2', '"2"', 'minus stripped'),
  mask('TC_GE_018', 'Quantity', '1.5', 'not "15"', 'decimal not silently made 15 – HYPOTHESIS'),
  mask('TC_GE_019', 'Quantity', '999', '"99"', 'max 2 digits', 'P3'),
  mask('TC_GE_020', 'Gross weight', 'abc', '""', 'letters rejected'),
  mask('TC_GE_021', 'Gross weight', '-5', '"5"', 'minus stripped'),
  mask('TC_GE_022', 'Gross weight', '10.12345', '"10.12"', 'max 2 decimals'),
  mask('TC_GE_023', 'Stone/Wastage', 'abc', '""', 'letters rejected', 'P3'),
  f('TC_GE_024', 'REQ-07', 'Quantity', 'Quantity 0 refused with a quantity message', 'Boundary / Error message', 'P2', C, 'Quantity 0', ['Type 0'], 'Message mentions quantity (observed: "Please Start Number cannot be Zero")', V),
  f('TC_GE_025', 'REQ-07', 'Gross weight', 'Gross 0 refused', 'Boundary / Negative', 'P1', C, 'Gross 0', ['Type 0'], '"Gross weight Can Not Be Zero"', V),
  f('TC_GE_026', 'REQ-07', 'Stone', 'Stone > gross refused', 'Cross-field validation', 'P0', C, 'Gross 5, stone 6', ['Fill'], '"Stone/Wastage weight can not be greater than Gross weight"; no value', V, '@smoke'),
  f('TC_GE_027', 'REQ-07', 'Stone', 'Stone = gross refused (HYPOTHESIS)', 'Cross-field / Boundary', 'P2', C, 'Gross 5, stone 5', ['Fill'], 'Warning about stone / net weight', V),
  f('TC_GE_028', 'REQ-08', 'Remarks', 'Max 90 characters', 'Max length', 'P3', C, '120 characters', ['Type'], '90 kept', V),
  f('TC_GE_029', 'REQ-08', 'Save', 'Save with no article', 'Required field', 'P0', MK, '-', ['Save'], '"Add Gold Article"; no review; no request', V, '@smoke'),
  f('TC_GE_030', 'REQ-08', 'Save', 'Save without image', 'Required field', 'P0', C, 'Valid row, no image', ['Save'], '"Please Upload Gold Articles Images"; no review', V),
  f('TC_GE_031', 'REQ-08', 'Save', 'Article without gross weight', 'Required field', 'P1', C, 'RING, qty 1, no gross; image', ['Save'], 'Gross weight required / Add Gold Article; no review', V),
  f('TC_GE_032', 'REQ-06', 'Article limits', 'Quantity above per-person limit', 'Business rule / Boundary', 'P1', C, 'Ankle Wear qty limit + 1', ['Fill', 'Upload', 'Save'], 'Refused with a limit message; no review', V),
  f('TC_GE_033', 'REQ-08', 'Remarks', 'Saved as typed (HYPOTHESIS)', 'Data integrity', 'P3', BLK, '"checked by qa team"', ['Save', 'Confirm (blocked)', 'Read payload'], 'pRemarks unchanged', V),
  net('TC_GE_034', 10.5, 0.5, 'stone < 5 % → no wastage'), net('TC_GE_035', 20, 1, '5–10 % → 1 %'), net('TC_GE_036', 10, 2, '10–25 % → 2 %'), net('TC_GE_037', 10, 3, '25–40 % → 5 %'), net('TC_GE_038', 10, 5, '≥ 40 % → 8 %'),
  f('TC_GE_039', 'REQ-10', 'Value', 'Row total = pure net × rate', 'Calculation', 'P0', C, 'RING 10.5 / 0.5', ['Fill', 'Read row'], 'Total = pure × rate', B, '@smoke'),
  f('TC_GE_040', 'REQ-10', 'Purity', 'Purity deduction and own rate', 'Business rule / Calculation', 'P1', C, '20K CHAIN 10 g', ['Pick 20K', 'Fill'], 'Ded % = Purity Deduction master; pure = net × (1 − ded); total = pure × rate', B),
  f('TC_GE_041', 'REQ-10', 'Totals', 'Totals of 3 rows', 'Calculation', 'P0', C, 'RING, CHAIN, 2 × BANGLE', ['Fill 3 rows'], 'Sum of pure weight, quantity 4, sum of values', B),
  f('TC_GE_042', 'REQ-11', 'LTV', 'No scheme → Not Configured', 'Business rule / Message', 'P1', C, 'No scheme', ['Fill row'], '"Not Configured" + "No LTV Slab configured … apply a Scheme"', B),
  f('TC_GE_043', 'REQ-11', 'LTV', 'GL-quick, value < ₹2.5 L', 'Business rule / Cross-screen', 'P0', C, 'GL-quick, RING 10.5 g', ['Pick scheme', 'Fill'], 'LTV = resolved slab LTV; rate/gram = rate × LTV; eligible = value × LTV', B),
  f('TC_GE_044', 'REQ-11', 'LTV', 'GL-quick, value ₹2.5–5 L', 'Business rule / Boundary', 'P1', C, 'GL-quick, RING 25 g', ['Pick scheme', 'Fill'], 'Second slab LTV applied', B),
  f('TC_GE_045', 'REQ-12', 'Review', 'Review dialog content', 'Functional / Data consistency', 'P0', BLK, 'GL-quick RING 10.5 g + image', ['Save'], 'Customer, gross 10.5, net 10, value, eligible, article row; "nothing is saved until you confirm"', N, '@smoke'),
  f('TC_GE_046', 'REQ-12', 'Review', 'Back to Edit', 'Cancel', 'P1', BLK, '-', ['Save', 'Back to Edit'], 'Review closes; entries kept; no request', N),
  f('TC_GE_047', 'REQ-12', 'Save – API', 'Save payload', 'API / Payload', 'P0', BLK, 'GL-quick RING', ['Save', 'Confirm', 'Read SaveMakerEntry body'], 'Scheme id/rate/tenure, weights, rate per gram, eligible value, 1 article, image name', N),
  f('TC_GE_048', 'REQ-12', 'Recovery', 'Network failure on save', 'Recovery / Negative', 'P1', SIM, 'Request aborted', ['Confirm'], '"Failed to save the gold estimate."', N),
  f('TC_GE_049', 'REQ-12', 'Recovery', 'HTTP 500 on save', 'Recovery / Negative', 'P2', SIM, 'Simulated 500', ['Confirm'], 'Error shown; entries kept', N),
  f('TC_GE_050', 'REQ-12', 'Save', 'Double-click Confirm & Save', 'Double submit', 'P1', SIM, '-', ['Double-click Confirm'], 'One request', N),
  f('TC_GE_051', 'REQ-11', 'LTV', 'Estimate without any LTV refused (HYPOTHESIS)', 'Business rule / Negative', 'P1', BLK, 'No scheme', ['Save'], 'Review not reached', N),
  f('TC_GE_052', 'REQ-14', 'Create (real)', 'Save → GE number, routed, listed (ALLOW_DATA_CREATION=1)', 'Positive / Create / Workflow', 'P0', `${C}; ALLOW_DATA_CREATION=1`, 'GL-quick RING 10.5 g', ['Save', 'Confirm', 'My Saved Estimates'], 'GE number; routed; row shows required appraisals per approval slab', P),
  f('TC_GE_053', 'REQ-15', 'API security', 'No token', 'API / Authorization', 'P1', MK, '-', ['Replay GET without token'], '401 / 403', A),
  f('TC_GE_054', 'REQ-05', 'API', 'Rate = latest approved internal rate ≤ today', 'API / Cross-screen', 'P1', C, 'getgoldrate', ['Read API'], 'Positive rate dated ≤ today', A),
  f('TC_GE_055', 'REQ-14', 'API', 'Approval slabs cover every amount', 'Configuration consistency', 'P2', MK, 'GetSlabConfigList', ['Check ranges'], 'Start at 0; no gaps/overlaps', A),
  f('TC_GE_056', 'REQ-16', 'Responsive', '768px width', 'Responsive', 'P3', C, '768×1024', ['Resize'], 'Save inside the viewport', U),
  f('TC_GE_057', 'REQ-16', 'Accessibility', 'Field labels', 'Accessibility', 'P3', C, '-', ['Check labels'], 'Every field labelled', U),
  f('TC_GE_058', 'REQ-11', 'Usability', 'Eligible Loan tooltip', 'Usability', 'P3', MK, '-', ['Read tooltip'], '"Appraisal Value x Internal LTV % …"', U),

  { ...f('TC_GE_059', 'REQ-02', 'Back date', 'Back-dated estimate uses that day\'s gold rate', 'Date / Business rule', 'P1', 'Rate exists for the back date', 'BACK_DATE', ['Pick past date', 'Fill'], 'Rate "as of" the back date', null), status: 'NOT EXECUTED', reason: 'Covered by the Gold Flow Entry back-dated flow; needs a saved estimate to verify end to end' },
  { ...f('TC_GE_060', 'REQ-08', 'Take Photo', 'Camera capture', 'File upload', 'P3', 'Camera', '-', ['Take Photo'], 'Photo attached', null), status: 'NOT EXECUTED', reason: 'Needs a camera device – manual' },
  { ...f('TC_GE_061', 'REQ-14', 'Approval workflow', 'Routing to Internal 2 / External / Checker by value', 'Workflow', 'P1', 'Saved estimates', '-', ['Save estimates in each slab'], 'Routed per slab', null), status: 'NOT EXECUTED', reason: 'Each check creates a permanent estimate; slab data verified by TC_GE_055, one routing by TC_GE_052 (opt-in)' },
  { ...f('TC_GE_062', 'REQ-16', 'Session / browser / concurrency', 'Session timeout, Firefox/WebKit, two makers same contact', 'Session / Browser / Concurrency', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Idle time unknown; only Chromium; one maker account' },
  { ...f('TC_GE_NA1', '-', 'Delete', 'Edit / delete a saved estimate', 'CRUD', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'Saved estimates have no edit/cancel/delete – they continue in the approval queues' },
  { ...f('TC_GE_NA2', '-', 'Database', 'DB verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access; payload and lists checked instead' },
];
