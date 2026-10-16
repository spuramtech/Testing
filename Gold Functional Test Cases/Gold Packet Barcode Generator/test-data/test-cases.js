// Test case inventory for Gold Packet Barcode Generator (single source for the reports).
const M = 'Gold Packet Barcode Generator';
const S = 'Gold Packet Barcode Generator / Register';
const BH = 'Branch Head (CHECKER_BH) logged in; Loans → Gold → Gold Packet Barcode Generator open; every write blocked';
const PV = `${BH}; first loan selected; "unused barcode" check answered as none (SIMULATED); Generate clicked`;
const UN = `${BH}; first loan selected; "unused barcode" check answered with BH9999999998 (SIMULATED); Generate clicked`;
const RG = 'Branch Head logged in; Gold Packet Barcode Register open (View Register); every write blocked';
const DL = `${RG}; Status = Not Used; Cancel clicked on the first row`;

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const G = 'tests/functional/generator.spec.js';
const V = 'tests/validation/loan-select.spec.js';
const P = 'tests/business-rules/print.spec.js';
const R = 'tests/functional/register.spec.js';
const N = 'tests/negative/roles.spec.js';
const A = 'tests/api/barcode-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const X = 'tests/positive/real-barcode.spec.js';

module.exports = [
  f('TC_PB_001', 'REQ-01', 'Generator', 'Page layout', 'Positive / UI', 'P0', BH, '-', ['Open the generator'], 'Subtitle, TYPE (BH / Audit), LOAN NUMBER, EMPLOYEE NAME, View Register, Generate barcode', G, '@smoke'),
  f('TC_PB_002', 'REQ-01', 'Type', 'Default type', 'Default value', 'P2', BH, '-', ['Read the Type radios'], 'BH (value New) selected', G),
  f('TC_PB_003', 'REQ-01', 'Employee Name', 'Logged-in user, read-only', 'Default value / Field state', 'P2', BH, '-', ['Read Employee Name'], 'Finsta Admin; not editable', G),
  f('TC_PB_004', 'REQ-02', 'Loan Number', 'BH list = loans not yet packeted', 'Data consistency', 'P0', BH, 'getloansforbarcode?Type=New', ['Open the list', 'Compare with API'], 'Same loans', G, '@smoke'),
  f('TC_PB_005', 'REQ-02', 'Loan Number', 'Audit list = loans in inventory', 'Data consistency', 'P1', BH, 'getloansforbarcode?Type=Audit', ['Select Audit', 'Compare'], 'Same loans', G),
  f('TC_PB_006', 'REQ-02', 'Type', 'Switch to Audit', 'Dependent field', 'P1', BH, 'Audit', ['Select Audit'], 'Hint "Loans that already have a packet in inventory"; different loan list', G),
  f('TC_PB_007', 'REQ-02', 'Loan Number', 'Option text', 'Dropdown', 'P3', BH, '-', ['Open the list'], 'Each option "GLNG… - applicant"', G),
  f('TC_PB_008', 'REQ-03', 'Generate', 'Generate without a loan', 'Required field', 'P0', BH, 'no loan', ['Generate barcode'], 'No preview, no Print sticker', G, '@smoke'),
  f('TC_PB_009', 'REQ-03', 'Preview', 'Preview content', 'Positive', 'P0', BH, 'first BH loan', ['Select loan', 'Generate'], '"Preview - not yet recorded"; branch, type BH, loan, employee; no barcode number yet', G, '@smoke'),
  f('TC_PB_010', 'REQ-03', 'Preview', 'Generate writes nothing', 'Persistence', 'P1', BH, '-', ['Select loan', 'Generate'], 'No POST/PUT sent', G),
  f('TC_PB_011', 'REQ-03', 'Preview', 'Preview after switching type (HYPOTHESIS)', 'Dependent field', 'P2', BH, 'BH → Audit', ['Generate BH preview', 'Select Audit'], 'BH preview cleared or changed to Audit', G),
  f('TC_PB_012', 'REQ-02', 'Loan Number', 'Type-ahead filter', 'Autocomplete', 'P2', BH, 'full loan no.', ['Type the loan number'], 'Only that loan listed', G),
  f('TC_PB_013', 'REQ-02', 'Loan Number', 'Unknown loan', 'Negative / Invalid selection', 'P1', BH, 'GLNG9999999999999', ['Type', 'Enter'], '"No items found"; nothing selected', V),
  f('TC_PB_014', 'REQ-02', 'Loan Number', 'Special characters', 'Special characters', 'P3', BH, `'"<script>%`, ['Type'], '"No items found"; no error', V),
  f('TC_PB_015', 'REQ-02', 'Loan Number', 'Clear (x)', 'Clear / Reset', 'P3', BH, '-', ['Select loan', 'Click x'], 'Loan cleared', V),
  f('TC_PB_016', 'REQ-04', 'Print sticker', 'BH print payload', 'API payload', 'P0', PV, 'BH', ['Print sticker'], 'One POST generatebarcode: pType New, loan, employee, branch', P, '@smoke'),
  f('TC_PB_017', 'REQ-04', 'Print sticker', 'Audit print payload', 'API payload', 'P1', `${PV} (type Audit)`, 'Audit', ['Print sticker'], 'pType Audit, loan', P),
  f('TC_PB_018', 'REQ-04', 'Print sticker', 'Success message (SIMULATED reply)', 'Positive', 'P1', PV, 'reply BH9999999999', ['Print sticker'], '"Recorded sticker BH9999999999"; "Barcode … recorded for loan …. It can only be used once."', P),
  f('TC_PB_019', 'REQ-04', 'Print sticker', 'Network failure', 'Error recovery', 'P1', PV, 'request aborted', ['Print sticker'], '"Could not record the barcode - nothing was printed"', P),
  f('TC_PB_020', 'REQ-04', 'Print sticker', 'Server error 500', 'Error recovery', 'P1', PV, 'HTTP 500', ['Print sticker'], 'Error shown, no success', P),
  f('TC_PB_021', 'REQ-04', 'Print sticker', 'Double click', 'Double submit', 'P1', PV, '-', ['Double-click Print sticker'], 'Only one request', P),
  f('TC_PB_022', 'REQ-05', 'One unused barcode', 'Loan already has an unused barcode', 'Business rule', 'P0', UN, '-', ['Generate'], '"already has an unused barcode"; Cancel old & generate new offered; no Print sticker', P),
  f('TC_PB_023', 'REQ-05', 'Cancel old & generate new', 'No reason', 'Required field', 'P1', UN, 'blank reason', ['Click Cancel old & generate new'], 'Nothing sent', P),
  f('TC_PB_024', 'REQ-05', 'Cancel old & generate new', 'With reason', 'API payload', 'P1', UN, 'reason text', ['Type reason', 'Click'], 'cancelbarcode with old barcode and the reason', P),
  f('TC_PB_025', 'REQ-05', 'One unused barcode', 'Live loan with an unused BH barcode', 'Business rule', 'P1', BH, 'Not Used BH loan from register', ['Select it', 'Generate'], 'Refused, no Print sticker', P),
  f('TC_PB_026', 'REQ-06', 'Register', 'Layout and columns', 'Navigation / UI', 'P0', RG, '-', ['View Register'], 'Barcode no., Type, Loan no., Applicant Name, Created by, Created date, Status, Remarks, Action', R, '@smoke'),
  f('TC_PB_027', 'REQ-06', 'Register', 'Total = API', 'Data consistency', 'P1', RG, 'getbarcoderegister', ['Compare'], 'Equal', R),
  f('TC_PB_028', 'REQ-06', 'Register', 'Rows = API', 'Data consistency', 'P1', RG, '-', ['Compare rows'], 'Barcode, loan, status equal', R),
  f('TC_PB_029', 'REQ-06', 'Register', 'Status options', 'Dropdown', 'P3', RG, '-', ['Open Status'], 'All statuses, Not Used, Used, Cancelled', R),
  f('TC_PB_030', 'REQ-06', 'Register', 'Filter Not Used', 'Filtering', 'P2', RG, 'Not Used', ['Select'], 'Only Not Used', R),
  f('TC_PB_031', 'REQ-06', 'Register', 'Filter Used', 'Filtering', 'P2', RG, 'Used', ['Select'], 'Only Used', R),
  f('TC_PB_032', 'REQ-06', 'Register', 'Filter Cancelled', 'Filtering', 'P2', RG, 'Cancelled', ['Select'], 'Only Cancelled', R),
  f('TC_PB_033', 'REQ-06', 'Register', 'Search by loan', 'Search', 'P2', RG, 'first row loan', ['Search'], 'Matching rows', R),
  f('TC_PB_034', 'REQ-06', 'Register', 'Search by barcode', 'Search', 'P2', RG, 'first row barcode', ['Search'], 'Matching rows', R),
  f('TC_PB_035', 'REQ-06', 'Register', 'Search by applicant', 'Search', 'P2', RG, 'first row applicant', ['Search'], 'Matching rows', R),
  f('TC_PB_036', 'REQ-06', 'Register', 'Search no match', 'Search / Negative', 'P3', RG, 'ZZNOMATCH999', ['Search'], 'No rows', R),
  f('TC_PB_037', 'REQ-07', 'Register', 'Cancel only on Not Used', 'Business rule', 'P0', RG, '-', ['Check Action column'], 'Cancel button only on Not Used rows', R),
  f('TC_PB_038', 'REQ-05', 'Barcode number', 'Format and uniqueness', 'Duplicate prevention', 'P1', RG, 'all records', ['Check numbers'], 'BH + 10 digits / AUD + 10 digits; no duplicates', R),
  f('TC_PB_039', 'REQ-05', 'One unused barcode', 'At most one Not Used BH per loan', 'Business rule / Data consistency', 'P1', RG, '-', ['Check records'], 'No loan has two', R),
  f('TC_PB_040', 'REQ-05', 'One packet per loan', 'At most one Used BH per loan (HYPOTHESIS)', 'Business rule / Data consistency', 'P2', RG, '-', ['Check records'], 'No loan has two', R),
  f('TC_PB_041', 'REQ-02', 'Loan Number', 'BH list excludes packeted loans', 'Business rule', 'P1', RG, '-', ['Compare BH list with Used BH barcodes'], 'No overlap', R),
  f('TC_PB_042', 'REQ-06', 'Register', 'Newest first', 'Sorting', 'P3', RG, '-', ['Read created dates'], 'Descending', R),
  f('TC_PB_043', 'REQ-06', 'Register', 'Paging', 'Pagination', 'P3', RG, '-', ['Next page'], '10 rows per page; page 2 different', R),
  f('TC_PB_044', 'REQ-07', 'Cancel dialog', 'Dialog content', 'Positive / UI', 'P2', DL, '-', ['Read dialog'], 'Barcode, type, loan; "permanently unusable"', R),
  f('TC_PB_045', 'REQ-07', 'Cancel dialog', 'No reason', 'Required field', 'P0', DL, 'blank', ['Confirm cancellation'], 'Nothing sent', R),
  f('TC_PB_046', 'REQ-07', 'Cancel dialog', 'Whitespace reason', 'Whitespace input', 'P1', DL, '5 spaces', ['Confirm cancellation'], 'Nothing sent', R),
  f('TC_PB_047', 'REQ-07', 'Cancel dialog', 'Cancel payload (SIMULATED reply)', 'API payload', 'P1', DL, 'reason text', ['Type reason', 'Confirm'], 'cancelbarcode with the barcode and reason', R),
  f('TC_PB_048', 'REQ-07', 'Cancel dialog', 'Back', 'Cancel', 'P2', DL, '-', ['Back'], 'Dialog closes; nothing sent', R),
  f('TC_PB_049', 'REQ-07', 'Cancel dialog', 'Network failure', 'Error recovery', 'P2', DL, 'aborted', ['Confirm'], 'Error, no success', R),
  f('TC_PB_050', 'REQ-08', 'Access', 'Internal appraiser menu', 'Role-based access', 'P0', 'INT_APPRAISER1 logged in', '-', ['Look for the menu entry'], 'Not available', N),
  f('TC_PB_051', 'REQ-08', 'Access', 'External appraiser menu', 'Role-based access', 'P1', 'EXT_APPRAISER1 logged in', '-', ['Look for the menu entry'], 'Not available', N),
  f('TC_PB_052', 'REQ-08', 'Access', 'Direct URL as appraiser', 'Role-based access', 'P0', 'INT_APPRAISER1 logged in', '#/Loans/GoldPacketBarcodeGenerate', ['Open URL'], 'No Generate barcode', N),
  f('TC_PB_053', 'REQ-09', 'API', 'Read APIs without token', 'API security', 'P0', BH, 'no Authorization', ['GET register / loans'], '401/403', A),
  f('TC_PB_054', 'REQ-09', 'API', 'generatebarcode without token', 'API security', 'P0', BH, 'fake loan, no Authorization', ['POST'], '401/403', A),
  f('TC_PB_055', 'REQ-09', 'API', 'Register Status filter', 'API', 'P2', RG, 'Status=Not Used/Used/Cancelled', ['GET each'], 'Only that status', A),
  f('TC_PB_056', 'REQ-08', 'API', 'Appraiser token reads loans list (HYPOTHESIS)', 'API security', 'P1', BH, 'INT_APPRAISER1 token', ['GET getloansforbarcode'], '401/403 or empty', A),
  f('TC_PB_057', 'REQ-10', 'UI', 'Tablet width', 'Responsive', 'P3', BH, '768px', ['Resize'], 'No horizontal scroll', U),
  f('TC_PB_058', 'REQ-10', 'UI', 'Generator field labels', 'Accessibility', 'P3', BH, '-', ['Check labels'], 'Type radios and Loan Number named', U),
  f('TC_PB_059', 'REQ-10', 'UI', 'Register search label', 'Accessibility', 'P3', RG, '-', ['Check label'], 'Search box named', U),
  f('TC_PB_060', 'REQ-04', 'Create (real)', 'Real BH print (ALLOW_DATA_CREATION=1)', 'Positive / Create', 'P0', `${BH} but writes allowed; AUTOTEST loan in BH list; ALLOW_DATA_CREATION=1`, 'AUTOTEST loan', ['Generate', 'Print sticker', 'Search register'], 'Barcode recorded, Not Used, type BH', X),
  f('TC_PB_061', 'REQ-07', 'Cancel (real)', 'Real cancel of TC_PB_060 barcode', 'Update / Cancel', 'P1', 'TC_PB_060 passed', 'reason "autotest clean-up"', ['Cancel', 'Reason', 'Confirm', 'Reload'], 'Status Cancelled; no Cancel button', X),

  { ...f('TC_PB_062', 'REQ-05', 'Audit limit', 'Audit barcodes up to the number of gold articles', 'Business rule', 'P2', '-', 'loan with N articles', ['Print N+1 Audit barcodes'], 'N+1th refused', null), status: 'NOT EXECUTED', reason: 'Needs N real permanent Audit barcodes on one loan; the limit message is unknown' },
  { ...f('TC_PB_063', 'REQ-07', 'Used at inventory', 'Barcode becomes Used when scanned at inventory, once only', 'Workflow', 'P1', '-', '-', ['Scan at Inventory'], 'Status Used; second scan refused', null), status: 'NOT EXECUTED', reason: 'Belongs to the Inventory form; needs a real barcode' },
  { ...f('TC_PB_064', 'REQ-04', 'Sticker', 'Printed size 2cm × 4cm, CODE128 scannable', 'Print output', 'P2', '-', '-', ['Print', 'Scan'], 'Scans correctly', null), status: 'NOT EXECUTED', reason: 'Needs a label printer and scanner – manual check' },
  { ...f('TC_PB_065', 'REQ-10', 'Session / concurrency / browser', 'Two Branch Heads print for the same loan; session timeout; Firefox/WebKit', 'Concurrency / Session / Browser', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'One Branch Head login; would create real barcodes; idle time unknown; Chromium only' },
  { ...f('TC_PB_NA1', '-', 'Edit / Delete', 'Edit or delete a barcode', 'CRUD', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No edit or delete; Cancel (TC_PB_044–049) is the only change allowed' },
  { ...f('TC_PB_NA2', '-', 'Text fields', 'Min/max length, data type of typed fields', 'Field length', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'Only typed field is the cancel reason; no limit shown' },
  { ...f('TC_PB_NA3', '-', 'Database', 'DB verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access; persistence checked through the register and API' },
  { ...f('TC_PB_NA4', '-', 'File upload', 'Upload', 'File upload', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'The screen has no upload' },
];
