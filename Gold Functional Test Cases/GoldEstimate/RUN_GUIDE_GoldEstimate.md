# Gold Estimate – Run Guide

Screen under test: **Loans → Gold → Gold Estimates** (New Estimate form) and **My Saved Estimates** (`#/Loans/MyGoldEstimates`), logged in as **Internal Appraiser 1**.

Run every command in **PowerShell** from the automation folder:

```
C:\Users\admin\Desktop\Gold Module\Gold Flow Entry
```

---

## Folder layout

Everything for this form lives in the `GoldEstimate` folder:

```
Gold Flow Entry${dir}  RUN_GUIDE_GoldEstimate.md    this guide
  run-qmetry.js                runs the functional suite, then builds the report
  qmetry-meta.js               steps / expected results shown in the report
  tests                       gold-estimate.spec.js, gold-estimate-functional.spec.js
  test-datacoverage-estimate.json   GE number saved by CREATE_01 (read by the Approval suite)
  reportsQmetry-GoldEstimate.html
```

Shared helpers (login page, flow file, report generator and its 26-type list) stay in `pages`, `utils` and `test-data` at the top level, because every form uses them.

---

(The page object `pages/GoldEstimatePage.js` stays in the shared `pages` folder because the external-appraiser spec also uses it.)

---

## 1. Before you run

