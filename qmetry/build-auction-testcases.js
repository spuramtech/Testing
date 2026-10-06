const fs = require('fs');

const results = [
  ['TC_AU_ALL01', 'PASS', 'Every field on the Auction (conduct auction) form is present (Auction Date, Show Due Tickets Also, Auction Groups, Select Ticket Number, Bid Amount, Foreman\'s Commission, Bid Offers, Auction Details summary)', ''],
  ['TC_AU_ALL02', 'PASS', 'Auction Groups list is populated with due chit groups', ''],
  ['TC_AU_MF01', 'PASS', 'Submitting with no group/ticket selected shows "Ticket Number Required"', ''],
  ['TC_AU_MF02', 'PASS', 'Submitting with no Bid Amount shows "Bid Amount Required"', ''],
  ['TC_AU_BUG01', 'FAIL', 'Selecting a group from the Auction Groups list should load its tickets into the Select Ticket Number dropdown - it only highlights the group visually and fires zero API calls, leaving the dropdown permanently empty', 'BUG-012'],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, status, title, defect]) => ({
  id,
  module: 'Auction',
  screen: 'Auction (#/AuctionConfig/Auction)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /MF0|BUG/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: defect ? 'P1' : 'P2',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, Auction form open (#/AuctionConfig/Auction). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the form.',
  steps: `1. Login and select branch. 2. Open Auction. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the field/action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: defect ? 'See BUG-012 for full root-cause analysis.' : 'Expected behavior observed.',
  status,
  defect,
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
