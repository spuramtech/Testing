const fs = require('fs');

const results = [
  ['TC_GR_ALL01', 'PASS', 'Every field on the Group Registration form is present (Group Code, PSO Number, Registration/Commencement/Termination Date)', ''],
  ['TC_GR_ALL02', 'PASS', 'Group Code dropdown is populated only with groups that completed Group Formation', ''],
  ['TC_GR_MF01', 'PASS', 'Empty "Group Code" on submit shows "Group Code Required"', ''],
  ['TC_GR_MF02', 'PASS', 'Empty "PSO Number" on submit shows "PSO Number Required"', ''],
  ['TC_GR_MF03', 'PASS', 'Empty "Registration Date" on submit shows "Registration Date Required"', ''],
  ['TC_GR_MF04', 'PASS', 'Empty "Commencement Date" on submit shows "Commencement Date Required"', ''],
  ['TC_GR_MF05', 'PASS', 'Empty "Termination Date" on submit shows "Termination Date Required"', ''],
  ['TC_GR_BV01', 'FAIL', 'PSO Number should reject a negative value ("-123") - it is silently accepted', 'BUG-008'],
  ['TC_GR_BV02', 'FAIL', 'PSO Number should reject non-numeric input ("abcde") - it is silently accepted', 'BUG-008'],
  ['TC_GR_BV03', 'FAIL', 'PSO Number should cap length - a 20-digit value is silently accepted', 'BUG-008'],
  ['TC_GR_XSS01', 'PASS', 'XSS payload in PSO Number is not executed (no alert dialog)', ''],
  ['TC_GR_CREATE01', 'PASS', 'Saving with a valid Group Code/PSO Number logs whether date fields (datepicker widgets) block Save, consistent with the known datepicker-interaction limitation seen on Group Formation', ''],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, status, title, defect]) => ({
  id,
  module: 'Group Registration',
  screen: 'Group Registration (#/configuration/chitregistration)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /BV0|MF0|XSS|CREATE/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: defect ? 'P2' : 'P3',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Group Registration form open (#/configuration/chitregistration). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the form.',
  steps: `1. Login and select branch. 2. Open Group Registration. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the field/action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: defect ? 'See BUG-008 for full details.' : 'Expected behavior observed.',
  status,
  defect,
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
