# Gold Slab Config (Gold Estimate Slab Configuration) – Run Guide

Screen under test: **Loans → Gold → Gold Loan Configuration → Estimate Approval Slabs** (route `?open=GoldEstimateSlabConfig`, screen title *Gold Estimate Slab Configuration*), logged in as the **Checker / BH admin**. It holds the amount-range **slabs that decide how many Internal (1–2) and External (0–2) appraisers an estimate needs**.

> **Which screen is "Gold Slab Config"?** The menu has no item with that exact name. I used *Estimate Approval Slabs* (title "Gold Estimate Slab Configuration"). The other slab-style screens (LTV Slab Master, Gold Loan Rebate, Purity / Stone Deduction) are **not** covered here.

Run every command in **PowerShell** from the automation folder:

```
C:\Users\admin\Desktop\Gold Module\Gold Flow Entry
```

---

## Folder layout

```
Gold Flow Entry\GoldSlabConfig\
  RUN_GUIDE_GoldSlabConfig.md        this guide
  REQUIREMENTS_GoldSlabConfig.md     requirement / business-rule inventory (22 items, status computed from the results)
  requirements.js, qmetry-meta.js    the requirement data and the steps / expected results shown in the report
  run-qmetry.js, build-reports.js, export.js    run the suite and build every report / export
  pages\GoldSlabPage.js              page object (refuses to touch the real slabs)
  tests\gold-slab-config-functional.spec.js     63 tests, 26 test types
  test-data\coverage-slab.json       the test slab recorded by CREATE_01 (auto-created)
  reports\                           Qmetry-GoldSlabConfig.html and the CSV / Markdown deliverables
```

---

## 1. SAFETY – read before running

These slabs control **who must approve every Gold Estimate**. A wrong slab changes real approvals for everyone on the server. The suite is built so that:

* the **5 real slabs** (0 … 10,00,00,000) are **only read**; the page object throws if a test tries to edit or delete a slab that starts at or below 10,00,00,000;
* every slab the tests create starts **above 10 crore (10,00,00,001+)**, where no real estimate can fall, and is deleted again;
* a cleanup step before and after the suite removes stray test slabs; the **last test (DELETE_02) checks that the 5 real slabs are exactly as before** and that no test slab is left;
* tests that cannot be run safely (direct invalid API calls, two users changing slabs at once) are **not executed**.

If a run is interrupted, open the screen and delete any slab starting at 10,00,00,001 or higher (Delete icon → Yes). Never delete the first 5 slabs.

---

## 2. Before you run

| Need | Detail |
|---|---|
| Node + packages | `npm install` once |
| Settings file | `C:\Users\admin\Desktop\Gold Module\.env` – `BASE_URL`, `CHECKER_BH_USER`, `CHECKER_BH_PASSWORD`; optional `INT_APPRAISER1_*`, `INT_APPRAISER2_*`, `AUDITOR_*` (role test) |
| Estimate for one test | CONSISTENCY_03 compares a saved estimate with its slab and needs `GoldEstimate/test-data/coverage-estimate.json` (run Gold Estimate CREATE_01 first); it skips itself if missing |
| Server | Must be reachable; a slow server shows up as BLOCKED / failed tests (see Troubleshooting) |

---

## 3. Commands

| Command | What it does |
|---|---|
| `npm run slab-functional` | The 63 tests (headless) |
| `npm run slab-functional:headed` | Same, browser visible |
| `npm run slab-functional:qmetry` | Runs the suite, then builds **all** reports and exports |
| `npm run slab-reports` | Rebuilds every report from `test-results/slab-run.json` without re-running |
| `npm run slab-smoke` | 6 quick read-only tests (a few minutes) |
| `npm run report` | Opens the Playwright HTML report |

One scenario: `npx playwright test GoldSlabConfig/tests/gold-slab-config-functional.spec.js -g "DUPLICATE_01" --headed`

**Time:** about **45–60 minutes** for the whole suite (a first full run took 59 minutes on host214). SESSION_02 alone waits 5 minutes idle.

