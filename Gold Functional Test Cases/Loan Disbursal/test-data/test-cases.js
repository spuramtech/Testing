// Test case inventory for Loan Disbursal (single source for the reports).
const M = 'Loan Disbursal';
const S = 'Loan Disbursal list / Disbursement form';
const LS = 'Maker (INT_APPRAISER1) logged in; Loans → Loan Management → Loan Disbursal → Show Loans; every write blocked';
const LN = `${LS}; AUTOTEST approved loan with sanctioned > 0 and nothing pending opened (live data)`;
const ON = `${LN}; Bank → Online, HDFC bank, NEFT, reference AUTOTESTREF1; Submit reply SIMULATED`;

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const L = 'tests/functional/list.spec.js';
const D = 'tests/functional/loan-details.spec.js';
const P = 'tests/validation/payout.spec.js';
const B = 'tests/business-rules/submit.spec.js';
const N = 'tests/negative/roles.spec.js';
const A = 'tests/api/disbursal-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const X = 'tests/positive/real-submit.spec.js';
const pay = (id, typed, why, msg) => f(id, 'REQ-04', 'Payout', `"${typed}" (${why}) not accepted`, typed === 'abc' ? 'Data type' : typed === '' ? 'Empty input' : 'Boundary / Negative', 'P1', LN, typed, ['Type in Current Loan Payout Amount', 'Tab'], `Full available amount stays${msg ? '; "In Single Payment mode, full sanctioned amount must be disbursed."' : ''}`, P);

