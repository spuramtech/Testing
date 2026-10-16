# Gold Disbursal Approval Queue – Run Guide

Screen under test: **Loans → Gold → Gold Disbursal Approval Queue** (route `#/Loans/GoldDisbursalApprovalQueue`) and the loan page it opens (`GoldDisbursalApprovalDetail;id=...`), logged in as the **Checker / Branch Head admin**. The queue lists gold loan disbursals waiting for approval, approved & disbursed, or reverted.

Run every command in **PowerShell** from the automation folder:

```
C:\Users\admin\Desktop\Gold Module\Gold Flow Entry
```

---

## Folder layout

```
Gold Flow Entry\GoldDisbursalApproval\
  RUN_GUIDE_GoldDisbursalApproval.md      this guide
  REQUIREMENTS_GoldDisbursalApproval.md   requirement / business-rule inventory (22 items, status computed from the results)
  requirements.js, qmetry-meta.js         the requirement data and the steps / expected results shown in the report
  run-qmetry.js, build-reports.js, export.js    run the suite and build every report / export
  pages\GoldDisbQueuePage.js              page object (has NO method that clicks Approve & Disburse or Revert)
  tests\gold-disbursal-approval-functional.spec.js   79 tests, 26 test types
  reports\                                Qmetry-GoldDisbursalApproval.html and the CSV / Markdown deliverables
```

Your original script (`npm run disbursal-approval`, `tests\gold-disbursal-approval.spec.js`) is **unchanged**. It is the one that actually approves & disburses the flow's own loan.

---

## 1. SAFETY – read before running

**Approve & Disburse posts a voucher; the app itself says it "cannot be undone from here".** Revert changes a live loan. The loans in this queue belong to other people's work and to your own flow. So this suite is **read-only**:

* it **never clicks Approve & Disburse, Revert or the confirmation of either** – the page object has no method that could;
* a browser-side guard **aborts and records any approve / revert / disburse / voucher write**, and every test is **failed** by `afterEach` if one is ever attempted (in the recorded run: none);
* it **creates nothing** (disbursals are created in the Loan Disbursal form), so there is nothing to clean up;
* the approve / revert scenarios appear in the report as **NOT EXECUTED** with this reason.

Opening a loan page (Review / View) and the search / filter / pager are read-only and safe, even while someone else is working in the queue.

---

## 2. Before you run

| Need | Detail |
|---|---|
| Node + packages | `npm install` once |
| Settings file | `C:\Users\admin\Desktop\Gold Module\.env` – `BASE_URL`, `CHECKER_BH_USER`, `CHECKER_BH_PASSWORD`; optional `INT_APPRAISER1_*`, `INT_APPRAISER2_*`, `AUDITOR_*` (role test) |
| Data in the queue | Tests use whatever loans are there (waiting, approved & disbursed, reverted). A test whose status has no loans **skips itself** with the reason. READ_05 uses `test-data\last-disbursal.json` |
| Server | Must be reachable (see Troubleshooting) |

---

## 3. Commands

| Command | What it does |
|---|---|
| `npm run disbapp-functional` | The 79 tests (headless) |
| `npm run disbapp-functional:headed` | Same, browser visible |
| `npm run disbapp-functional:qmetry` | Runs the suite, then builds **all** reports and exports |
| `npm run disbapp-reports` | Rebuilds every report from `test-results/disbapp-run.json` without re-running |
| `npm run disbapp-smoke` | 7 quick read-only tests (a few minutes) |
| `npm run report` | Opens the Playwright HTML report |

One scenario: `npx playwright test GoldDisbursalApproval/tests/gold-disbursal-approval-functional.spec.js -g "SEARCH_01" --headed`

**Time:** about **60–80 minutes** (the recorded run took 79 minutes; many tests open several loan pages). Tests are independent: they can be run in any order or one at a time.

---

## 4. The tests (79, all 26 test types)

