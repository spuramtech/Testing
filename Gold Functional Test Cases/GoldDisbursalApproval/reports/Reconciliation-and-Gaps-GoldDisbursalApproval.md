# Gold Disbursal Approval Queue - Coverage reconciliation and gap report

Generated 2026-10-16T12:46:04.257Z from the real execution results. Environment: `http://host214.kapilits.com:8411/`. Screen: Gold Disbursal Approval Queue (Loans > Gold > Gold Disbursal Approval Queue). READ-ONLY run: nothing was approved, reverted or created.

## Reconciliation

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 79 | 79 | 79 | 68 | 60 | 8 | 0 | 0 | 7 | 4 |

- Executed = Passed + Failed (a test that ran to its assertion).
- Passed + Failed + Blocked + Skipped + Not executed + N/A = 79 = Discovered (79) - reconciles, no double counting.
- Generated = designed cases (steps and expected result written in the metadata) plus any tests found. Designed cases without a script: none.
- "Coverage" is only claimed against this denominator (79 generated cases), not as 100% coverage of the application.

## Not executed, not applicable and blocked - with reasons

**N/A**
- **TC_DISBAPP_CREATE_01** - Not applicable: a disbursal is created in the Loan Disbursal form; this queue only approves or reverts it.
- **TC_DISBAPP_DELETE_01** - Not applicable: the queue has no delete action.
- **TC_DISBAPP_SORT_01** - Not applicable: the column headers are not sortable (no aria-sort after a click); the list is ordered by Entered On, newest first.
- **TC_DISBAPP_FILE_01** - Not applicable: no Excel / PDF export or upload icons on the queue (unlike the Vault screen).

**NOT EXECUTED**
- **TC_DISBAPP_UPDATE_01** - NOT EXECUTED (data safety): the confirmation text says the voucher "is posted now and cannot be undone from here", the waiting loans belong to other live work, and the suite has no disbursal of its own to approve. Run th
- **TC_DISBAPP_CANCEL_03** - NOT EXECUTED (data safety): Revert changes a live loan; the suite has no disbursal of its own to revert.
- **TC_DISBAPP_REQUIRED_01** - NOT EXECUTED (data safety): checking it would need the Revert dialog on a live loan.
- **TC_DISBAPP_WORKFLOW_03** - NOT EXECUTED (data safety): needs a real approve / revert. The existing "npm run disbursal-approval" covers the approval of the flow's own loan.
- **TC_DISBAPP_API_05** - NOT EXECUTED (data safety): a direct call could post a real voucher.
- **TC_DISBAPP_A11Y_04** - NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).
- **TC_DISBAPP_SESSION_06** - NOT EXECUTED (data safety): needs two real approvals of one loan.

**SKIPPED**
- none

**BLOCKED (environment: login or page-load timeout, not an application result)**
- none

## Coverage by the 37 test categories

| Category | Tests | Passed | Failed | Blocked | N/A / not executed | Gap / note |
|---|---|---|---|---|---|---|
| Positive functional testing | 3 | 3 | 0 | 0 | 0 | The positive action (Approve & Disburse) is NOT executed: it posts an irreversible voucher. |
| Negative functional testing | 6 | 6 | 0 | 0 | 0 |  |
| Required-field validation | 1 | 0 | 0 | 0 | 1 | The only possible required field is the Revert remark - not executed (needs the Revert dialog on a live loan). |
| Empty, null and whitespace input | 3 | 1 | 2 | 0 | 0 |  |
| Minimum and maximum length | 4 | 2 | 2 | 0 | 0 |  |
| Boundary value analysis | 3 | 3 | 0 | 0 | 0 |  |
| Equivalence partitioning | 4 | 4 | 0 | 0 | 0 | One loan per status class (waiting / approved / reverted). |
| Data type and format validation | 2 | 2 | 0 | 0 | 0 |  |
| Invalid and special characters | 2 | 2 | 0 | 0 | 0 |  |
| Dropdown and autocomplete selection | 3 | 3 | 0 | 0 | 0 |  |
| Field dependency testing | 1 | 1 | 0 | 0 | 0 | Choosing "My submissions" removes the status filter. |
| Conditional field behaviour | 3 | 3 | 0 | 0 | 0 | Buttons depend on the loan status. |
| Default value verification | 2 | 2 | 0 | 0 | 0 |  |
| Create and Save | 1 | 0 | 0 | 0 | 1 | Not applicable: nothing is created here. |
| Read and Search | 13 | 12 | 1 | 0 | 0 |  |
| Edit and Update | 2 | 1 | 0 | 0 | 1 | There is no edit; the only state changes are Approve and Revert (not executed). |
| Delete, where supported | 1 | 0 | 0 | 0 | 1 |  |
| Cancel, Reset and Clear | 4 | 2 | 1 | 0 | 1 |  |
| Duplicate record prevention | 1 | 1 | 0 | 0 | 0 |  |
| Business rule validation | 5 | 5 | 0 | 0 | 0 |  |
| Calculation and total validation | 3 | 2 | 1 | 0 | 0 |  |
| Date and time validation | 3 | 3 | 0 | 0 | 0 |  |
| Cross-field validation | 3 | 3 | 0 | 0 | 0 |  |
| Error messages and validation placement | 2 | 2 | 0 | 0 | 0 | Message text is checked; the on-screen placement is not asserted. |
| Double-click and repeated submission | 1 | 1 | 0 | 0 | 0 | Double-click on Approve & Disburse is not executed. |
| Session timeout and recovery | 3 | 3 | 0 | 0 | 0 | A real server-side session expiry is not simulated. |
| Role-based access control | 3 | 3 | 0 | 0 | 0 |  |
| Navigation and workflow transition | 7 | 6 | 0 | 0 | 1 |  |
| API integration and response validation | 5 | 4 | 0 | 0 | 1 |  |
| Persistence and data consistency | 5 | 3 | 2 | 0 | 0 |  |
| Sorting, filtering and pagination | 7 | 6 | 0 | 0 | 1 |  |
| File upload and download | 1 | 0 | 0 | 0 | 1 | Not applicable: no export or upload. |
| Concurrent updates | 1 | 0 | 0 | 0 | 1 |  |
| Regression testing | 0 | 0 | 0 | 0 | 0 | GAP: no test. Provided as the full-suite command; not a separate set of test cases. |
| UI usability and accessibility checks | 4 | 3 | 1 | 0 | 0 |  |
| Browser compatibility and responsive behaviour | 3 | 2 | 0 | 0 | 1 | Responsive sizes run in Chromium; Firefox / WebKit are not installed. |
| Recovery after failed or interrupted transactions | 2 | 2 | 0 | 0 | 0 |  |

## Not covered (final gap list)
- Approve & Disburse (UPDATE_01, WORKFLOW_03), Revert (CANCEL_03) and the Revert remark rule (REQUIRED_01) - not executed: they post / change a live loan and a posted voucher cannot be undone from the screen. The existing script (npm run disbursal-approval) approves the flow's own loan.
- The approve / revert APIs called directly (API_05) - could post a real voucher.
- Two approvers on one loan (SESSION_06) - needs two real approvals.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Voucher posting, accounting entries and the customer's bank payment after approval - not verified (no access to the accounting screens in this suite).
- Behaviour while another user approves a loan that is open on the screen - not tested.
- Database verification - no database access was provided; checks used the grid, the loan pages and the list API.