module.exports = [
  f('TC_LD_001', 'REQ-01', 'List', 'Layout', 'Positive / UI', 'P0', LS, '-', ['Open Loan Disbursal', 'Show Loans'], 'Approved columns, Branch, Show Loans', L, '@smoke'),
  f('TC_LD_002', 'REQ-01', 'List', 'Total and loans = API', 'Data consistency', 'P0', LS, 'GetDisbursementViewData', ['Compare'], 'Same', L, '@smoke'),
  f('TC_LD_003', 'REQ-01', 'List', 'Row values = API', 'Data consistency', 'P1', LS, '-', ['Compare rows'], 'Applicant, contact, sanctioned equal', L),
  f('TC_LD_004', 'REQ-01', 'List', 'Branch filter', 'Filtering', 'P2', LS, 'HEAD OFFICE', ['Select branch', 'Show Loans'], 'Only HEAD OFFICE', L),
  f('TC_LD_005', 'REQ-01', 'List', 'Search by application no', 'Search', 'P2', LS, 'first loan no.', ['Search'], 'Only that loan', L),
  f('TC_LD_006', 'REQ-01', 'List', 'Search by applicant', 'Search', 'P2', LS, 'Autotest', ['Search'], 'Matching rows', L),
  f('TC_LD_007', 'REQ-01', 'List', 'Search no match', 'Search / Negative', 'P3', LS, 'ZZNOMATCH999', ['Search'], 'No rows', L),
  f('TC_LD_008', 'REQ-01', 'List', 'Paging', 'Pagination', 'P3', LS, '-', ['Next page'], '10 rows; page 2 different', L),
  f('TC_LD_009', 'REQ-01', 'List', 'No approved loan with sanctioned 0 (HYPOTHESIS)', 'Business rule', 'P1', LS, '-', ['Check API list'], 'Every loan offered has sanctioned > 0', L),
  f('TC_LD_010', 'REQ-02', 'List', 'Open a loan', 'Navigation', 'P0', LS, 'AUTOTEST loan', ['Click Application No'], 'Disbursement form with Submit For Approval', L, '@smoke'),
  f('TC_LD_011', 'REQ-03', 'Amounts', 'Available and disbursed amounts', 'Calculation', 'P0', LN, '-', ['Read amounts'], 'Available = sanctioned − previous; disbursed = available − adjustments − broken interest − advance EMI', D, '@smoke'),
  f('TC_LD_012', 'REQ-03', 'Amounts', 'Terms from the approved application', 'Data consistency', 'P1', LN, 'GetApprovedApplicationsByID', ['Compare'], 'Sanctioned equal', D),
  f('TC_LD_013', 'REQ-02', 'Borrower bank', 'Bank account shown', 'Data consistency', 'P1', LN, 'getDisbursementbankDetails', ['Read'], 'Bank name and account no. shown', D),
  f('TC_LD_014', 'REQ-03', 'Disburse Date', 'Today, read-only', 'Default value / Date', 'P1', LN, '-', ['Read'], 'Today, not editable', D),
  f('TC_LD_015', 'REQ-03', 'Installment Start', 'Disburse date + 1 month', 'Date / Calculation', 'P1', LN, '-', ['Read'], 'One month later', D),
  f('TC_LD_016', 'REQ-02', 'History', 'No previous disbursals', 'Read', 'P3', LN, '-', ['Read history'], 'No records available', D),
  f('TC_LD_017', 'REQ-05', 'Mode of Payment', 'Cash / Bank with book balances; Cash pre-selected', 'Default value / Data consistency', 'P2', LN, 'getbankbalances', ['Read'], 'Both with Dr/Cr balances; bank = book balance; Cash checked', D),
  f('TC_LD_018', 'REQ-05', 'Bank → Online', 'Bank and payment types', 'Dropdown / Dependent field', 'P1', LN, '-', ['Bank', 'Online'], 'Company bank; RTGS / NEFT / IMPS / UPI / INTRA BANK TRANSFER', D),
  f('TC_LD_019', 'REQ-05', 'Bank → Cheque', 'Bank and cheque list', 'Dependent field', 'P2', LN, '-', ['Bank', 'Cheque', 'Bank name'], 'Cheque No list shown', D),
  f('TC_LD_020', 'REQ-05', 'Bank → Debit Card', 'Card list', 'Dependent field', 'P3', LN, '-', ['Bank', 'Debit Card'], 'Card list shown', D),
  f('TC_LD_021', 'REQ-05', 'Cash', 'Cash hides bank fields', 'Conditional field', 'P2', LN, '-', ['Bank', 'Cash'], 'No bank fields', D),
  f('TC_LD_022', 'REQ-05', 'Clear', 'Clear resets bank choice', 'Clear / Reset', 'P2', LN, '-', ['Fill Online', 'Clear'], 'Reference and bank empty', D),
  pay('TC_LD_023', '0', 'zero', true),
  pay('TC_LD_024', '100', 'less than available', true),
  pay('TC_LD_025', 'available + 1000', 'more than available', false),
  pay('TC_LD_026', 'abc', 'letters', false),
  pay('TC_LD_027', '-100', 'negative', true),
  pay('TC_LD_028', '100.555', 'three decimals', true),
  pay('TC_LD_029', '', 'empty', false),
  f('TC_LD_030', 'REQ-04', 'Payout', 'Max length', 'Max length', 'P3', LN, '-', ['Read maxlength'], '18', P),
  f('TC_LD_031', 'REQ-05', 'Reference No', 'Max 30', 'Max length', 'P3', LN, '35 chars', ['Online', 'Type'], '30 kept', P),
  f('TC_LD_032', 'REQ-05', 'Submit', 'Bank without Cheque/Online/Debit Card', 'Required field', 'P0', LN, '-', ['Bank', 'Submit'], '"Please Select Bank"; nothing sent', B, '@smoke'),
  f('TC_LD_033', 'REQ-05', 'Submit', 'Online without bank name', 'Required field', 'P1', LN, '-', ['Online', 'Submit'], 'Nothing sent; a message', B),
  f('TC_LD_034', 'REQ-05', 'Submit', 'Online without type of payment', 'Required field', 'P1', LN, '-', ['Online, bank', 'Submit'], 'Nothing sent; a message', B),
  f('TC_LD_035', 'REQ-05', 'Submit', 'Online without reference no', 'Required field', 'P1', LN, '-', ['Online, bank, NEFT', 'Submit'], 'Nothing sent; a message', B),
  f('TC_LD_036', 'REQ-05', 'Submit', 'Cheque without cheque no', 'Required field', 'P1', LN, '-', ['Cheque, bank', 'Submit'], 'Nothing sent', B),
  f('TC_LD_037', 'REQ-05', 'Submit', 'No mode of payment chosen (HYPOTHESIS)', 'Required field / Default value', 'P2', LN, '-', ['Submit straight away'], 'Asks for a mode; nothing sent', B),
  f('TC_LD_038', 'REQ-06', 'Submit', 'Online payload', 'API payload', 'P0', ON, '-', ['Submit'], 'BANK, ONLINE, NEFT, reference, bank, loan, CREATE, payout = available, disbursal = amount disbursed', B, '@smoke'),
  f('TC_LD_039', 'REQ-06', 'Submit', 'Cash payload', 'API payload', 'P1', `${LN}; Cash; Submit reply SIMULATED`, '-', ['Submit'], 'CASH; no bank fields', B),
  f('TC_LD_040', 'REQ-06', 'Submit', 'Dates in payload', 'Date / API payload', 'P1', ON, '-', ['Submit'], 'Payment date today; installment start = shown', B),
  f('TC_LD_041', 'REQ-06', 'Submit', 'Borrower account in payload', 'API payload', 'P1', ON, '-', ['Submit'], "Borrower's account no.", B),
  f('TC_LD_042', 'REQ-06', 'Submit', 'Success message (SIMULATED reply)', 'Positive / Workflow', 'P0', ON, '-', ['Submit'], '"Disbursal submitted for Branch Head approval."; back to list', B),
  f('TC_LD_043', 'REQ-06', 'Submit', 'Network failure', 'Error recovery', 'P1', ON.replace('Submit reply SIMULATED', 'Submit aborted'), '-', ['Submit'], 'Error; stays on form', B),
  f('TC_LD_044', 'REQ-06', 'Submit', 'Server error 500', 'Error recovery', 'P1', ON.replace('Submit reply SIMULATED', 'Submit reply 500'), '-', ['Submit'], 'No success; stays on form', B),
  f('TC_LD_045', 'REQ-06', 'Submit', 'Double click', 'Double submit', 'P0', ON, '-', ['Double-click Submit'], 'One request', B),
  f('TC_LD_046', 'REQ-06', 'Submit', 'Already pending loan', 'Duplicate prevention / Workflow', 'P0', LS, 'loan waiting for BH approval', ['Open it'], 'Submit For Approval disabled', B),
  f('TC_LD_047', 'REQ-07', 'Access', 'External appraiser menu', 'Role-based access', 'P1', 'EXT_APPRAISER1 logged in', '-', ['Look for the menu entry'], 'Not available', N),
  f('TC_LD_048', 'REQ-07', 'Access', 'External appraiser direct URL', 'Role-based access', 'P0', 'EXT_APPRAISER1 logged in', '#/Loans/DisbursementView', ['Open URL'], 'Sent back; no list', N),
  f('TC_LD_049', 'REQ-07', 'Access', 'Branch Head can open the list', 'Role-based access', 'P3', 'CHECKER_BH logged in', '-', ['Open'], 'List shown', N),
  f('TC_LD_050', 'REQ-08', 'API', 'Read APIs without token', 'API security', 'P0', LS, 'no Authorization', ['GET list / loan'], '401/403', A),
  f('TC_LD_051', 'REQ-08', 'API', 'SubmitDisbursal without token', 'API security', 'P0', LS, 'fake loan, no Authorization', ['POST'], '401/403', A),
  f('TC_LD_052', 'REQ-06', 'API', 'Branch Head approval required', 'Business rule / API', 'P1', LS, 'RequiresApproval', ['GET'], 'true', A),
  f('TC_LD_053', 'REQ-07', 'API', 'External appraiser token reads list (HYPOTHESIS)', 'API security', 'P1', LS, 'EXT_APPRAISER1 token', ['GET list'], '401/403 or empty', A),
  f('TC_LD_054', 'REQ-09', 'UI', 'Tablet width', 'Responsive', 'P3', LN, '768px', ['Resize'], 'No horizontal scroll', U),
  f('TC_LD_055', 'REQ-09', 'UI', 'Field labels', 'Accessibility', 'P3', LN, '-', ['Check labels'], 'All named', U),
  f('TC_LD_056', 'REQ-06', 'Submit (real)', 'Real Online submit (ALLOW_DATA_CREATION=1)', 'Positive / Create', 'P0', `${LS} but writes allowed; ALLOW_DATA_CREATION=1`, 'AUTOTEST loan, NEFT', ['Open', 'Bank / Online', 'Submit'], 'Success; loan now pending approval', X),

  { ...f('TC_LD_057', 'REQ-04', 'Part / stage-wise', 'Part payment and stage-wise disbursal', 'Business rule', 'P2', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'All gold loans here are SINGLE PAYMENT; no part / stage-wise loan to test' },
  { ...f('TC_LD_058', 'REQ-05', 'Top Up / broken interest', 'Top Up and broken-interest options', 'Conditional field', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Rules unknown; broken interest is 0 for loans disbursed on the installment day' },
  { ...f('TC_LD_059', 'REQ-02', 'Borrower bank', 'Add / Sync Bank Details', 'Create', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Writes to the customer contact record' },
  { ...f('TC_LD_060', 'REQ-01', 'Revert to Approval', 'Actions → Revert to Approval', 'Workflow', 'P2', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Destructive – sends the loan back to approval; never clicked' },
  { ...f('TC_LD_061', 'REQ-03', 'Back-dated disbursal', 'Back-dated Disburse Date', 'Date', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Date is read-only on screen; back-dating is covered by the Gold Flow Entry flow' },
  { ...f('TC_LD_062', 'REQ-09', 'Session / concurrency / browser', 'Two makers submit the same loan; session timeout; Firefox/WebKit', 'Concurrency / Session / Browser', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Needs real submits; one maker login; Chromium only' },
  { ...f('TC_LD_NA1', '-', 'Delete', 'Delete a disbursal', 'CRUD', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No delete; reject happens in the Gold Disbursal Approval Queue' },
  { ...f('TC_LD_NA2', '-', 'File upload', 'Upload', 'File upload', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No upload on this screen' },
  { ...f('TC_LD_NA3', '-', 'Database', 'DB verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access; persistence checked through the API' },
];