The tests run **in file order with one worker** and depend on each other: CREATE_01 makes slab A, later tests use it, DELETE_01 removes it. If you re-run only some tests, include CREATE_01 (and DELETE_01 to clean up).

---

## 4. The tests (63, all 26 test types)

| # | Test type | Test cases | What is checked |
|---|---|---|---|
| 1 | Positive / Create | CREATE_01 | A valid slab above 10 crore is saved ("Slab saved.") and listed |
| 2 | Read / Persistence | READ_01–04 | Real slabs have valid counts, are continuous (From = previous To + 1), the top one ends at 10,00,00,000; slab A survives a fresh login |
| 3 | Update / Edit | UPDATE_01, 02 | Change External count and To Amount |
| 4 | Delete & Cancel | CANCEL_01–03, DELETE_01–02 | Cancel on Add / Edit; answering No to "Delete this slab?"; Delete; real slabs untouched at the end |
| 5 | Negative / Required field | REQUIRED_01, 02 | Empty form / To only → "From Amount is required.", nothing sent |
| 6 | Input validation | INPUT_01–05 | Digits only; commas stripped; spaces; script / SQL text; non-Latin digits |
| 7 | Boundary values | BOUNDARY_01–06 | From > To; one-amount slab; overlap by one; inside another slab; **gap**; blank To (open-ended top slab) |
| 8 | Default values | DEFAULT_01 | Empty form, Internal 1, External 0 (disabled) |
| 9 | Date / calendar | DATE_01 | N/A – no dates |
| 10 | Business rules / Calculation | BUSINESS_01–03 | External disabled with 1 Internal; option lists; switching back resets External |
| 11 | Data consistency | CONSISTENCY_01–03 | Indian digit grouping; Edit form = grid; **a saved estimate needs Internal + External stages of the slab its value falls in** |
| 12 | Duplicate prevention | DUPLICATE_01, 02 | Same range / same From as slab A are rejected |
| 13–16, 20, 23 | Search, Filtering, Sorting, Pagination, Workflow, File | SEARCH_01, FILTER_01, SORT_01, PAGINATION_01, WORKFLOW_01, FILE_01 | N/A – the screen has none of these |
| 17 | Clear / Reset | CLEAR_01 | Add Slab reopens empty after Cancel |
| 18 | Navigation & UI layout | NAV_01, 02 | Breadcrumb / Overview; browser Back |
| 19 | Role-based access | ROLE_01 | Appraisers and Auditor cannot open the screen |
| 21 | API | API_01–05 | List API 200 + JSON; save payload; list refused without login; `createdby` in the save URL recorded; direct invalid call **not executed** |
| 22 | Error recovery | ERROR_01, 02 | Overlap rejected then valid save (double-click = one slab); failed save keeps the form values |
| 24 | Accessibility & responsive | A11Y_01–04 | Phone and tablet widths; accessible names; other browsers **not executed** |
| 25 | Session / concurrency / browser | SESSION_01–05 | No login; 5-minute idle behaviour recorded; storage cleared; double-click Add Slab; concurrent writers **not executed** |
| 26 | Field length & autocomplete | LENGTH_01, 02 | Maximum length of From / To; 25-digit number |

---

## 5. Reports and deliverables (`GoldSlabConfig\reports\`)

| File | What it is |
|---|---|
| `Qmetry-GoldSlabConfig.html` | Filterable report: summary, 26-type grid, **coverage reconciliation**, **requirement coverage**, every test with steps / expected / actual / screenshot |
| `QMetry-Import-GoldSlabConfig.csv` | One row per step, for QMetry **Import from Excel/CSV** (Upload File → Map Fields → Import). Summary and Step Summary are the mandatory QMetry fields; map the other columns in the Map Fields step (column names differ between QMetry versions) |
| `Execution-Results-GoldSlabConfig.csv` | One row per test: ID, requirement, steps, expected, actual, status, evidence, defect ID, script, timestamp, duration |
| `Traceability-GoldSlabConfig.csv` | Requirement → test → script → status → evidence → defect |
| `Reconciliation-and-Gaps-GoldSlabConfig.md` | Generated / Automated / Discovered / Executed / Passed / Failed / Blocked / Skipped / Not executed / N/A; coverage by the 37 test categories; reasons for every not-executed test; final gap list |
| `Defect-Candidates-GoldSlabConfig.md` | Failed tests with reproducible steps (**candidates, not confirmed**) |
| `execution-results.json` | Machine-readable results everything else is built from |

