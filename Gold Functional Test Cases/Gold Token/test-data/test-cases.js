// Test case inventory for Gold Token (single source for the reports).
const M = 'Gold Token';
const S = 'Gold Loan Token';
const MK = 'Maker (INT_APPRAISER1) logged in; Loans → Gold → Gold Token open (real list, read-only)';
const SIM = 'Maker logged in; SIMULATED available token UID99999 (copy of a used AUTOTEST token) selected; every write blocked';
const LD = `${SIM}; nominee LAKSHMI QA / Mother / 100 % added; Next → Loan Details`;

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const T = 'tests/functional/tokens.spec.js';
const N = 'tests/validation/nominee.spec.js';
const L = 'tests/business-rules/loan-details.spec.js';
const A = 'tests/api/token-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const P = 'tests/positive/real-loan.spec.js';
const amt = (id, typed, exp, desc, p = 'P2') => f(id, 'REQ-07', 'Amount requested', `"${typed}" → ${exp} (${desc})`, 'Validation', p, LD, `Amount "${typed}"`, ['Type amount', 'Tab'], `Box shows ${exp}`, L);

module.exports = [
  f('TC_GT_001', 'REQ-01', 'Token list', 'Page layout', 'Positive / UI', 'P0', MK, '-', ['Open Gold Token'], 'New / Used Tokens counts; grid Generate, Token Number, Customer Name, Mobile, Type, Appraisal Value', T, '@smoke'),
  f('TC_GT_002', 'REQ-01', 'Token list', 'Available = unused tokens from API', 'Data consistency', 'P1', MK, 'GetGoldLoanCustomerDetails', ['Compare'], 'Same tokens; New Tokens count equal', T),
  f('TC_GT_003', 'REQ-01', 'Token list', 'Appraisal value = estimate', 'Data consistency', 'P1', MK, '-', ['Compare each token'], 'Equal values', T),
  f('TC_GT_004', 'REQ-01', 'Used tokens', 'Used Tokens tab', 'Read / Filter', 'P2', MK, 'GetUsedGoldLoanTokensDetails', ['Open Used Tokens'], 'Only used tokens, = API', T),
  f('TC_GT_005', 'REQ-02', 'Token', 'Simulated token listed', 'Read', 'P2', SIM, 'UID99999', ['Read row'], 'Customer, mobile, value of the estimate', T),
  f('TC_GT_006', 'REQ-02', 'Token Overview', 'Appraisal, eligible, article qty', 'Data consistency', 'P0', SIM, '-', ['Read overview'], '= estimate appraisal value, eligible value, article quantity', T, '@smoke'),
  f('TC_GT_007', 'REQ-02', 'Member', 'Member information', 'Read', 'P1', SIM, '-', ['Read Member Information'], 'Estimate customer name and mobile', T),
  f('TC_GT_008', 'REQ-02', 'Date', 'Token date read-only', 'Field state', 'P2', SIM, '-', ['Check date'], 'dd/mm/yyyy, read-only', T),
  f('TC_GT_009', 'REQ-02', 'Articles', 'View gold article details', 'Read', 'P3', SIM, '-', ['Click the eye icon on Article Details'], 'Pop-up lists the estimate articles', T),
  f('TC_GT_010', 'REQ-03', 'Nominee', 'Next without nominee', 'Required field', 'P0', SIM, '-', ['Next'], '"Please add at least one Nominee before proceeding."', N, '@smoke'),
  f('TC_GT_011', 'REQ-03', 'Nominee', 'Add without name/relationship', 'Required field', 'P1', SIM, '-', ['Add'], '"Please fill Full Name and Relationship before adding a nominee"', N),
  f('TC_GT_012', 'REQ-03', 'Nominee', 'Relationship list', 'Dropdown', 'P3', SIM, '-', ['Open list'], 'Mother, Father, Spouse, Son, Daughter, Brother, Sister …', N),
  f('TC_GT_013', 'REQ-03', 'Nominee', 'Contact digits only (HYPOTHESIS)', 'Data type', 'P2', SIM, '"abc12345678901"', ['Type'], 'Only digits kept', N),
  f('TC_GT_014', 'REQ-03', 'Nominee', 'Contact max 12', 'Max length', 'P3', SIM, '14 digits', ['Type'], '≤ 12 kept', N),
  f('TC_GT_015', 'REQ-03', 'Nominee', 'Proportion > 100 %', 'Boundary', 'P1', SIM, '150 %', ['Add'], '"Proportional should not be greater than 100"; not added', N),
  f('TC_GT_016', 'REQ-03', 'Nominee', 'Total must be 100 %', 'Business rule', 'P0', SIM, '60 %', ['Add', 'Next'], '"… must add up to 100% … (currently 60%)"', N),
  f('TC_GT_017', 'REQ-03', 'Nominee', 'Duplicate nominee', 'Duplicate prevention', 'P2', SIM, 'Same nominee twice', ['Add twice'], '"Already existed"; one row', N),
  f('TC_GT_018', 'REQ-03', 'Nominee', '60 % + 40 % → Next', 'Positive / Business rule', 'P1', SIM, 'Two nominees', ['Add both', 'Next'], 'Loan Details shown', N),
  f('TC_GT_019', 'REQ-04', 'KYC', 'PAN / FORM 60 proofs, reference max 30', 'Dropdown / Max length', 'P3', SIM, 'PAN / FORM 60', ['Pick type'], 'Form 60, PAN CARD; reference maxlength 30', N),
  f('TC_GT_020', 'REQ-03', 'Nominee', 'Remove an added nominee (HYPOTHESIS)', 'Edit / Delete', 'P2', SIM, '-', ['Add', 'Look for remove'], 'Row has a delete/edit action', N),
  f('TC_GT_021', 'REQ-05', 'Loan Details', 'Scheme terms locked', 'Business rule / Field state', 'P0', LD, '-', ['Read loan name, tenure, interest'], 'New Gold; estimate tenure and rate; all disabled', L, '@smoke'),
  f('TC_GT_022', 'REQ-05', 'Loan Details', 'Eligible amount', 'Data consistency', 'P1', LD, '-', ['Read eligible'], '= estimate eligible value', L),
  amt('TC_GT_023', 'abc', '""', 'letters rejected'),
  amt('TC_GT_024', '50000', '"50,000"', 'Indian separators', 'P3'),
  amt('TC_GT_025', '0', '""', 'zero not accepted'),
  amt('TC_GT_026', '1000.50', '1000.5', 'decimal keeps its value – HYPOTHESIS', 'P1'),
  f('TC_GT_027', 'REQ-07', 'Amount', 'Eligible − 1 accepted', 'Boundary value', 'P1', LD, 'floor(eligible) − 1', ['Type'], 'Kept', L),
  f('TC_GT_028', 'REQ-07', 'Amount', 'Equal to eligible refused', 'Boundary value', 'P1', LD, 'ceil(eligible)', ['Type'], 'Cleared; "Amount Should be Less than Eligible Loan Amount (LTV)"', L),
  f('TC_GT_029', 'REQ-07', 'Amount', 'Above eligible refused', 'Boundary value', 'P1', LD, 'ceil(eligible) + 1', ['Type'], 'Cleared; same message', L),
  f('TC_GT_030', 'REQ-07', 'Save', 'No amount → not sent with 0', 'Required field / Data integrity', 'P0', LD, 'Amount empty', ['Save'], 'No save request', L, '@smoke'),
  f('TC_GT_031', 'REQ-06', 'Save – API', 'Save payload', 'API / Payload', 'P1', LD, 'Amount 50,000', ['Save (blocked)'], 'Token UID99999, contact ref, nominee, amount 50000', L),
  f('TC_GT_032', 'REQ-03', 'Nominee', 'One primary nominee (HYPOTHESIS)', 'Business rule', 'P2', `${SIM}; two nominees`, '60/40', ['Save (blocked)'], 'Exactly one pisprimarynominee', L),
  f('TC_GT_033', 'REQ-06', 'Save', 'Meaningful failure message', 'Error handling', 'P2', LD, 'Network blocked', ['Save'], 'Error shown, not "Unknown Error"', L),
  f('TC_GT_034', 'REQ-06', 'Save', 'Double-click Save', 'Double submit', 'P1', `${LD}; simulated server`, '-', ['Double-click Save'], 'One request', L),
  f('TC_GT_035', 'REQ-06', 'Navigation', 'Back keeps nominees', 'Navigation', 'P2', LD, '-', ['Back'], 'Member tab with nominee row', L),
  f('TC_GT_036', 'REQ-05', 'Charges', 'Charges & Fees table', 'UI', 'P3', LD, '-', ['Read'], 'Charges, amount, waiver, GST, adjust-in-disbursement columns', L),
  f('TC_GT_037', 'REQ-08', 'API security', 'No token', 'API / Authorization', 'P1', MK, '-', ['Replay without token'], '401 / 403', A),
  f('TC_GT_038', 'REQ-08', 'API', 'Used token reported used', 'API / Consistency', 'P2', MK, 'A used token', ['GET details'], 'isTokenUsed true', A),
  f('TC_GT_039', 'REQ-09', 'Responsive', '768px', 'Responsive', 'P3', MK, '-', ['Resize'], 'No page-level horizontal scroll', U),
  f('TC_GT_040', 'REQ-09', 'Accessibility', 'Nominee fields labelled', 'Accessibility', 'P3', SIM, '-', ['Check labels'], 'All labelled', U),
  f('TC_GT_041', 'REQ-06', 'Create (real)', 'AUTOTEST token → loan (ALLOW_DATA_CREATION=1)', 'Positive / Create', 'P0', `${MK}; an available AUTOTEST token; ALLOW_DATA_CREATION=1`, '90 % of eligible', ['Select', 'Nominee', 'Amount', 'Save'], 'Success; token leaves New Tokens', P),

  { ...f('TC_GT_042', 'REQ-04', 'KYC upload', 'Nominee KYC file upload', 'File upload', 'P3', SIM, 'PNG', ['Upload'], 'File attached', null), status: 'NOT EXECUTED', reason: 'Upload goes straight to the server (MultiFileUploads); not needed for the rules above – covered by Gold Estimates upload' },
  { ...f('TC_GT_043', 'REQ-02', 'Back date', 'Back-dated token', 'Date', 'P2', '-', 'BACK_DATE', ['-'], 'Token date = back date', null), status: 'NOT EXECUTED', reason: 'Covered by the Gold Flow Entry back-dated flow' },
  { ...f('TC_GT_044', 'REQ-09', 'Session / browser / concurrency', 'Two makers use the same token; session timeout; Firefox/WebKit', 'Concurrency / Session / Browser', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Would consume a real token; idle time unknown; Chromium only' },
  { ...f('TC_GT_NA1', '-', 'Delete', 'Delete / cancel a token', 'CRUD', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'Tokens come from approved estimates; the screen has no delete' },
  { ...f('TC_GT_NA2', '-', 'Database', 'DB verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access' },
];
