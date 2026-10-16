// Test case inventory for the Inventory Form (single source for the reports).
const M = 'Inventory Form';
const S = 'Inventory Form / View';
const BH = 'Branch Head (CHECKER_BH) logged in; Loans → Gold → Inventory Form open; every write blocked';
const RD = `${BH}; loan selected that is offered and has an unused BH barcode (live data)`;
const BD = `${RD}; its barcode scanned and bound; photo upload SIMULATED`;
const AD = `${BD}; vault / safe / free locker chosen; Add clicked`;
const VW = `${BH}; View clicked (saved inventories)`;

const f = (id, req, feature, scenario, type, priority, pre, data, steps, expected, script, tags = '') =>
  ({ id, req, module: M, screen: S, feature, scenario, type, priority, pre, data, steps, expected, script, tags });
const F = 'tests/functional/form.spec.js';
const C = 'tests/validation/scan.spec.js';
const B = 'tests/business-rules/add-save.spec.js';
const W = 'tests/functional/view.spec.js';
const N = 'tests/negative/roles.spec.js';
const A = 'tests/api/inventory-api.spec.js';
const U = 'tests/regression/ui.spec.js';
const X = 'tests/positive/real-inventory.spec.js';

module.exports = [
  f('TC_IF_001', 'REQ-01', 'Form', 'Layout', 'Positive / UI', 'P0', BH, '-', ['Open Inventory Form'], 'Trans Date, Loan Type, Loan, Collateral, Barcode/Packet No, Packet Photo, Vault, Vault Code, Safe, Locker, Remarks, Add', F, '@smoke'),
  f('TC_IF_002', 'REQ-01', 'Trans Date', 'Today, read-only', 'Default value / Date', 'P1', BH, '-', ['Read Trans Date'], "Today's date, not editable", F),
  f('TC_IF_003', 'REQ-01', 'Loan Type', 'Options', 'Dropdown', 'P3', BH, '-', ['Open Loan Type'], 'Gold Loan', F),
  f('TC_IF_004', 'REQ-02', 'Loan', 'Loan list = API', 'Data consistency', 'P0', BH, 'GetApplicantionid formname=INVENTORY', ['Gold Loan', 'Open loan list'], 'Same loans', F, '@smoke'),
  f('TC_IF_005', 'REQ-02', 'Loan', 'Loans already in inventory not offered', 'Business rule / Duplicate prevention', 'P0', BH, 'getloaninventory', ['Compare'], 'No overlap', F),
  f('TC_IF_006', 'REQ-02', 'Customer', 'Customer, mobile, loan no.', 'Data consistency', 'P1', RD, 'GetGLDetailsById', ['Select loan'], '= API', F),
  f('TC_IF_007', 'REQ-02', 'Collateral', 'Articles with weights, no packet', 'Read', 'P1', RD, '-', ['Select loan'], 'Each row: article, gross, pure net, "-"', F),
  f('TC_IF_008', 'REQ-05', 'Save', 'No Save / Clear before Add', 'Field state', 'P2', RD, '-', ['Select loan'], 'Save and Clear hidden', F),
  f('TC_IF_009', 'REQ-04', 'Vault', 'Vault list = active vaults', 'Data consistency / Dropdown', 'P2', BH, 'getvaultconfiguration', ['Open Vault'], 'Same vaults', F),
  f('TC_IF_010', 'REQ-04', 'Vault', 'Vault code and its safes', 'Dependent field', 'P1', BH, 'first vault with a safe', ['Choose vault'], 'Vault Code = API; Safe list = its cabinets', F),
  f('TC_IF_011', 'REQ-04', 'Vault', 'Before a vault is chosen', 'Field state', 'P3', BH, '-', ['Read'], 'Vault Code read-only; no safes', F),
  f('TC_IF_012', 'REQ-04', 'Locker', 'Free lockers only', 'Dependent field / Business rule', 'P1', BH, 'getavailablelockerdetails', ['Choose vault and safe'], 'Locker list = free lockers within the safe range', F),
  f('TC_IF_013', 'REQ-03', 'Scan', 'Unknown BH barcode', 'Negative', 'P0', RD, 'BH9999999999', ['Scan', 'Enter'], '"This is not a recognised barcode. Generate one from the Gold Packet Barcode menu first."', C, '@smoke'),
  f('TC_IF_014', 'REQ-03', 'Scan', 'Random text', 'Data type / Format', 'P1', RD, 'XYZ123', ['Scan'], 'Not recognised; not bound', C),
  f('TC_IF_015', 'REQ-03', 'Scan', 'Special characters', 'Special characters', 'P3', RD, `BH'"<x>%`, ['Scan'], 'Not bound; no error', C),
  f('TC_IF_016', 'REQ-03', 'Scan', 'Barcode of another loan', 'Business rule', 'P0', RD, 'unused barcode of another loan', ['Scan'], '"This barcode was generated for loan … and cannot be used on a different loan."', C),
  f('TC_IF_017', 'REQ-03', 'Scan', 'Cancelled barcode', 'Business rule', 'P1', RD, 'Cancelled barcode', ['Scan'], '"This barcode is already "Cancelled" and cannot be used again."', C),
  f('TC_IF_018', 'REQ-03', 'Scan', 'Used barcode', 'Duplicate prevention', 'P0', RD, 'Used BH barcode', ['Scan'], 'Refused ("Already Exist Packet Number")', C),
  f('TC_IF_019', 'REQ-03', 'Scan', "Loan's own unused barcode", 'Positive', 'P0', RD, 'its Not Used BH barcode', ['Scan'], '"Barcode valid - matches loan …"; Packet No filled', C, '@smoke'),
  f('TC_IF_020', 'REQ-03', 'Bind', 'Empty scan box (HYPOTHESIS)', 'Required field', 'P2', RD, 'empty', ['Bind To Packet No'], 'A message asks for the barcode', C),
  f('TC_IF_021', 'REQ-03', 'Bind', 'Bind button = Enter', 'Positive', 'P2', RD, 'own barcode', ['Type', 'Bind To Packet No'], 'Packet No filled', C),
  f('TC_IF_022', 'REQ-03', 'Scan', 'Audit barcode as packet (HYPOTHESIS)', 'Business rule', 'P2', RD, 'unused Audit barcode', ['Scan'], 'Not bound', C),
  f('TC_IF_023', 'REQ-04', 'Add', 'No photo', 'Required field', 'P0', `${BD.replace('; photo upload SIMULATED', '')}; storage chosen, no photo`, '-', ['Add'], '"Capture the packet photo with the barcode before adding"', B, '@smoke'),
  f('TC_IF_024', 'REQ-04', 'Add', 'No vault', 'Required field', 'P1', BD, '-', ['Add'], '"Enter Vault Name"', B),
  f('TC_IF_025', 'REQ-04', 'Add', 'No safe', 'Required field', 'P1', `${BD}; vault chosen`, '-', ['Add'], 'Safe asked for', B),
  f('TC_IF_026', 'REQ-04', 'Add', 'No locker', 'Required field', 'P1', `${BD}; vault and safe chosen`, '-', ['Add'], 'Locker asked for', B),
  f('TC_IF_027', 'REQ-03', 'Add', 'No barcode', 'Required field', 'P1', RD, '-', ['Add'], '"Enter Packet Number"', B),
  f('TC_IF_028', 'REQ-03', 'Add', 'Typed packet number (HYPOTHESIS)', 'Business rule / Negative', 'P1', RD, 'MANUAL123 typed in Packet No', ['Photo, storage', 'Add'], 'Not added', B),
  f('TC_IF_029', 'REQ-04', 'Photo', 'Upload failure', 'Error recovery', 'P2', RD, 'upload blocked', ['Choose photo'], '"Could not upload the packet photo. Please try again."', B),
  f('TC_IF_030', 'REQ-04', 'Photo', 'PNG/JPEG only', 'File upload', 'P2', BD, '.txt file', ['Choose file'], 'accept="image/png,image/jpeg"; no upload of a .txt', B),
  f('TC_IF_031', 'REQ-04', 'Add', 'Packet bound to collateral', 'Positive', 'P0', AD, '-', ['Read collateral'], 'Every row shows the packet number; Save and Clear shown', B, '@smoke'),
  f('TC_IF_032', 'REQ-05', 'Save', 'Save payload (SIMULATED reply)', 'API payload / Persistence', 'P0', AD, 'remarks', ['Remarks', 'Save'], 'One saveloaninventory: loan, CREATE, remarks; each article packet, vault, safe, locker, code, photo path', B, '@smoke'),
  f('TC_IF_033', 'REQ-05', 'Save', 'Weights sent = weights shown', 'Calculation / Data consistency', 'P1', AD, '-', ['Save'], 'Gross and pure net equal', B),
  f('TC_IF_034', 'REQ-05', 'Save', 'No remarks (HYPOTHESIS)', 'Required field', 'P1', AD, 'blank remarks', ['Save'], 'Nothing sent and a message asks for remarks', B),
  f('TC_IF_035', 'REQ-05', 'Remarks', 'Max 300', 'Max length', 'P3', BH, '320 chars', ['Type'], '300 kept', B),
  f('TC_IF_036', 'REQ-05', 'Save', 'Success message (SIMULATED reply)', 'Positive', 'P1', AD, 'reply true', ['Save'], 'Success shown', B),
  f('TC_IF_037', 'REQ-05', 'Save', 'Network failure', 'Error recovery', 'P1', AD, 'aborted', ['Save'], 'Error, no success', B),
  f('TC_IF_038', 'REQ-05', 'Save', 'Server error 500', 'Error recovery', 'P1', AD, 'HTTP 500', ['Save'], 'No success', B),
  f('TC_IF_039', 'REQ-05', 'Save', 'Double click', 'Double submit', 'P1', AD, '-', ['Double-click Save'], 'One request', B),
  f('TC_IF_040', 'REQ-05', 'Clear', 'Clear resets', 'Clear / Reset', 'P2', AD, 'remarks typed', ['Clear'], 'Packet, vault code, remarks empty; packet removed from rows', B),
  f('TC_IF_041', 'REQ-06', 'View', 'Layout', 'Navigation / UI', 'P0', VW, '-', ['View'], 'Applicant, Loan, Inventory Number, Trans Date, G.WT, Pure N.WT, Remarks, No of Items, Actions', W, '@smoke'),
  f('TC_IF_042', 'REQ-06', 'View', 'Total and rows = API', 'Data consistency', 'P1', VW, 'getloaninventory', ['Compare'], 'Equal', W),
  f('TC_IF_043', 'REQ-06', 'View', 'INV numbers unique; one inventory per loan', 'Duplicate prevention', 'P1', VW, '-', ['Check'], 'INV + 10 digits, no duplicates, no loan twice', W),
  f('TC_IF_044', 'REQ-03', 'Barcode lifecycle', 'Saved inventory → its BH barcode is Used', 'Persistence / Workflow', 'P0', BH, 'inventories since 01 Oct', ['Compare with register'], 'Each loan has a Used BH barcode', W),
  f('TC_IF_045', 'REQ-06', 'View', 'Newest first', 'Sorting', 'P3', VW, '-', ['Read'], 'Descending inventory number', W),
  f('TC_IF_046', 'REQ-06', 'View', 'Paging', 'Pagination', 'P3', VW, '-', ['Next page'], '10 rows; page 2 different', W),
  f('TC_IF_047', 'REQ-06', 'View', 'Totals row', 'Calculation', 'P2', VW, '-', ['Read totals'], '= sum of article gross / pure net weights', W),
  f('TC_IF_048', 'REQ-06', 'View', 'New', 'Navigation', 'P3', VW, '-', ['New'], 'Empty Inventory Form', W),
  f('TC_IF_049', 'REQ-07', 'Access', 'Internal appraiser menu', 'Role-based access', 'P0', 'INT_APPRAISER1 logged in', '-', ['Look for the menu entry'], 'Not available', N),
  f('TC_IF_050', 'REQ-07', 'Access', 'External appraiser menu', 'Role-based access', 'P1', 'EXT_APPRAISER1 logged in', '-', ['Look for the menu entry'], 'Not available', N),
  f('TC_IF_051', 'REQ-07', 'Access', 'Direct URL as appraiser', 'Role-based access', 'P0', 'INT_APPRAISER1 logged in', '#/Loans/InventoryForm', ['Open URL', 'Open loan list'], 'Form not shown or no loans', N),
  f('TC_IF_052', 'REQ-08', 'API', 'Read APIs without token', 'API security', 'P0', BH, 'no Authorization', ['GET loans / inventories / barcode details'], '401/403', A),
  f('TC_IF_053', 'REQ-08', 'API', 'saveloaninventory without token', 'API security', 'P0', BH, 'fake loan, no Authorization', ['POST'], '401/403', A),
  f('TC_IF_054', 'REQ-03', 'API', 'Barcode details = register', 'API / Data consistency', 'P2', BH, 'ready barcode', ['GET getbarcodedetails, getcheckpacketnumber'], 'Same loan, Not Used, New; packet not used', A),
  f('TC_IF_055', 'REQ-07', 'API', 'Appraiser token reads inventory loans (HYPOTHESIS)', 'API security', 'P1', BH, 'INT_APPRAISER1 token', ['GET GetApplicantionid INVENTORY'], '401/403 or empty', A),
  f('TC_IF_056', 'REQ-09', 'UI', 'Tablet width', 'Responsive', 'P3', BH, '768px', ['Resize'], 'No horizontal scroll', U),
  f('TC_IF_057', 'REQ-09', 'UI', 'Field labels', 'Accessibility', 'P3', BH, '-', ['Check labels'], 'All fields named', U),
  { ...f('TC_IF_058', 'REQ-09', 'Session', 'Idle timeout warning', 'Session timeout', 'P2', BH, 'idle', ['Wait', 'Stay Logged In'], 'Warning "logged out in N seconds due to inactivity"; form stays open', null), status: 'NOT EXECUTED', reason: 'Warning (#idleWarningModal) is in the page but did not appear in 6 idle minutes; idle time unknown – check by hand' },
  f('TC_IF_059', 'REQ-05', 'Create (real)', 'Real save (ALLOW_DATA_CREATION=1)', 'Positive / Create', 'P0', `${BH} but writes allowed; AUTOTEST loan with an unused BH barcode; ALLOW_DATA_CREATION=1`, 'AUTOTEST loan, real photo, AUTOTEST vault', ['Bind', 'Photo', 'Storage', 'Add', 'Remarks', 'Save'], 'Success; barcode becomes Used', X),
  f('TC_IF_060', 'REQ-02', 'Create (real)', 'After real save', 'Persistence / Workflow', 'P0', 'TC_IF_059 passed', '-', ['Reopen loan list', 'View'], 'Loan no longer offered; shown in View', X),

  { ...f('TC_IF_061', 'REQ-04', 'Partial packets', 'Bind only some articles / several packets per loan', 'Business rule', 'P2', '-', 'loan with 2+ articles', ['Tick some', 'Bind', 'Add', 'Repeat'], '-', null), status: 'NOT EXECUTED', reason: 'Rule unknown and needs a real save; the only ready AUTOTEST loans have 1 article' },
  { ...f('TC_IF_062', 'REQ-04', 'Locker', 'Same locker chosen by two users at once', 'Concurrency', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'One Branch Head login; needs two real saves' },
  { ...f('TC_IF_063', 'REQ-04', 'Photo', 'Camera capture of the packet', 'File upload / Device', 'P3', '-', '-', ['Capture'], '-', null), status: 'NOT EXECUTED', reason: 'Needs a camera – manual check' },
  { ...f('TC_IF_064', 'REQ-09', 'Browser', 'Firefox / WebKit', 'Browser compatibility', 'P3', '-', '-', ['-'], '-', null), status: 'NOT EXECUTED', reason: 'Chromium only' },
  { ...f('TC_IF_NA1', '-', 'Edit / Delete', 'Edit or delete a saved inventory', 'CRUD', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'View has no edit or delete; release is a separate form (Gold Release)' },
  { ...f('TC_IF_NA2', '-', 'Search / filter', 'Search the View list', 'Search', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'View has no search or filter box' },
  { ...f('TC_IF_NA3', '-', 'Database', 'DB verification', 'Persistence', 'P3', '-', '-', ['-'], '-', null), status: 'N/A', reason: 'No DB access; persistence checked through View and the barcode register' },
];
