const fs = require('fs');

const results = [
  ['TC_CP_ALL01', 'Every search field (Subscriber, From Date, To Date) and grid column (Total Outstanding, Action, Chit No., Subscriber Name, Chit Value, Future Liability, Auction Date, Bid Payable, G.S.T Amount, Net Payable, Paid/Adjusted Amount, Bid Paid Outstanding, Chit Period Completion %) on Chit Payment is present'],
  ['TC_CP_SUB01', 'Selecting a subscriber and clicking Show triggers a real API call (GetPsInformationGridDetailsOnsearch) that returns HTTP 200'],
  ['TC_CP_SUB02', 'Clicking Show with no subscriber selected does not crash and shows "No data to display"'],
  ['TC_CP_XSS01', 'XSS payload in the subscriber search box is not executed (no alert dialog)'],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, title]) => ({
  id,
  module: 'Chit Payment',
  screen: 'Chit Payment (#/Transactions/ChitPayment)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /XSS/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: 'P3',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Chit Payment page open (#/Transactions/ChitPayment). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the page.',
  steps: `1. Login and select branch. 2. Open Chit Payment. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the field/action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: 'Expected behavior observed.',
  status: 'PASS',
  defect: '',
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
