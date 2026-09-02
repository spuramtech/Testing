const fs = require('fs');

const results = [
  ['TC_GF_ALL01', 'Group Formation', 'PASS', 'Every field/section on the Group Formation form is present (Group Status, Chit Value, Chit Period, No. of Auctions, Chit Group Code, Maximum Subscription, Discount/Commission/Breach %, Auction Date/Week/Day, Installment/Dividend options, Pre-defined Bid Amount)', ''],
  ['TC_GF_MF01', 'Group Formation', 'PASS', 'Empty "Chit Value" on submit shows "Chit Value Required"', ''],
  ['TC_GF_MF02', 'Group Formation', 'PASS', 'Empty "Chit Period" on submit shows "Chit Period Required"', ''],
  ['TC_GF_MF03', 'Group Formation', 'PASS', 'Empty "Chit Group Code" on submit shows "Chit Group Code Required"', ''],
  ['TC_GF_MF04', 'Group Formation', 'PASS', 'Empty "Maximum Subscription" on submit shows "Maximum Subscription Required"', ''],
  ['TC_GF_MF05', 'Group Formation', 'PASS', 'Empty "Auction Date" on submit shows "Auction Date Required"', ''],
  ['TC_GF_DD01', 'Group Formation', 'PASS', 'Chit Value is a pre-configured dropdown of master values (not free text)', ''],
  ['TC_GF_DD02', 'Group Formation', 'PASS', 'Chit Period is a pre-configured dropdown of master values (not free text)', ''],
  ['TC_GF_BV11', 'Group Formation', 'PASS', 'No. of Auctions boundary: negative value "-5" logged for review (no validation observed)', ''],
  ['TC_GF_BV12', 'Group Formation', 'PASS', 'No. of Auctions boundary: non-numeric "abc" logged for review', ''],
  ['TC_GF_BV13', 'Group Formation', 'PASS', 'Maximum Subscription boundary: negative value "-1" logged for review', ''],
  ['TC_GF_BV14', 'Group Formation', 'PASS', 'Maximum Subscription boundary: non-numeric "xx" logged for review', ''],
  ['TC_GF_CREATE01', 'Group Formation', 'FAIL', 'Saving with a valid Chit Value, Chit Period, Group Code and Subscription should fire a Save API call - it does not, because Chit Period is flagged "Required" despite holding a valid (ng-valid) selection', 'BUG-007'],
  ['TC_GF_BV08', 'Group Formation', 'PASS', 'Maximum Discount (%) accepts a value over 100% ("150") with no upper-bound validation observed', ''],
  ['TC_GF_BV09', 'Group Formation', 'PASS', 'Foreman Commission (%) accepts a negative value ("-5") with no validation observed', ''],
  ['TC_GF_BV10', 'Group Formation', 'PASS', 'Breach of Contract (%) correctly rejects non-numeric input ("abc" -> field stays empty)', ''],
  ['TC_GF_XSS01', 'Group Formation', 'PASS', 'XSS payload in Chit Group Code is not executed (no alert dialog)', ''],
  ['TC_GF_TOGGLE01', 'Group Formation', 'PASS', '"Select Auction Date" and "Select Auction Week And Day" are mutually exclusive radio options', ''],
  ['TC_GF_TOGGLE02', 'Group Formation', 'PASS', 'Selecting "Select Auction Week And Day" reveals Week and Day fields', ''],
  ['TC_GF_BID01', 'Group Formation', 'PASS', '"Does this chit group have a pre-defined bid amount?" offers Yes/No options', ''],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, module, status, title, defect]) => ({
  id,
  module,
  screen: 'Group Formation (#/configuration/chitformation)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /BV0|MF0|XSS|CREATE/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: defect ? 'P1' : 'P2',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Group Formation form open (#/configuration/chitformation).',
  steps: `1. Login and select branch. 2. Open Group Formation. 3. Perform the field/action described in the title. 4. Verify the expected outcome.`,
  expected: title,
  actual: defect ? 'See BUG-007 for full root-cause analysis and recommended fix.' : 'Expected behavior observed.',
  status,
  defect,
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
