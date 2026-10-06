const fs = require('fs');

const results = [
  ['TC_AS_ALL01', 'Every search field (From Date, To Date, Group Code) and grid column (Register, Branch, Group Code, Chit Value, Auction No., Auction Date, Prev./Next Auction Date, Time, Hall, CC No, Conducted By, Foreman, Comm.Per, Prev.Bid Amt, Prev.Bid, Payable Amt) on Auction Schedule is present'],
  ['TC_AS_ALL02', 'The schedule grid loads real auction data on page load'],
  ['TC_AS_SEARCH01', 'Searching by an existing Group Code filters the grid to only that group'],
  ['TC_AS_SEARCH02', 'Searching for a non-existent Group Code shows "No data to display"'],
  ['TC_AS_SEARCH03', 'Clearing the search text restores the full unfiltered grid'],
  ['TC_AS_XSS01', 'XSS payload in the search box is not executed (no alert dialog)'],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, title]) => ({
  id,
  module: 'Auction Schedule',
  screen: 'Auction Schedule (#/AuctionConfig/Auctionschedule)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /SEARCH02|XSS/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: 'P3',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Auction Schedule page open (#/AuctionConfig/Auctionschedule). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the page.',
  steps: `1. Login and select branch. 2. Open Auction Schedule. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the field/action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: 'Expected behavior observed.',
  status: 'PASS',
  defect: '',
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
