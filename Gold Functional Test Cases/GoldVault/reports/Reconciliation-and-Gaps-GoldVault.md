# Vault - Coverage reconciliation and gap report

Generated 2026-10-16T09:43:37.153Z from the real execution results. Environment: `http://host214.kapilits.com:8411/`. Screen: Vault (Loans > Gold > Gold Loan Configuration > Vault).

## Reconciliation

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 74 | 74 | 74 | 66 | 61 | 5 | 0 | 0 | 4 | 4 |

- Executed = Passed + Failed (a test that ran to its assertion).
- Passed + Failed + Blocked + Skipped + Not executed + N/A = 74 = Discovered (74) - reconciles, no double counting.
- Generated = designed cases (steps and expected result written in the metadata) plus any tests found. Designed cases without a script: none.
- "Coverage" is only claimed against this denominator (74 generated cases), not as 100% coverage of the application.

## Not executed, not applicable and blocked - with reasons

**N/A**
- **TC_VAULT_DELETE_01** - Not applicable: the Vault grid has only an Edit icon - there is no delete action. Test vaults therefore stay (one per run).
- **TC_VAULT_DATE_01** - Not applicable: no date or time fields on the Vault screen.
- **TC_VAULT_FILTER_01** - Not applicable: no column filters; the search box covers all columns (SEARCH tests).
- **TC_VAULT_WORKFLOW_01** - Not applicable: a saved vault is available at once (for example in Safe & Lockers); there is no approval step.

**NOT EXECUTED**
- **TC_VAULT_BUSINESS_01** - NOT EXECUTED (data safety): Vault Branch is a free-text box, so checking whether an unknown branch is refused would need to SAVE one - and vaults cannot be deleted. Check manually or on a throw-away server.
- **TC_VAULT_API_05** - NOT EXECUTED (data safety): a direct call the server accepts would create a vault that cannot be deleted; covered at screen level instead.
- **TC_VAULT_A11Y_04** - NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).
- **TC_VAULT_SESSION_06** - NOT EXECUTED (data safety): needs two real saves of one code, and vaults cannot be deleted.

**SKIPPED**
- none

**BLOCKED (environment: login or page-load timeout, not an application result)**
- none

## Coverage by the 37 test categories

| Category | Tests | Passed | Failed | Blocked | N/A / not executed | Gap / note |
|---|---|---|---|---|---|---|
| Positive functional testing | 4 | 4 | 0 | 0 | 0 |  |
| Negative functional testing | 7 | 6 | 1 | 0 | 0 |  |
| Required-field validation | 4 | 4 | 0 | 0 | 0 |  |
| Empty, null and whitespace input | 3 | 1 | 2 | 0 | 0 |  |
| Minimum and maximum length | 5 | 5 | 0 | 0 | 0 |  |
| Boundary value analysis | 5 | 5 | 0 | 0 | 0 |  |
| Equivalence partitioning | 3 | 3 | 0 | 0 | 0 |  |
| Data type and format validation | 2 | 2 | 0 | 0 | 0 |  |
| Invalid and special characters | 4 | 4 | 0 | 0 | 0 |  |
| Dropdown and autocomplete selection | 1 | 1 | 0 | 0 | 0 | Vault Branch is a free-text box (no dropdown); the only dropdown touched is the Vault list of Safe & Lockers. |
| Field dependency testing | 1 | 1 | 0 | 0 | 0 |  |
| Conditional field behaviour | 2 | 2 | 0 | 0 | 0 |  |
| Default value verification | 1 | 1 | 0 | 0 | 0 |  |
| Create and Save | 2 | 2 | 0 | 0 | 0 |  |
| Read and Search | 10 | 10 | 0 | 0 | 0 |  |
| Edit and Update | 5 | 5 | 0 | 0 | 0 |  |
| Delete, where supported | 1 | 0 | 0 | 0 | 1 |  |
| Cancel, Reset and Clear | 4 | 4 | 0 | 0 | 0 |  |
| Duplicate record prevention | 3 | 3 | 0 | 0 | 0 |  |
| Business rule validation | 4 | 3 | 0 | 0 | 1 |  |
| Calculation and total validation | 2 | 2 | 0 | 0 | 0 | There are no calculations; the only totals are the pager counts. |
| Date and time validation | 1 | 0 | 0 | 0 | 1 |  |
| Cross-field validation | 2 | 2 | 0 | 0 | 0 | No rule links the three fields to each other. |
| Error messages and validation placement | 5 | 5 | 0 | 0 | 0 | Message text is checked; the exact on-screen PLACEMENT is not asserted. |
| Double-click and repeated submission | 2 | 2 | 0 | 0 | 0 |  |
| Session timeout and recovery | 3 | 3 | 0 | 0 | 0 | A real server-side session expiry / inactivity timeout is not simulated; browser storage is cleared instead. |
| Role-based access control | 2 | 2 | 0 | 0 | 0 |  |
| Navigation and workflow transition | 3 | 2 | 0 | 0 | 1 |  |
| API integration and response validation | 5 | 4 | 0 | 0 | 1 |  |
| Persistence and data consistency | 5 | 4 | 1 | 0 | 0 |  |
| Sorting, filtering and pagination | 6 | 5 | 0 | 0 | 1 |  |
| File upload and download | 3 | 3 | 0 | 0 | 0 | Upload is not applicable (export only). |
| Concurrent updates | 1 | 0 | 0 | 0 | 1 |  |
| Regression testing | 0 | 0 | 0 | 0 | 0 | GAP: no test. Provided as the full-suite command; not a separate set of test cases. |
| UI usability and accessibility checks | 4 | 2 | 2 | 0 | 0 |  |
| Browser compatibility and responsive behaviour | 3 | 0 | 2 | 0 | 1 | Responsive sizes run in Chromium; Firefox / WebKit are not installed. |
| Recovery after failed or interrupted transactions | 2 | 2 | 0 | 0 | 0 |  |

## Not covered (final gap list)
- A Vault Branch that is not a real branch (BUSINESS_01) - not executed: Vault Branch is free text and a saved vault cannot be deleted.
- Server-side validation by direct API calls (API_05) - needs the login token and could create undeletable vaults.
- Two users saving the same code at once (SESSION_06) - needs two real saves of one code.
- Firefox / WebKit / Edge (A11Y_04) - only Chromium is installed.
- Whether the server ignores a changed createdby user id in the save URL - not tested.
- Whether Safe & Lockers keeps working when a vault code is changed after safes exist - not tested.
- Database verification - no database access was provided; persistence was checked through the grid, a fresh login, the exports and the list API.