| Need | Detail |
|---|---|
| Node + packages | `npm install` once (Playwright 1.48.2 and dotenv are already in `node_modules`) |
| Settings file | `C:\Users\admin\Desktop\Gold Module\.env` (one level above the automation folder) |
| Required keys | `BASE_URL` (keep the trailing `/`), `INT_APPRAISER1_USER`, `INT_APPRAISER1_PASSWORD` |
| Optional keys | `CHECKER_BH_*` and `AUDITOR_*` (only used by the role-access test) |
| A contact | **Original test:** run `npm run contact` first (the estimate uses that flow's contact). **Functional suite:** uses the contact in `Contact/test-data/coverage-contact.json` (created by the Contact coverage suite). Override with `$env:ESTIMATE_CONTACT="<mobile>"` |
| Contact availability | A contact that already has an estimate in the approval chain **disappears from the Contact dropdown** (seen after the Approval suite approved GE2610000025). Read-only tests fall back to any other AUTOTEST contact; **CREATE_01 needs a fresh contact**: run `npx playwright test Contact/tests/contact-coverage.spec.js -g "CREATE_01"` first |
| A scheme | The suite picks the newest scheme whose name contains `AUTOTEST SCHEME`; if none exists it falls back to the first scheme in the list. Override with `$env:ESTIMATE_SCHEME="<name>"` |

Run against another server for one run only:

```powershell
$env:BASE_URL="http://host214.kapilits.com:8411/"; npm run estimate
```

> **Test data warning:** a saved estimate gets a GE number and enters the approval queue, and estimates **cannot be deleted**. `npm run estimate` saves one every run. The functional suite saves only **one** (CREATE_01); all its other tests stop at the "Review Gold Estimate" dialog and never click Confirm & Save.

---

## 2. Commands

| Command | What it does |
|---|---|
| `npm run estimate` | Original test **TC_GOLDEST_001**: creates one estimate for the current flow's contact and stores the GE number in `current-flow.json` |
| `npm run estimate:headed` | Same, browser visible |
| `npm run estimate-functional` | **46 functional tests** across 26 test types (headless) |
| `npm run estimate-gap` | **39 gap-closing tests** (persistence on the Summary page, boundaries, API payload, recovery, session, accessibility …); none of them saves an estimate |
| `npm run estimate-smoke` | Fast smoke check (9 tests, a few minutes; not yet timed) |
| `npm run estimate-functional:headed` | Same, browser visible – good for watching or debugging |
| `npm run estimate-reports` | Rebuilds **all** reports and exports from `test-results/estimate-run.json` without re-running the tests |
| `npm run estimate-functional:qmetry` | Runs the functional **and** gap suites (85 tests), then builds all reports and exports, including **GoldEstimate/reports/Qmetry-GoldEstimate.html** (works even when some tests fail) |
| `npm run report` | Opens the Playwright HTML report (screenshots, video and trace on failure) |

Run one scenario only:

```powershell
npx playwright test GoldEstimate/tests/gold-estimate-functional.spec.js -g "BUSINESS_02" --headed
```

Typical time: functional suite **20–25 minutes**, gap suite **20–25 minutes**, when the server is healthy (host214 can be slower).

---

## 3. Original test – `GoldEstimate/tests/gold-estimate.spec.js`

**TC_GOLDEST_001** selects the flow's contact, the flow's scheme and one RING article, uploads an image, saves, confirms the review dialog and records the GE number in the flow.

| Setting (env var) | Default | Meaning |
|---|---|---|
| `ESTIMATE_CONTACT` | flow contact | Mobile / name to search instead of the flow contact |
| `ESTIMATE_SCHEME` | flow scheme | Scheme name text to select |
| `ESTIMATE_ARTICLE` | `RING` | Article type |
| `ESTIMATE_GROSS_WT` | `10.5` | Gross weight in g. ~10.5 g → Internal Appraiser only; ~80 g or more (> ₹10 lakh) → also External Appraiser 1 |
| `BACK_DATE` | today | `dd/mm/yyyy`; back-dates the Estimate Date |

```powershell
$env:ESTIMATE_GROSS_WT="120.5"; npm run estimate
```

---

## 4. Functional suite – `GoldEstimate/tests/gold-estimate-functional.spec.js`

Runs in file order with one worker. CREATE_01 saves a 10.5 g RING estimate and stores its GE number and routing in `GoldEstimate/test-data/coverage-estimate.json`; later tests read it. **It never touches `test-data/current-flow.json`.**

| # | Test type | Test case(s) | What is checked |
|---|---|---|---|
| 1 | Positive / Create | CREATE_01 | 10.5 g RING estimate saved; GE number returned |
| 2 | Read / Persistence | READ_01 | GE number listed under My Gold Estimates → My GE Numbers |
| 3 | Update / Edit | UPDATE_01 | Changing gross weight 10.5 → 20.5 g recalculates totals |
| 4 | Delete & Cancel | CANCEL_01, DELETE_01 | Leaving the form saves nothing (item count unchanged); DELETE is **N/A** |
| 5 | Negative / Required field | REQUIRED_01–03 | No article → "Add Gold Article"; empty gross weight and no contact do not reach the review dialog |
| 6 | Input validation | INPUT_01 | Gross Weight and Quantity reject letters |
| 7 | Boundary values | BOUNDARY_01–03 | Gross 0, stone wastage larger than gross, quantity 0 |
| 8 | Default values | DEFAULT_01 | Loan Name "Select", scheme "Not applied", 22K, zero totals |
| 9 | Date / calendar validation | DATE_01, DATE_02 | Defaults to today and can be back-dated; future years should be disabled |
| 10 | Business rules / Calculation | BUSINESS_01–03 | Net = gross − stone; appraisal = pure weight × rate/g; scheme LTV % applied to rate/g; two articles add up |
| 11 | Data consistency | CONSISTENCY_01 | Review dialog value equals the Totals box |
| 12 | Duplicate prevention | DUPLICATE_01 | **Skipped** – needs a second real estimate |
| 13 | Search | SEARCH_01, SEARCH_02 | Contact search by mobile; unknown number finds nothing |
| 14 | Filtering | FILTER_01 | My GE Numbers vs Pending My Appraisal tabs |
| 15 | Sorting | SORT_01 | **Skipped** when headers are not sortable |
| 16 | Pagination | PAGINATION_01 | Pager "x - y of z items" shown |
| 17 | Clear / Reset | CLEAR_01 | Clear empties contact, articles and totals |
| 18 | Navigation & UI layout | NAV_01 | My Saved Estimates ↔ New Estimate; section headings shown |
| 19 | Role-based access | ROLE_01 | Gold Estimates per role (recorded as notes) |
| 20 | Workflow (approval) | WORKFLOW_01 | CREATE_01's estimate was routed to an approver |
| 21 | API | API_01 | POST / PUT calls returned 2xx |
| 22 | Error recovery | ERROR_01 | After "Add Gold Article", adding an article opens the review dialog |
| 23 | File download / upload | FILE_01, FILE_02 | PNG uploads; a `.json` file is not accepted |
| 24 | Accessibility & responsive | A11Y_01 | Fits a 390×844 phone; Tab moves focus |
| 25 | Session / concurrency / browser | SESSION_01 | Form is not shown without login |
| 26 | Field length & autocomplete | LENGTH_01 | Remarks has a maximum length |

---

## 5. Qmetry report

`npm run estimate-functional:qmetry` writes **`GoldEstimate/reports/Qmetry-GoldEstimate.html`**: one self-contained file with summary cards, a pass-rate donut, a **coverage grid of all 26 test types** and a searchable, filterable table (click a row for steps, expected / actual result, notes and a screenshot).

* Each run overwrites that file; every form has its own report file (for example `Contact/reports/Qmetry-Contact.html`, `GoldScheme/reports/Qmetry-GoldScheme.html`), so they never overwrite each other. Copy it first if you want to keep an older Estimate report.
* Rebuild the report from the last results without re-running the tests:

```powershell
$env:QMETRY_SUITE="estimate"; node utils/qmetry-report.js test-results/estimate-run.json GoldEstimate/reports/Qmetry-GoldEstimate.html
```

* Merge a re-run of a few tests over the main results (a later file replaces the earlier result for the same test):

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME="test-results-rerun/rerun.json"
npx playwright test GoldEstimate/tests/gold-estimate-functional.spec.js -g "CLEAR_01" --output=test-results-rerun --reporter=list,json
$env:QMETRY_SUITE="estimate"; node utils/qmetry-report.js test-results/estimate-run.json,test-results-rerun/rerun.json GoldEstimate/reports/Qmetry-GoldEstimate.html
```

Playwright empties `test-results` at the start of every run, so use `--output=` as above to keep the first run's screenshots.

---

## 6. Last result (16 Oct 2026, host214 `http://host214.kapilits.com:8411/`)

**85 test cases: 70 passed, 9 failed, 4 not executed, 2 not applicable, 0 blocked.** Estimate saved on host214: **GE2610000033**, routed to Internal Appraiser 2 (test contact AUTOTEST DHHHEF QA, 9067377745). The earlier QC run is kept in `GoldEstimate/reports/Qmetry-GoldEstimate-QC.html` (31 passed, 2 failed, 3 skipped of 36).

Defect candidates (**not confirmed** - each needs a human to confirm the expected behaviour; details in `reports/Defect-Candidates-GoldEstimate.md`):

| ID | Finding |
|---|---|
| DC-EST-003 | **Loan Name is not validated on Save.** Choosing a scheme fills Loan Name with "New Gold"; after setting it back to "Select" the review dialog still opens. (Confirm & Save was not clicked, so what the server does is unknown.) |
| DC-EST-004 / 001 | **Remarks text is changed:** `<b> ok` is stored / shown as `<B> Ok` (each word is capitalised). |
| DC-EST-002 | The uploaded image is stored as `<timestamp>-undefined.png`; the original file name is lost. |
| DC-EST-007 | A 6 MB file is accepted as a gold article image (no 5 MB limit enforced; the test file was not a valid image either). |
| DC-EST-006 | The Estimate Date calendar does not disable future years (same as the Contact Date of Birth). |
| DC-EST-005 | Gross Weight accepts non-Latin digits (the other invalid formats are rejected). |
| DC-EST-009 / 008 | 14 controls have no accessible name; the page scrolls sideways on a 390 px phone screen. |

Observations (not defects): a KADA article (30 g, stone wastage 2 g, stone count 2) shows net 27.72 g, a further 1% deduction on top of gross − wastage; Loan Name is preselected to "New Gold" on host214 but "Select" on QC; a contact with an estimate awaiting its first verification is still offered on host214 (on QC it disappeared once Internal Appraiser 2 had approved it).

Not executed: API_05 (direct invalid call – could create an undeletable estimate), SESSION_05 (two users, one contact), A11Y_04 (Firefox / WebKit not installed), DUPLICATE_01 (second estimate for the same contact). Not applicable: DELETE_01, SORT_01.

Tests that were re-written after a first run (and why): DEFAULT_01 and REQUIRED_04 (the loan default differs between servers); BUSINESS_07 (purity / stone deduction is not just gross − wastage); DUPLICATE_02 (my first hypothesis was refuted, so it now records the behaviour).

---

## Deliverables (`GoldEstimate/reports/` and `GoldEstimate/`)

| File | What it is |
|---|---|
| `Qmetry-GoldEstimate.html` | The filterable report: summary, 26-type grid, **coverage reconciliation**, **requirement coverage**, every test with steps / expected / actual / screenshot |
| `QMetry-Import-GoldEstimate.csv` | One row per test step, for QMetry **Import from Excel/CSV** (Upload File → Map Fields → Import). Summary and Step Summary are the mandatory QMetry fields; map the other columns in the Map Fields step because column names differ between QMetry versions |
| `Execution-Results-GoldEstimate.csv` | One row per test: ID, requirement, screen, steps, expected, actual, status, evidence, defect ID, script, timestamp, duration |
| `Traceability-GoldEstimate.csv` | Requirement → test → script → status → evidence → defect |
| `Reconciliation-and-Gaps-GoldEstimate.md` | Generated / Automated / Discovered / Executed / Passed / Failed / Blocked / Skipped / Not executed / N/A, coverage by the 37 test categories, reasons for every not-executed test and the final gap list |
| `Defect-Candidates-GoldEstimate.md` | Failed tests with reproducible steps (candidates only) |
| `execution-results.json` | Machine-readable results the other files are built from |
| `../REQUIREMENTS_GoldEstimate.md` | Requirement / business-rule inventory (29 items, Observed or Hypothesis, status computed from the results) |

Evidence screenshots, videos and traces stay in the `test-results-estimate-h214*` folders (the CSV evidence column points to them).

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `page.waitForURL … Timeout 60000ms` during login | QC is slow or hung. Re-run just those tests with `-g "<id>"` |
| `Missing INT_APPRAISER1_USER / …_PASSWORD in .env` | Add the keys to `C:\Users\admin\Desktop\Gold Module\.env` |
| `current-flow.json has no "mobile"` (original test) | Run `npm run contact` first |
| Functional tests fail at the contact step | `Contact/test-data/coverage-contact.json` is missing: run `npx playwright test Contact/tests/contact-coverage.spec.js -g "CREATE_01"` or set `$env:ESTIMATE_CONTACT` |
| `No scheme matching "…"` | The scheme name is not offered; set `$env:ESTIMATE_SCHEME` to an available scheme |
| Tests after CREATE_01 say "CREATE_01 must have saved an estimate" | CREATE_01 failed; fix it first (the READ / WORKFLOW / API tests need its saved GE number) |
| `Save did not open "Review Gold Estimate"` | The app rejected the save; the error message is included in the failure text |
| Using an installed Chrome | `$env:PW_CHROMIUM_PATH="C:\...\chrome.exe"` |

---

## 8. Files

| File | Purpose |
|---|---|
| `GoldEstimate/tests/gold-estimate.spec.js` | Original create-one-estimate test (TC_GOLDEST_001) |
| `GoldEstimate/tests/gold-estimate-functional.spec.js` | 46 functional tests, 26 test types |
| `GoldEstimate/tests/gold-estimate-gap.spec.js` | 39 gap-closing tests (never saves an estimate) |
| `GoldEstimate/requirements.js`, `build-reports.js`, `export.js` | Requirement inventory; one-command report build; CSV / Markdown exports |
| `pages/GoldEstimatePage.js` | Page object: menu path, contact / scheme selection, article grid, totals, image upload, review dialog |
| `GoldEstimate/test-data/coverage-estimate.json` | GE number and routing from CREATE_01 (auto-created) |
| `Contact/test-data/coverage-contact.json` | Contact used by the functional suite |
| `utils/qmetry-report.js`, `GoldEstimate/qmetry-meta.js` | Builds the report (`utils/qmetry-report.js` is shared); holds this form's steps / expected results |
| `GoldEstimate/run-qmetry.js` | Runs the suite, then builds the report |
