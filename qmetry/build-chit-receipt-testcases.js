const fs = require('fs');

const results = [
  ['TC_CR_ALL01', 'PASS', 'Every field on the Chit Receipt form is present (Subscriber, Date, Cash/Bank, Installment Amount, Vacant Charges, Subscription, Incidental Charges, Interest Collected, Amount Received, Waiver Amount, Authorized by, Other Charges, Bid Offers)', ''],
  ['TC_CR_MF01', 'PASS', 'Empty "Subscriber" on submit shows "Subscriber Required"', ''],
  ['TC_CR_MSG01', 'FAIL', 'Empty-submit validation summary should read "Fill Required fields" - it reads the misspelled "Fill Required filelds"', 'BUG-010'],
  ['TC_CR_BV01', 'FAIL', 'Amount Received should reject a negative value ("-500") - it is silently accepted (reformatted to "-,500")', 'BUG-011'],
  ['TC_CR_BV02', 'FAIL', 'Amount Received should reject non-numeric input ("abcde") - it is silently accepted (coerced to "ab,cde")', 'BUG-011'],
  ['TC_CR_BV03', 'FAIL', 'Waiver Amount should reject a negative value ("-1") - it is silently accepted', 'BUG-011'],
  ['TC_CR_XSS01', 'PASS', 'XSS payload in Amount Received is not executed (no alert dialog)', ''],
  ['TC_CR_SUB01', 'PASS', 'Selecting a subscriber loads their Running Chits / Dues History sections', ''],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, status, title, defect]) => ({
  id,
  module: 'Chit Receipt',
  screen: 'Chit Receipt (#/Transactions/Chitreceipt)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /MF0|BV0|XSS|MSG0/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: defect ? 'P2' : 'P3',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Chit Receipt form open (#/Transactions/Chitreceipt). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the form.',
  steps: `1. Login and select branch. 2. Open Chit Receipt. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the field/action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: defect ? `See ${defect} for full details.` : 'Expected behavior observed.',
  status,
  defect,
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
