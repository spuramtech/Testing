// Gold Estimate Slab Configuration: report configuration + steps / expected results (QMETRY_SUITE=slab)
const { TYPES } = require('../utils/qmetry-meta');

const C = (steps, expected) => ({ steps, expected });
const NO_SEND = 'No save request leaves the browser.';
const REJECTED = 'The slab is not saved (no "Slab saved." message) and no extra row appears in the list.';

const CFG = {
  cycle: 'Gold Estimate Slab Configuration - Functional',
  subtitle: 'Gold Estimate Slab Configuration ("Gold Slab Config") - Functional Test Cycle · Gold Flow Entry',
  role: 'Checker / BH (admin)',
  spec: 'GoldSlabConfig/tests/gold-slab-config-functional.spec.js',
  pre: 'Logged in as Checker / BH (admin); Loans > Gold > Gold Loan Configuration > Estimate Approval Slabs is open. The 5 real slabs are never edited; test slabs are created only above 10 crore and removed again.',
};

const OPEN_ADD = ['Click Add Slab'];

const COV = {
  CREATE_01: C([...OPEN_ADD, 'Enter From 10,00,00,001, To 10,10,00,000, Internal 2, External 1', 'Click Save'], '"Slab saved." is shown and the slab appears in the list with those values.'),
  READ_01: C(['Read the slab list'], 'The first slab starts at 0; every slab has internal 1 or 2 and external 0 to 2; external is above 0 only with 2 internal.'),
  READ_02: C(['Log in fresh and open the slab screen'], 'The slab created earlier is listed with the same values.'),
  READ_03: C(['Read the existing slabs'], 'Each slab starts at the previous To Amount + 1.'),
  READ_04: C(['Read the last real slab'], 'It ends at 10,00,00,000 (the premise for the test range above 10 crore).'),
  UPDATE_01: C(['Click Edit on the test slab', 'Change External to 2', 'Click Save'], 'The slab is saved and the list shows External 2.'),
  UPDATE_02: C(['Click Edit on the test slab', 'Change To Amount to 10,20,00,000', 'Click Save'], 'The slab is saved and the list shows the new To Amount.'),
  CANCEL_01: C([...OPEN_ADD, 'Fill the form', 'Click Cancel'], 'The form closes and no row is added.'),
  CANCEL_02: C(['Click Edit on the test slab', 'Change External', 'Click Cancel'], 'The slab is unchanged.'),
  CANCEL_03: C(['Click Delete on the test slab', 'Answer No to "Delete this slab?"'], 'The slab stays and no delete request is sent.'),
  DELETE_01: C(['Click Delete on the test slab', 'Answer Yes'], 'The confirmation text is shown, a delete request is sent and the slab disappears.'),
  DELETE_02: C(['After the whole run read the slab list'], 'The 5 real slabs are exactly as before and no test slab is left.'),
  REQUIRED_01: C([...OPEN_ADD, 'Click Save with an empty form'], '"From Amount is required." is shown. ' + NO_SEND),
  REQUIRED_02: C([...OPEN_ADD, 'Enter only a To Amount', 'Click Save'], '"From Amount is required." is shown. ' + NO_SEND),
  INPUT_01: C([...OPEN_ADD, 'Type letters and symbols into From and To'], 'Only digits remain.'),
  INPUT_02: C([...OPEN_ADD, 'Type 1,00,000 into From'], 'The field holds 100000.'),
  INPUT_03: C([...OPEN_ADD, 'Type spaces into From', 'Click Save'], '"From Amount is required." is shown. ' + NO_SEND),
  INPUT_04: C([...OPEN_ADD, 'Type script / SQL text into From'], 'Only digits remain (nothing is run).'),
  INPUT_05: C([...OPEN_ADD, 'Type non-Latin digits into From'], 'Only Latin digits are kept.'),
  BOUNDARY_01: C([...OPEN_ADD, 'Enter From 900 and To 100', 'Click Save'], '"To Amount (inclusive) cannot be less than From Amount." ' + NO_SEND),
  BOUNDARY_02: C([...OPEN_ADD, 'Enter From = To = one amount after slab A', 'Click Save'], 'The one-amount slab is saved and listed.'),
  BOUNDARY_03: C([...OPEN_ADD, 'Enter From = the To Amount of slab A (overlap by one)', 'Click Save'], REJECTED),
  BOUNDARY_04: C([...OPEN_ADD, 'Enter a range inside slab A', 'Click Save'], REJECTED),
  BOUNDARY_05: C([...OPEN_ADD, 'Enter From = To of slab A + 2 (a gap of one amount)', 'Click Save'], REJECTED + ' (the help text says to start at To + 1).'),
  BOUNDARY_06: C([...OPEN_ADD, 'Enter From = To of slab A + 1 and leave To blank', 'Click Save'], 'An open-ended top slab is saved (To shown blank / no limit).'),
  DEFAULT_01: C(OPEN_ADD, 'From and To are empty, Internal 1, External 0 and External is disabled.'),
  DATE_01: C(['Look for date fields'], 'Not applicable: the screen has no dates.'),
  BUSINESS_01: C([...OPEN_ADD, 'Choose Internal 1, then Internal 2'], 'External is disabled with 1 Internal and enabled with 2.'),
  BUSINESS_02: C([...OPEN_ADD, 'Read the Internal and External options'], 'Internal offers 1, 2; External offers 0, 1, 2.'),
  BUSINESS_03: C([...OPEN_ADD, 'Choose Internal 2 and External 2', 'Change Internal back to 1'], 'External resets to 0.'),
  CONSISTENCY_01: C(['Read every amount in the list'], 'Amounts use Indian digit grouping.'),
  CONSISTENCY_02: C(['Click Edit on the test slab', 'Read the form'], 'The form shows the values listed in the grid.'),
  CONSISTENCY_03: C(['Open the Summary page of the saved estimate', 'Read its value and the stages required', 'Find the slab the value falls in'], 'Stages required = that slab\'s Internal + External count.'),
  DUPLICATE_01: C([...OPEN_ADD, 'Enter exactly the range of slab A', 'Click Save'], 'Rejected; only one slab with that From Amount exists.'),
  DUPLICATE_02: C([...OPEN_ADD, 'Enter the From Amount of slab A with another To Amount', 'Click Save'], 'Rejected; only one slab with that From Amount exists.'),
  SEARCH_01: C(['Look for a search box'], 'Not applicable.'),
  FILTER_01: C(['Look for filters'], 'Not applicable.'),
  SORT_01: C(['Look for sortable headers'], 'Not applicable.'),
  PAGINATION_01: C(['Look for a pager'], 'Not applicable.'),
  WORKFLOW_01: C(['Look for an approval step'], 'Not applicable: slab changes are effective at once.'),
  FILE_01: C(['Look for import / export'], 'Not applicable.'),
  CLEAR_01: C([...OPEN_ADD, 'Fill the form', 'Click Cancel', 'Click Add Slab again'], 'The form is empty again with Internal 1 and External 0.'),
  NAV_01: C(['Read the breadcrumb', 'Click Overview'], 'The breadcrumb shows Appraisal & Pre-Estimate Setup > Estimate Approval Slabs; Overview shows the Gold Loan Configuration tiles.'),
  NAV_02: C(['Click the browser Back button'], 'The slab screen is left.'),
  ROLE_01: C(['Log in as Internal Appraiser 1 / 2 and Auditor', 'Open the slab screen', 'Check for Add Slab'], 'Internal Appraiser 1 cannot add slabs; every role\'s access is recorded in the notes.'),
  API_01: C(['Reload the slab screen', 'Read the list API response'], '200 with JSON that contains the real slabs.'),
  API_02: C(['Read the save request made by CREATE_01'], '200; the body contains the entered amounts and counts.'),
  API_03: C(['Call the list API URL without any login'], 'Refused (401 / 403) or no slab data returned.'),
  API_04: C(['Read the save URL of CREATE_01'], 'Recorded: the URL carries the user id (createdby); whether the server ignores a changed value was not tested.'),
  API_05: C(['Send invalid slabs straight to the save API'], 'NOT EXECUTED: needs the login token.'),
  ERROR_01: C([...OPEN_ADD, 'Enter an overlapping range, Save (rejected)', 'Enter a valid range and double-click Save'], 'First is rejected; the valid range creates exactly one slab.'),
  ERROR_02: C([...OPEN_ADD, 'Fill the form', 'Click Save with the network call aborted'], 'No success message; the form keeps its values.'),
  A11Y_01: C(['Open the screen at 390 x 844'], 'No horizontal scroll.'),
  A11Y_02: C([...OPEN_ADD, 'Check each control for an accessible name'], 'Every field and button has a label, title, placeholder or text.'),
  A11Y_03: C(['Open the screen at 768 x 1024'], 'No horizontal scroll.'),
  A11Y_04: C(['Run the screen in Firefox and WebKit'], 'NOT EXECUTED: only Chromium is installed.'),
  SESSION_01: C(['In a fresh browser without login open the slab URL'], 'The slabs are not shown.'),
  SESSION_02: C(['Stay idle on the slab screen for up to 5 minutes', 'Watch for an inactivity warning or a logout'], 'Behaviour recorded in the notes (warning, logout or neither within 5 minutes).'),
  SESSION_03: C([...OPEN_ADD, 'Fill the form', 'Clear browser storage and cookies', 'Click Save (call aborted)'], 'Behaviour recorded in the notes.'),
  SESSION_04: C(['Double-click Add Slab'], 'One form opens.'),
  SESSION_05: C(['Two users save overlapping slabs at the same time'], 'NOT EXECUTED: too risky on the live configuration.'),
  LENGTH_01: C([...OPEN_ADD, 'Read maxlength of From and To'], 'Both fields have a maximum length.'),
  LENGTH_02: C([...OPEN_ADD, 'Type 25 digits into From'], 'At most 16 digits are kept.'),
};

module.exports = { TYPES, F_TYPE: {}, COV, CFG, REQS: require('./requirements').REQS };
