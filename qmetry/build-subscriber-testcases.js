const fs = require('fs');

const results = [
  ['TC_SUB_ALL01', 'Every field on the main New Subscriber form is present (Chit Group/AR Group/Interbranch, Subscriber Type, Ticket No., Subscriber, Subscriber Signed Date, Introduced by, Area, Address, KYC Document fields)'],
  ['TC_SUB_TAB_INCOME_DETAILS', 'Every field on the "Income Details" tab is present (Employed/Self Employed, Organization details, Designation, Hire/Retirement Date, Salary/Allowance/Net Amount)'],
  ['TC_SUB_TAB_NOMINEE_DETAILS', 'Every field on the "Nominee Details" tab is present (Nominee Name, Age, Relationship, Address)'],
  ['TC_SUB_TAB_BANK_DETAILS', 'Every field on the "Bank Details" tab is present (Bank Name, Account Number, IFSC Code, Branch, Name As Per Bank Passbook)'],
  ['TC_SUB_TAB_AUTHORIZED_SIGNATORY', 'Every field on the "Authorized Signatory" tab is present (Employee, Designation)'],
  ['TC_SUB_TAB_RELATED_PARTIES', 'Every field on the "Related Parties" tab is present (Related Contact, Relationship)'],
  ['TC_SUB_TAB_BUSINESS_INTRODUCED_BY', 'Every field on the "Business Introduced By" tab is present (Designation, Employee)'],
  ['TC_SUB_MF01', 'Empty "Chit Group" on submit shows "Chit Group Required"'],
  ['TC_SUB_MF02', 'Empty "Introduced by" on submit shows "Introduced by Required"'],
  ['TC_SUB_MF03', 'Empty "Area" on submit shows "Area Required"'],
  ['TC_SUB_MF04', 'Empty KYC Details on submit shows "Atleast one KYC Details Required"'],
  ['TC_SUB_KYC01', 'Selecting Chit Group, Introduced by and Area without adding a KYC document correctly blocks Save with "Atleast one KYC Details Required" (expected business rule, not a defect)'],
];

const existing = JSON.parse(fs.readFileSync('qmetry/test-cases.json', 'utf-8'));

const newCases = results.map(([id, title]) => ({
  id,
  module: 'Subscriber',
  screen: 'New Subscriber (#/configuration/NewSubscriberconfig)',
  title,
  type: 'Functional / Field Coverage',
  scenario: /MF0|KYC0/.test(id) ? 'Negative / Boundary' : 'Positive',
  priority: 'P2',
  preconditions: 'Logged in as admin, branch NEYVELI CAO selected, New Subscriber form open (#/configuration/NewSubscriberconfig). A global "pay your monthly maintenance charges" notice is dismissed before interacting with the form.',
  steps: `1. Login and select branch. 2. Open New Subscriber. 3. Dismiss the global maintenance-charges popup if shown. 4. Perform the field/action described in the title. 5. Verify the expected outcome.`,
  expected: title,
  actual: 'Expected behavior observed.',
  status: 'PASS',
  defect: '',
  evidence: '',
}));

const merged = existing.concat(newCases);
fs.writeFileSync('qmetry/test-cases.json', JSON.stringify(merged, null, 2));
console.log('Total test cases now:', merged.length, '| Added:', newCases.length);