Evidence screenshots, videos and traces stay in the `test-results-slab*` folders.

To merge a re-run of a few tests over the main results:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME="test-results-slab-b/fix.json"
npx playwright test GoldSlabConfig/tests/gold-slab-config-functional.spec.js -g "CREATE_01|DUPLICATE_01|DELETE_01|DELETE_02" --output=test-results-slab-b --reporter=list,json
node GoldSlabConfig/build-reports.js test-results-slab/slab.json test-results-slab-b/fix.json
```

---

## 6. Last result (16 Oct 2026, host214 `http://host214.kapilits.com:8411/`)

**63 test cases: 46 passed, 7 failed, 3 not executed, 7 not applicable, 0 blocked.** The 5 real slabs were unchanged at the end and no test slab was left.

Defect candidates (**not confirmed** – each needs a human to confirm the expected behaviour; details in `reports/Defect-Candidates-GoldSlabConfig.md`):

| ID | Finding |
|---|---|
| DC-SLAB-002 | **A slab that leaves a gap is accepted.** The help text says to start each slab at To + 1, but a slab starting one amount later (and, in an earlier probe, 90 crore later) was saved. An estimate whose value falls in the gap would have no slab. |
| DC-SLAB-006 / 007 | From / To Amount have **no maximum length**; a 25-digit number is kept (precision is lost above 16 digits). |
| DC-SLAB-001 | Non-Latin digits (e.g. ١٢٣) are accepted in From Amount (other symbols and letters are removed). |
| DC-SLAB-003 / 005 | The screen scrolls sideways on a 390 px phone and on a 768 px tablet. |
| DC-SLAB-004 | 3 controls on the Add Slab screen (1 input and 2 selects) have no accessible name; the visible labels are not linked to them. |

What passed that matters most: the server **rejects overlapping, nested and exact-duplicate slabs**; the screen blocks an empty From and From > To without sending anything; real slabs are continuous and valid; **a saved estimate's stage count equals Internal + External of the slab its value falls in**; only the admin can open the screen; a failed save keeps the form values; double-clicking Save creates one slab.

Observations (not defects): the save URL carries `createdby=<user id>` from the browser (whether the server ignores a changed value was **not** tested); no inactivity warning or logout appeared within 5 minutes idle (a longer timeout was not tried – an earlier note that a warning exists was wrong: that text sits in a hidden dialog).

Not executed: API_05 (direct invalid API call – needs the login token), SESSION_05 (two writers at once – too risky on the live configuration), A11Y_04 (Firefox / WebKit not installed). Not applicable: DATE, SEARCH, FILTER, SORT, PAGINATION, WORKFLOW, FILE.

Tests re-written after a first run (and why): DUPLICATE_01 (External is disabled with 1 Internal), DELETE_02 (10 crore is 100,000,000, not 1,000,000,000), SESSION_02 (the warning was never observed, so it now records behaviour).

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `page.goto … Timeout` / `page.waitForURL` during login | The server is slow or down. Check `BASE_URL`, wait, re-run the failed tests (include CREATE_01 and DELETE_01) |
| A test slab is left in the list | A run was interrupted. Delete every slab starting at 10,00,00,001 or higher; never touch the first 5 |
| Later tests all skipped | CREATE_01 failed (no slab A). Fix that first |
| CONSISTENCY_03 skipped | No saved estimate: run `GoldEstimate` CREATE_01 first |
| `Refusing to touch slab starting at …` | A test tried to change a real slab – this is the safety guard; do not remove it |
| Using an installed Chrome | `$env:PW_CHROMIUM_PATH="C:\...\chrome.exe"` |
