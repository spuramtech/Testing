// Gold Estimate Approval Queue: report configuration + steps / expected results (QMETRY_SUITE=approval)
const { TYPES } = require('../utils/qmetry-meta');

const C = (steps, expected) => ({ steps, expected });

const CFG = {
  cycle: 'Gold Estimate Approval Queue – Functional',
  subtitle: 'Gold Estimate Approval Queue – Functional Test Cycle · Gold Flow Entry',
  role: 'Internal Appraiser 2 (priya)',
  spec: 'GoldEstimateApproval/tests/gold-estimate-approval-functional.spec.js',
  pre: 'Logged in as Internal Appraiser 2; Loans > Gold > Gold Estimate Approval Queue is open. Tests act only on the AUTOTEST estimate created by the Gold Estimate suite; only APPROVE_01 clicks Approve.',
};

const VERIFY = ['Open the queue', 'Click Verify on the AUTOTEST estimate'];

const COV = {
  APPROVE_01: C([...VERIFY, 'Click Approve and complete the remarks / confirmation popup'], 'Success message; the estimate is no longer "Awaiting Internal Appraiser 2 verification".'),
  READ_01: C(['Open the queue', 'Find the AUTOTEST estimate row'], 'Row shows customer, mobile, value, role Internal Appraiser 2, status "Awaiting Internal Appraiser 2 verification" and a Verify action.'),
  READ_02: C(VERIFY, 'Verify page shows entered by tryfinsta, gross 10.5 g, net 10 g and the RING article.'),
  READ_03: C(['After APPROVE_01, log in fresh and open the queue'], 'The estimate no longer has a Verify action for Internal Appraiser 2.'),
  UPDATE_01: C(VERIFY, 'Only Back, Approve and Revert actions; no editable fields.'),
  CANCEL_01: C([...VERIFY, 'Click Back', 'Find the estimate in the queue'], 'Back returns to the queue and the status is unchanged.'),
  DELETE_01: C(['Look for a delete action'], 'Not applicable: no delete action on the queue or the Verify page.'),
  REQUIRED_01: C(['Click Approve without a remark'], 'Not verified: this would approve the estimate; covered by APPROVE_01.'),
  INPUT_01: C(['Type <script>alert(1)</script> in the search box'], 'No rows; the page stays intact.'),
  BOUNDARY_01: C(['Search "G", then a 500-character string'], '"G" lists rows; the long string lists none; no error.'),
  DEFAULT_01: C(['Open the queue'], 'Search box empty; status filter "All statuses".'),
  DATE_01: C(['Read the Aging cell of the estimate'], 'Aging shows a valid age such as <1h, Nh or Nd.'),
  BUSINESS_01: C(VERIFY, 'Estimated Value = Net Weight x Rate/g.'),
  CONSISTENCY_01: C([...VERIFY, 'Compare queue value and Verify page'], 'GE number, mobile and the appraised value match the queue row.'),
  DUPLICATE_01: C(['Read all GE numbers in the queue'], 'Each GE number appears only once.'),
  SEARCH_01: C(['Search by GE number / mobile / customer name / role'], 'The estimate is listed.'),
  SEARCH_02: C(['Search GE0000000000'], 'No rows.'),
  FILTER_01: C(['Filter by Awaiting Internal Appraiser 2 verification', 'Filter by Ready for Approval'], 'Only the chosen status is listed; the estimate is not under Ready for Approval.'),
  SORT_01: C(['Click the CUSTOMER header'], 'Rows sort (skipped when headers are not sortable).'),
  PAGINATION_01: C(['Look for a pager'], 'Pager summary matches the rows (skipped when there is no pager).'),
  CLEAR_01: C(['Search an unknown GE', 'Clear the search box'], 'The full queue returns.'),
  NAV_01: C([...VERIFY, 'Click Back'], 'Internal Appraiser Verification page opens; Back returns to the queue with all column headings.'),
  ROLE_01: C(['Log in as each role', 'Open the queue and find the estimate'], 'Internal Appraiser 2 sees Verify; other roles are recorded in the notes.'),
  WORKFLOW_01: C(['After APPROVE_01 log in as Checker / BH', 'Find the estimate'], 'The estimate is visible to the Checker and no longer awaiting Internal Appraiser 2.'),
  API_01: C(['Record POST / PUT calls during APPROVE_01'], 'All returned a 2xx status.'),
  ERROR_01: C(['Open the Verify URL for GE0000000000'], 'No Approve button is shown.'),
  FILE_01: C(VERIFY, 'The uploaded gold article image is shown.'),
  A11Y_01: C(['Open the queue at 390x844 (phone)', 'Tab from the search box'], 'No horizontal scroll; focus moves on.'),
  SESSION_01: C(['Without logging in open the queue and Verify URLs'], 'No estimates and no Approve button are shown.'),
  LENGTH_01: C(['Type 2000 characters in the search box'], 'The page stays usable and shows no rows.'),
};

module.exports = { TYPES, F_TYPE: {}, COV, CFG };
