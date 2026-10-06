const fs = require('fs');

const results = [
  ['TC_GC_ALL01', 'PASS', 'Every field on the Group Commencement search grid and form is present (Group Code, Group Status, Chit Value, Formation/Registration/Commencement/Termination Date, PSO Number, New Commencement Date, 1st/2nd Auction Date, New Termination Date, Transaction Date, Commencement Certificate Number/Byelaw No., Security Type)', ''],
  ['TC_GC_ALL02', 'PASS', 'Security Type offers Fixed Deposit, Mortgage and Both options', ''],
  ['TC_GC_BUG01', 'FAIL', 'The group search grid should list existing registered chit groups - it always shows "No data to display" because its backing API (getMortgageDetailsForCommencement) returns HTTP 500', 'BUG-009'],
  ['TC_GC_SAVE01', 'PASS', 'Clicking Save without selecting a group from the grid does not persist anything (correct behavior - no group context to save against)', ''],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, status, title, defect]) => ({
  id,
  module: 'Group Commencement',
  screen: 'Group Commencement (#/configuration/chitcommencement)',
  title,
  type: 'Functional / Field Coverage',
  scenario: defect ? 'Negative / Boundary' : 'Positive',
  priority: defect ? 'P1' : 'P3',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Group Commencement form open (#/configuration/chitcommencement). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the form.',
  steps: `1. Login and select branch. 2. Open Group Commencement. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: defect ? 'See BUG-009 for full root-cause analysis (confirmed via network response capture: HTTP 500 with RFC7231 ProblemDetails body).' : 'Expected behavior observed.',
  status,
  defect,
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
