// Gold Scheme Matrix: report configuration + steps / expected results (used by qmetry-report.js with QMETRY_SUITE=scheme)
const { TYPES } = require('../utils/qmetry-meta');

const NOT_SAVED = 'No success message is shown and the scheme does not appear in the Scheme Matrix grid.';
const C = (steps, expected) => ({ steps, expected });

const CFG = {
  cycle: 'Gold Scheme Matrix – Functional',
  subtitle: 'Gold Scheme Matrix – Functional Test Cycle · Gold Flow Entry',
  role: 'Checker / BH (admin)',
  spec: 'GoldScheme/tests/gold-scheme-functional.spec.js',
  pre: 'Logged in as Checker / BH (admin); Loans > Gold > Gold Loan Configuration > Gold Scheme Matrix is open.',
};

const COV = {
  CREATE_01: C(['Click New Scheme', 'Select loan New Gold (GLNG); enter code, name, tenure 9, type Bullet, rate 18', 'Click Apply to all slabs', 'Click Save Scheme'], 'Success message; the grid shows the scheme with 9 mo and 18.00%.'),
  READ_01: C(['Log in fresh and open the Scheme Matrix', 'Find the saved scheme row'], 'Row shows code, name, tenure, type, interest %, paise/mo and three internal LTV slab values.'),
  UPDATE_01: C(['Click Edit on the scheme', 'Change the rate to 12 and Apply to all slabs', 'Click Save Scheme'], 'Row shows 12.00% and 1.00 paise/month.'),
  UPDATE_02: C(['Click the Scheme-on toggle of the scheme', 'Reload the page', 'Read the toggle state', 'Toggle back'], 'The toggle state is changed and persists after reload.'),
  CANCEL_01: C(['Click New Scheme and fill the form', 'Navigate back to the Scheme Matrix without saving'], 'No scheme with that code appears in the grid.'),
  DELETE_01: C(['Click Delete on the created scheme', 'Confirm if asked'], 'The scheme is removed from the grid.'),
  DELETE_02: C(['Click Delete on the scheme created during error recovery', 'Confirm if asked'], 'The scheme is removed from the grid.'),
  REQUIRED_01: C(['Click New Scheme', 'Click Save Scheme without filling anything'], 'Message "Please fill all mandatory fields, including the aligned Loan".'),
  REQUIRED_02: C(['Fill every field except Scheme Code', 'Click Save Scheme'], NOT_SAVED),
  INPUT_01: C(['Type "abc" key by key into Interest %', 'Type "xy" key by key into Tenure'], 'Letters are not accepted in either field.'),
  BOUNDARY_01: C(['Fill the form with Tenure 0', 'Click Save Scheme'], NOT_SAVED),
  BOUNDARY_02: C(['Fill the form with Interest 150%', 'Click Save Scheme'], NOT_SAVED),
  DEFAULT_01: C(['Click New Scheme', 'Read the default values'], 'Tenure 3, type Bullet, Interest 0, Effective From = today, status Active.'),
  DATE_01: C(['Click New Scheme', 'Open the Effective From calendar', 'Pick the same date one year ago'], 'The back date is accepted and shown in the field.'),
  BUSINESS_01: C(['Enter the interest rate', 'Click Apply to all slabs', 'Read the slab rows'], 'Every slab shows the rate and rate/12 paise per month.'),
  BUSINESS_02: C(['Click Add Slab'], 'A slab row is added to the table.'),
  CONSISTENCY_01: C(['Click Edit on the saved scheme', 'Read the form values'], 'Name, tenure, rate and type equal what was saved.'),
  DUPLICATE_01: C(['Create a scheme with the same code and tenure as an existing scheme', 'Click Save Scheme'], 'Only one row exists for that scheme code.'),
  SEARCH_01: C(['Look for a search box on the Scheme Matrix'], 'Not applicable: the grid has no search box.'),
  FILTER_01: C(['Look for column filters on the grid'], 'Not applicable: no column filters.'),
  SORT_01: C(['Click the Tenure column header', 'Read the tenure values'], 'Rows are ordered ascending or descending by tenure.'),
  PAGINATION_01: C(['Read the pager summary', 'Open the next page if there is one'], 'Summary "x - y of z items" matches the rows; page 2 opens.'),
  CLEAR_01: C(['Look for a Clear / Reset button on the form'], 'Not applicable: the form has no Clear / Reset.'),
  NAV_01: C(['Open the Scheme Matrix', 'Click New Scheme', 'Return to the Scheme Matrix'], 'Form opens; the grid with all column headers shows again.'),
  ROLE_01: C(['Log in as each configured role', 'Open the Scheme Matrix URL'], 'Checker / BH can open it; other roles are recorded in the notes.'),
  WORKFLOW_01: C(['Look for an approval step after saving a scheme'], 'Not applicable: schemes go live when saved; there is no approval.'),
  API_01: C(['Record POST / PUT / DELETE calls while creating and editing'], 'All requests returned a 2xx status.'),
  ERROR_01: C(['Save with Scheme Name empty', 'Fill the name and double-click Save Scheme', 'Count rows with that code'], 'First save is rejected; second saves exactly one scheme.'),
  FILE_01: C(['Look for import / export / upload controls'], 'Not applicable: none on the Scheme Matrix.'),
  A11Y_01: C(['Open New Scheme at 390x844 (phone)', 'Press Tab from Scheme Code'], 'No horizontal scroll; focus moves to the next field.'),
  SESSION_01: C(['In a fresh browser with no login, open the Scheme Matrix URL'], 'The Scheme Matrix is not shown.'),
  LENGTH_01: C(['Read maxlength of Scheme Code and Scheme Name'], 'Both fields enforce a maximum length.'),
};

module.exports = { TYPES, F_TYPE: {}, COV, CFG };