| # | Test type | Test cases | What is checked |
|---|---|---|---|
| 1 | Positive / Create | CREATE_01 | N/A – disbursals are created in the Loan Disbursal form |
| 2 | Read / Persistence | READ_01–06 | 11 columns and complete rows; **All = Waiting + Approved + Reverted**; approved and reverted loan pages show every field; your flow's loan is listed with its amount; reload |
| 3 | Update / Edit | UPDATE_01, 02 | Approve & Disburse **not executed**; a finished loan's page is read-only (only Back) |
| 4 | Delete & Cancel | CANCEL_01–03, DELETE_01 | Back returns to the queue; Back keeps the status view (HYPOTHESIS); Revert **not executed**; no delete (N/A) |
| 5 | Negative / Required field | REQUIRED_01 | Revert remark rule **not executed** |
| 6 | Input validation | INPUT_01–04 | Script / SQL text, spaces only, spaces around a loan number, Unicode in the search box |
| 7 | Boundary values | BOUNDARY_01–03 | 1-character and 2,000-character searches; last page shows the remaining rows |
| 8 | Default values | DEFAULT_01, 02 | Opens on Branch Head queue / Waiting for Approval; All is newest first |
| 9 | Date / calendar | DATE_01–03 | Entered On format and not in the future; Aging format (`0h`, `-`) |
| 10 | Business rules / Calculation | BUSINESS_01–05 | **Net Payout = Sanctioned − Charges − Broken Interest**; approved loans have voucher + approver; approver ≠ maker; waiting loans have none; history matches status |
| 11 | Data consistency | CONSISTENCY_01–03 | Grid vs loan page; pager total vs rows over all pages; CASH / BANK mode |
| 12 | Duplicate prevention | DUPLICATE_01 | No identical entries (a loan may have several entries after a revert + resubmit) |
| 13 | Search | SEARCH_01–07 | Loan no, customer (lower case), mobile, branch, maker; unknown ("No disbursals here."); clearing |
| 14 | Filtering | FILTER_01–03 | Each status shows only that status; "My submissions"; search + status together |
| 15 | Sorting | SORT_01 | N/A – headers are not sortable |
| 16 | Pagination | PAGINATION_01–03 | "1 - 10 of N items"; first / previous / next / last; page numbers |
| 17 | Clear / Reset | CLEAR_01 | Clearing the search keeps the status view |
| 18 | Navigation & UI layout | NAV_01–04 | Title and URL; Review / View labels; loan page URL; browser Back |
| 19 | Role-based access | ROLE_01 | Internal Appraisers 1 / 2 and Auditor cannot open the queue |
| 20 | Workflow (approval) | WORKFLOW_01–03 | A waiting loan offers Back / Approve & Disburse / Revert (**looked at, never clicked**); history SUBMIT → APPROVE / REVERT; approving **not executed** |
| 21 | API | API_01–05 | List API 200 + JSON; detail call; refused without login; **no write requests while browsing**; direct approve **not executed** |
| 22 | Error recovery | ERROR_01, 02 | List call fails → page recovers; invalid loan id → no Approve button |
| 23 | File download / upload | FILE_01 | N/A – no export |
| 24 | Accessibility & responsive | A11Y_01–05 | Phone / tablet width; accessible names; Tab order; other browsers **not executed** |
| 25 | Session / concurrency / browser | SESSION_01–06 | No login (queue and loan page); storage cleared; refresh; double-click View; two approvers **not executed** |
| 26 | Field length & autocomplete | LENGTH_01, 02 | Search box maximum length |

---

## 5. Reports and deliverables (`GoldDisbursalApproval\reports\`)

| File | What it is |
|---|---|
| `Qmetry-GoldDisbursalApproval.html` | Filterable report: summary, 26-type grid, **coverage reconciliation**, **requirement coverage**, every test with steps / expected / actual / screenshot |
| `QMetry-Import-GoldDisbursalApproval.csv` | One row per step, for QMetry **Import from Excel/CSV** (Upload File → Map Fields → Import). Summary and Step Summary are the mandatory QMetry fields; map the other columns in the Map Fields step |
| `Execution-Results-GoldDisbursalApproval.csv` | One row per test: ID, requirement, steps, expected, actual, status, evidence, defect ID, script, timestamp, duration |
| `Traceability-GoldDisbursalApproval.csv` | Requirement → test → script → status → evidence → defect |
| `Reconciliation-and-Gaps-GoldDisbursalApproval.md` | Generated / Automated / Discovered / Executed / Passed / Failed / Blocked / Skipped / Not executed / N/A; coverage by the 37 test categories; reasons for every not-executed test; final gap list |
| `Defect-Candidates-GoldDisbursalApproval.md` | Failed tests with reproducible steps (**candidates, not confirmed**) |
| `execution-results.json` | Machine-readable results everything else is built from |

