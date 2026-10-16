# Gold Slab Config - Coverage reconciliation and gap report

Generated 2026-10-16T06:53:18.913Z from the real execution results. Environment: `http://host214.kapilits.com:8411/`. Screen: Gold Estimate Slab Configuration (Loans > Gold > Gold Loan Configuration > Estimate Approval Slabs).

## Reconciliation

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 63 | 63 | 63 | 53 | 46 | 7 | 0 | 0 | 3 | 7 |

- Executed = Passed + Failed (a test that ran to its assertion).
- Passed + Failed + Blocked + Skipped + Not executed + N/A = 63 = Discovered (63) - reconciles, no double counting.
- Generated = designed cases (steps and expected result written in the metadata) plus any tests found. Designed cases without a script: none.
- "Coverage" is only claimed against this denominator (63 generated cases), not as 100% coverage of the application.

## Not executed, not applicable and blocked - with reasons

**N/A**
- **TC_SLAB_DATE_01** - Not applicable: the Estimate Slab Configuration has no date or time fields.
- **TC_SLAB_SEARCH_01** - Not applicable: the Estimate Slab Configuration list has no search box.
- **TC_SLAB_FILTER_01** - Not applicable: the slab list has no filters.
- **TC_SLAB_SORT_01** - Not applicable: slabs are shown in range order; the headers are not sortable.
- **TC_SLAB_PAGINATION_01** - Not applicable: all slabs are shown on one page (no pager).
- **TC_SLAB_WORKFLOW_01** - Not applicable: a saved slab is effective immediately for new estimates; there is no maker-checker step on this screen.
- **TC_SLAB_FILE_01** - Not applicable: the screen has no import, export or upload.

**NOT EXECUTED**
- **TC_SLAB_API_05** - NOT EXECUTED: needs the login token to call the API directly; invalid slabs are exercised through the screen instead (BOUNDARY / DUPLICATE tests, sandbox range only).
- **TC_SLAB_A11Y_04** - NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).
- **TC_SLAB_SESSION_05** - NOT EXECUTED: two simultaneous writers on the live approval configuration were judged too risky; run it manually in a quiet window.

**SKIPPED**
- none

**BLOCKED (environment: login or page-load timeout, not an application result)**
- none

## Coverage by the 37 test categories

| Category | Tests | Passed | Failed | Blocked | N/A / not executed | Gap / note |
|---|---|---|---|---|---|---|
| Positive functional testing | 3 | 3 | 0 | 0 | 0 |  |
| Negative functional testing | 9 | 8 | 1 | 0 | 0 |  |
| Required-field validation | 2 | 2 | 0 | 0 | 0 |  |
| Empty, null and whitespace input | 3 | 3 | 0 | 0 | 0 |  |
| Minimum and maximum length | 2 | 0 | 2 | 0 | 0 |  |
| Boundary value analysis | 6 | 5 | 1 | 0 | 0 |  |
| Equivalence partitioning | 5 | 4 | 1 | 0 | 0 | Valid / overlapping / gap / open-ended classes of slab ranges. |
| Data type and format validation | 3 | 2 | 1 | 0 | 0 |  |
| Invalid and special characters | 3 | 2 | 1 | 0 | 0 |  |
| Dropdown and autocomplete selection | 3 | 3 | 0 | 0 | 0 |  |
| Field dependency testing | 2 | 2 | 0 | 0 | 0 |  |
| Conditional field behaviour | 3 | 3 | 0 | 0 | 0 |  |
| Default value verification | 1 | 1 | 0 | 0 | 0 |  |
| Create and Save | 2 | 2 | 0 | 0 | 0 |  |
| Read and Search | 5 | 4 | 0 | 0 | 1 |  |
| Edit and Update | 4 | 4 | 0 | 0 | 0 |  |
| Delete, where supported | 3 | 3 | 0 | 0 | 0 |  |
| Cancel, Reset and Clear | 4 | 4 | 0 | 0 | 0 |  |
| Duplicate record prevention | 2 | 2 | 0 | 0 | 0 |  |
| Business rule validation | 7 | 6 | 1 | 0 | 0 |  |
| Calculation and total validation | 1 | 1 | 0 | 0 | 0 | There are no calculations on this screen; the only derived value is the stages an estimate needs (CONSISTENCY_03). |
| Date and time validation | 1 | 0 | 0 | 0 | 1 |  |
| Cross-field validation | 4 | 4 | 0 | 0 | 0 |  |
| Error messages and validation placement | 2 | 2 | 0 | 0 | 0 | Message text is checked; the on-screen PLACEMENT of messages is not asserted. |
| Double-click and repeated submission | 2 | 2 | 0 | 0 | 0 |  |
| Session timeout and recovery | 3 | 3 | 0 | 0 | 0 |  |
| Role-based access control | 2 | 2 | 0 | 0 | 0 |  |
| Navigation and workflow transition | 3 | 2 | 0 | 0 | 1 |  |
| API integration and response validation | 5 | 4 | 0 | 0 | 1 |  |
| Persistence and data consistency | 4 | 4 | 0 | 0 | 0 |  |
| Sorting, filtering and pagination | 3 | 0 | 0 | 0 | 3 |  |
| File upload and download | 1 | 0 | 0 | 0 | 1 |  |
| Concurrent updates | 1 | 0 | 0 | 0 | 1 |  |
| Regression testing | 0 | 0 | 0 | 0 | 0 | GAP: no test. Provided as the full-suite command; not a separate set of test cases. |
| UI usability and accessibility checks | 3 | 0 | 3 | 0 | 0 |  |
| Browser compatibility and responsive behaviour | 3 | 0 | 2 | 0 | 1 | Responsive sizes run in Chromium; Firefox / WebKit are not installed. |
| Recovery after failed or interrupted transactions | 2 | 2 | 0 | 0 | 0 |  |

## Not covered (final gap list)
- Server-side validation by direct API calls (API_05) - needs the login token; invalid slabs were exercised through the screen instead.
- Two users changing slabs at the same time (SESSION_05) - too risky on the live approval configuration.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Overlap, duplicate and gap checks on the 5 REAL slabs - deliberately not run: a slab accepted by mistake there would change who must approve every estimate. They were run in the sandbox range above 10 crore only.
- Whether the server ignores a changed `createdby` user id in the save URL - not tested (would need a tampered request).
- Database verification - no database access was provided; persistence was checked through the list, a fresh login and the list API.
