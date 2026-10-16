# Gold Estimate - Coverage reconciliation and gap report

Generated 2026-10-16T04:17:29.427Z from the real execution results. Environment: `http://host214.kapilits.com:8411/`.

## Reconciliation

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 85 | 85 | 85 | 79 | 70 | 9 | 0 | 0 | 4 | 2 |

- Executed = Passed + Failed (a test that ran to its assertion).
- Passed + Failed + Blocked + Skipped + Not executed + N/A = 85 = Discovered (85) - reconciles, no double counting.
- Generated = designed cases (steps and expected result written in the metadata) plus any tests found. Designed cases without a script: none.
- "Coverage" is only claimed against this denominator (85 generated cases). It is not a claim of 100% coverage of the application.

## Not executed, not applicable and blocked - with reasons

**N/A**
- **TC_ESTIMATE_DELETE_01** - Not applicable: the Gold Estimate form and My Gold Estimates list have no delete action.
- **TC_ESTIMATE_SORT_01** - Not applicable: My Gold Estimates headers are not sortable.

**NOT EXECUTED**
- **TC_ESTIMATE_DUPLICATE_01** - Not verified: needs a second saved estimate for the same contact; not run to avoid extra records in the approval queue. Check manually.
- **TC_ESTIMATE_API_05** - NOT EXECUTED (data safety): a direct call could be accepted by the server and create an invalid estimate that cannot be deleted. Covered at UI level by the BOUNDARY / REQUIRED tests.
- **TC_ESTIMATE_A11Y_04** - NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).
- **TC_ESTIMATE_SESSION_05** - NOT EXECUTED (data safety): needs two real saved estimates for one contact, which cannot be deleted.

**SKIPPED**
- none

**BLOCKED (environment: login or page-load timeout, not an application result)**
- none

## Coverage by the 37 test categories

| Category | Tests | Passed | Failed | Blocked | N/A / not executed | Gap / note |
|---|---|---|---|---|---|---|
| Positive functional testing | 1 | 1 | 0 | 0 | 0 |  |
| Negative functional testing | 10 | 9 | 1 | 0 | 0 |  |
| Required-field validation | 7 | 6 | 1 | 0 | 0 |  |
| Empty, null and whitespace input | 3 | 3 | 0 | 0 | 0 |  |
| Minimum and maximum length | 4 | 4 | 0 | 0 | 0 |  |
| Boundary value analysis | 9 | 9 | 0 | 0 | 0 |  |
| Equivalence partitioning | 3 | 3 | 0 | 0 | 0 |  |
| Data type and format validation | 3 | 2 | 1 | 0 | 0 |  |
| Invalid and special characters | 3 | 1 | 2 | 0 | 0 |  |
| Dropdown and autocomplete selection | 4 | 4 | 0 | 0 | 0 |  |
| Field dependency testing | 3 | 3 | 0 | 0 | 0 |  |
| Conditional field behaviour | 2 | 2 | 0 | 0 | 0 |  |
| Default value verification | 1 | 1 | 0 | 0 | 0 |  |
| Create and Save | 2 | 2 | 0 | 0 | 0 |  |
| Read and Search | 7 | 5 | 2 | 0 | 0 |  |
| Edit and Update | 2 | 2 | 0 | 0 | 0 | Editing a SAVED estimate (for example one sent back to the appraiser) is not covered: no estimate is in that state on this server. |
| Delete, where supported | 1 | 0 | 0 | 0 | 1 |  |
| Cancel, Reset and Clear | 3 | 3 | 0 | 0 | 0 |  |
| Duplicate record prevention | 2 | 1 | 0 | 0 | 1 |  |
| Business rule validation | 10 | 10 | 0 | 0 | 0 |  |
| Calculation and total validation | 8 | 8 | 0 | 0 | 0 |  |
| Date and time validation | 3 | 2 | 1 | 0 | 0 |  |
| Cross-field validation | 3 | 3 | 0 | 0 | 0 |  |
| Error messages and validation placement | 3 | 3 | 0 | 0 | 0 | Message text and timing are checked; the on-screen PLACEMENT of messages is not asserted. |
| Double-click and repeated submission | 1 | 1 | 0 | 0 | 0 | Double-click on Save is covered. Double-click on Confirm & Save is not run: it could create duplicate estimates that cannot be deleted. |
| Session timeout and recovery | 2 | 2 | 0 | 0 | 0 | Real server-side session expiry is not simulated; browser storage is cleared instead. |
| Role-based access control | 2 | 2 | 0 | 0 | 0 |  |
| Navigation and workflow transition | 5 | 5 | 0 | 0 | 0 |  |
| API integration and response validation | 5 | 4 | 0 | 0 | 1 |  |
| Persistence and data consistency | 6 | 4 | 2 | 0 | 0 |  |
| Sorting, filtering and pagination | 4 | 3 | 0 | 0 | 1 |  |
| File upload and download | 3 | 2 | 1 | 0 | 0 | Download is not applicable (the screen has no download). |
| Concurrent updates | 1 | 0 | 0 | 0 | 1 |  |
| Regression testing | 0 | 0 | 0 | 0 | 0 | GAP: no test. Provided as the "npm run estimate-smoke" and full-suite commands; not a separate set of test cases. |
| UI usability and accessibility checks | 3 | 1 | 2 | 0 | 0 |  |
| Browser compatibility and responsive behaviour | 3 | 1 | 1 | 0 | 1 | Responsive sizes run in Chromium; Firefox / WebKit are not installed. |
| Recovery after failed or interrupted transactions | 2 | 2 | 0 | 0 | 0 |  |

## Not covered (final gap list)
- Server-side validation by direct API calls (API_05) - not executed for data safety (could create an undeletable invalid estimate).
- Concurrent saves for one contact (SESSION_05) - needs two real estimates.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Editing a saved / sent-back estimate - no estimate in that state; the Approval suite covers the approver side.
- Double-click on Confirm & Save, and a retry after a failed save, - would create real estimates.
- The estimate "Take Photo" (camera) button - needs a camera.
- Database verification - no database access was provided; persistence was checked through the Summary page and the list API instead.