Evidence screenshots, videos and traces stay in the `test-results-disb*` folders.

To merge a re-run of a few tests over the main results:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME="test-results-disb-b/fix.json"
npx playwright test GoldDisbursalApproval/tests/gold-disbursal-approval-functional.spec.js -g "API_01|API_03" --output=test-results-disb-b --reporter=list,json
node GoldDisbursalApproval/build-reports.js test-results-disb/disb.json test-results-disb-b/fix.json
```

---

## 6. Last result (16 Oct 2026, host214 `http://host214.kapilits.com:8411/`)

**79 test cases: 60 passed, 8 failed, 7 not executed, 4 not applicable, 0 blocked.** The safety guard saw **no approve / revert / disburse request**. At the time the queue held 2 waiting, 21 approved & disbursed and 1 reverted loan (24 in All).

Defect candidates (**not confirmed** – each needs a human to confirm the expected behaviour; details in `reports/Defect-Candidates-GoldDisbursalApproval.md`):

| ID | Finding |
|---|---|
| DC-DISBAPP-005 | **The page offset is not reset when the filter changes.** Open "Approved & Disbursed" page 3, then switch to "Reverted" (1 loan): the grid is empty ("No disbursals here.") and the pager reads **"21 - 1 of 1 items"**; the reverted loan only appears after clicking the first-page button. |
| DC-DISBAPP-001 | **Reloading a loan's page sends the user to the Dashboard** (the loan page is not restored). The queue behaves the same after a refresh (SESSION_04). |
| DC-DISBAPP-002 | **Back on a loan's page returns to "Waiting for Approval"**, not to the status view the user came from (for example "Reverted"). |
| DC-DISBAPP-003 / 004 | The search does not trim spaces: a search of only spaces shows **no rows** (instead of the full list) and `"  GLNG…  "` finds nothing. |
| DC-DISBAPP-006 | The search box and the two filter dropdowns have no accessible name. |
| DC-DISBAPP-007 / 008 | The search box has **no maximum length**: a 5,000-character paste is kept in full. |

What passed that matters most: **All = Waiting + Approved + Reverted**; every status filter shows only its status; **Net Payout = Sanctioned − Charges − Broken Interest** on waiting, approved and reverted loans (for example 93,000 − 0 − 132 = 92,868); approved loans have a voucher number and an approver who is not the maker; histories read SUBMIT → APPROVE / REVERT; finished loans have only a Back button; the list API is refused without a login; the queue and loan pages show nothing without a login; only the admin can open the queue.

Observations (not defects): a loan can have **several entries** (loan `GLNG0126060000004` was reverted and resubmitted), so loan numbers are not unique – an entry is loan + status + entered-on; the action button is "Review" on waiting loans and "View" on finished ones; there is no export and the headers are not sortable; the empty message here is "No disbursals here." (not "No records available.").

Not executed: UPDATE_01 (Approve & Disburse), CANCEL_03 (Revert), REQUIRED_01 (Revert remark), WORKFLOW_03, API_05 (direct approve / revert call), SESSION_06 (two approvers), A11Y_04 (Firefox / WebKit not installed). Not applicable: CREATE_01, DELETE_01, SORT_01, FILE_01.

Tests re-written or re-run after the first run (and why): DUPLICATE_01 (a loan can have several entries), WORKFLOW_02 (the word "REVERT" inside a remark was counted as a second action), NAV_01 (the heading text also appears in the menu), CONSISTENCY_03 (the loan must be opened from its own status view), SEARCH_06 (the empty-result wording), API_01 / API_03 / ERROR_01 (page-load timeouts on a slow server).

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `page.reload … Timeout` / `locator.fill … input:not([type=password])` during login | The server is slow or down. Check `BASE_URL`, wait, re-run those tests. On 16 Oct host214 answered "400 Invalid Hostname" for a while and then recovered |
| Login fails although the server is up | Something blocked the login call. The suite's guard only blocks approve / revert / disburse / voucher writes, never the login |
| A test is skipped: "No <status> in the queue right now" | The queue has no loan with that status; the test needs one |
| `afterEach` fails with "must never post an approval…" | A write that looks like an approval was attempted and blocked – do not remove the guard; check which action caused it |
| Using an installed Chrome | `$env:PW_CHROMIUM_PATH="C:\...\chrome.exe"` |
