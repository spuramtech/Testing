# Gold Scheme Matrix – Run Guide

Screen under test: **Loans → Gold → Gold Loan Configuration → Gold Scheme Matrix** (logged in as the Checker / BH admin).

Run every command in **PowerShell** from the automation folder:

```
C:\Users\admin\Desktop\Gold Module\Gold Flow Entry
```

---

## Folder layout

Everything for this form lives in the `GoldScheme` folder:

```
Gold Flow Entry${dir}  RUN_GUIDE_GoldScheme.md      this guide
  run-qmetry.js                runs the functional suite, then builds the report
  qmetry-meta.js               steps / expected results shown in the report
  tests                       gold-scheme.spec.js, gold-scheme-functional.spec.js
  pagesGoldSchemePage.js      page object for the Gold Scheme Matrix
  test-data                   scheme.js (unique data per run), coverage-scheme.json
  reportsQmetry-GoldScheme.html
```

Shared helpers (login page, flow file, report generator and its 26-type list) stay in `pages`, `utils` and `test-data` at the top level, because every form uses them.

---

## 1. Before you run

| Need | Detail |
|---|---|
| Node + packages | `npm install` once (Playwright 1.48.2 and dotenv are already in `node_modules`) |
| Settings file | `C:\Users\admin\Desktop\Gold Module\.env` (one level above the automation folder) |
| Required keys | `BASE_URL` (keep the trailing `/`), `CHECKER_BH_USER`, `CHECKER_BH_PASSWORD` |
| Optional keys | `INT_APPRAISER1_*` and `AUDITOR_*` (only used by the role-access test) |
| Network | The QC server must be reachable. When QC is slow, tests time out on login or page load (see Troubleshooting) |

Run against another server for one run only:

```powershell
$env:BASE_URL="http://host214.kapilits.com:8411/"; npm run scheme-functional
```

---

## 2. Commands

| Command | What it does |
|---|---|
| `npm run scheme` | Original single test **TC_GOLDSCHEME_001**: creates one scheme and stores it in the flow (used by the full flow) |
| `npm run scheme:headed` | Same, with the browser visible |
| `npm run scheme-functional` | **32 functional tests** across 26 test types (headless) |
| `npm run scheme-functional:headed` | Same, browser visible – good for watching or debugging |
| `npm run scheme-functional:qmetry` | Runs the functional suite, then builds **GoldScheme/reports/Qmetry-GoldScheme.html** (also works when some tests fail) |
| `npm run report` | Opens the Playwright HTML report (screenshots, video and trace on failure) |

Run one scenario only:

```powershell
npx playwright test GoldScheme/tests/gold-scheme-functional.spec.js -g "UPDATE_01" --headed
```

Typical time: **15–20 minutes** for the full functional suite when QC is healthy.

---

## 3. Original test – `GoldScheme/tests/gold-scheme.spec.js`

**TC_GOLDSCHEME_001** creates one scheme with unique data per run and checks it appears in the grid.

| Setting (env var) | Default | Meaning |
|---|---|---|
| `SCHEME_TENURE` | `9` | Tenure in months |
| `SCHEME_TYPE` | Bullet | `Monthly` gives Regular Monthly Repayment |
| `SCHEME_RATE` | `18` | Interest % p.a. (paise/month = rate ÷ 12) |
| `BACK_DATE` | today | `dd/mm/yyyy`; sets Scheme Effective From so back-dated estimates can use the scheme |

```powershell
$env:SCHEME_TYPE="Monthly"; $env:SCHEME_TENURE="12"; $env:BACK_DATE="13/07/2026"; npm run scheme
```

Each run creates a scheme named `AUTOTEST SCHEME nnnnn` with code `AT-nnnnn`.

---

## 4. Functional suite – `GoldScheme/tests/gold-scheme-functional.spec.js`

Runs in file order with one worker. The first test creates a scheme and saves it to `GoldScheme/test-data/coverage-scheme.json`; later tests edit, check and finally **delete** it. The suite also deletes the second scheme it creates during error recovery, so it leaves QC clean when it completes.

| # | Test type | Test case(s) | What is checked |
|---|---|---|---|
| 1 | Positive / Create | CREATE_01 | Bullet 9 mo, 18% scheme is saved and listed |
| 2 | Read / Persistence | READ_01 | Row shows code, name, tenure, type, interest, paise/mo and 3 LTV slabs after a fresh login |
| 3 | Update / Edit | UPDATE_01, UPDATE_02 | Edit rate to 12%; Scheme-on toggle persists after reload |
| 4 | Delete & Cancel | CANCEL_01, DELETE_01, DELETE_02 | Leaving the form saves nothing; Delete removes the AUTOTEST schemes |
| 5 | Negative / Required field | REQUIRED_01, REQUIRED_02 | Empty form → "Please fill all mandatory fields…"; missing Scheme Code is rejected |
| 6 | Input validation | INPUT_01 | Interest and Tenure reject letters |
| 7 | Boundary values | BOUNDARY_01, BOUNDARY_02 | Tenure 0 and rate 150% are rejected |
| 8 | Default values | DEFAULT_01 | Tenure 3, Bullet, rate 0, Effective From = today, Active |
| 9 | Date / calendar validation | DATE_01 | Effective From can be back-dated one year via the calendar |
| 10 | Business rules / Calculation | BUSINESS_01 (12/18/24%), BUSINESS_02 | Every slab shows rate ÷ 12 paise/month; Add Slab adds a row |
| 11 | Data consistency | CONSISTENCY_01 | Edit form equals what was saved |
| 12 | Duplicate prevention | DUPLICATE_01 | Same code + tenure cannot be created twice |
| 13 | Search | SEARCH_01 | **N/A** – no search box |
| 14 | Filtering | FILTER_01 | **N/A** – no column filters |
| 15 | Sorting | SORT_01 | Tenure header orders the grid |
| 16 | Pagination | PAGINATION_01 | Pager summary matches rows; next page opens |
| 17 | Clear / Reset | CLEAR_01 | **N/A** – no Clear / Reset button |
| 18 | Navigation & UI layout | NAV_01 | Form opens, grid and all column headers show again |
| 19 | Role-based access | ROLE_01 | Checker/BH can open the matrix; other roles are recorded in the report notes |
| 20 | Workflow (approval) | WORKFLOW_01 | **N/A** – schemes go live when saved |
| 21 | API | API_01 | All POST / PUT / DELETE calls returned 2xx |
| 22 | Error recovery | ERROR_01 | Rejected save, then double-click Save → exactly one scheme |
| 23 | File download / upload | FILE_01 | **N/A** – no import / export |
| 24 | Accessibility & responsive | A11Y_01 | Form fits a 390×844 phone; Tab moves focus |
| 25 | Session / concurrency / browser | SESSION_01 | Screen is not shown without login |
| 26 | Field length & autocomplete | LENGTH_01 | Scheme Code / Name have a maximum length |

---

## 5. Qmetry report

`npm run scheme-functional:qmetry` writes **`GoldScheme/reports/Qmetry-GoldScheme.html`**. It is one self-contained file you can open in any browser or send as-is. It contains:

* Summary cards (total / passed / failed / skipped / time) and a pass-rate donut
* A **coverage grid of all 26 test types**
* A searchable, filterable table; click a row for steps, expected / actual result, notes and a screenshot

Each run overwrites that file; every form has its own report file, so they never overwrite each other. Copy it first if you want to keep an older Scheme report.

Build the report again from the last results without re-running the tests:

```powershell
$env:QMETRY_SUITE="scheme"; node utils/qmetry-report.js test-results/scheme-run.json GoldScheme/reports/Qmetry-GoldScheme.html
```

To merge a re-run of a few tests over the main results, pass both files (a later file replaces the earlier result for the same test):

```powershell
$env:QMETRY_SUITE="scheme"; node utils/qmetry-report.js test-results/scheme-run.json,test-results-rerun/rerun.json GoldScheme/reports/Qmetry-GoldScheme.html
```

Add `--output=test-results-rerun` and `PLAYWRIGHT_JSON_OUTPUT_NAME=test-results-rerun/rerun.json` to the re-run command so Playwright does not wipe the first run's screenshots.

---

## 6. Last result (15 Oct 2026, QC)

**28 passed, 1 failed, 5 skipped (not applicable) of 34.**

| Item | Result |
|---|---|
| LENGTH_01 – **failed** | Scheme Code and Scheme Name have no `maxlength`, so the form does not limit their length. Treated as a possible defect. |
| Role access | Checker/BH can open the matrix; Internal Appraiser cannot; Auditor login timed out (unknown) |
| N/A | Search, Filtering, Clear/Reset, Workflow approval, File upload |

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `page.waitForURL … Timeout 60000ms` during login | QC is slow or hung. Re-run just those tests with `-g "<id>"`; they usually pass when QC recovers |
| `Missing CHECKER_BH_USER / CHECKER_BH_PASSWORD in .env` | Add the keys to `C:\Users\admin\Desktop\Gold Module\.env` |
| Tests after CREATE_01 fail with "Cannot read properties of undefined" | CREATE_01 did not save. Fix that first (or check `GoldScheme/test-data/coverage-scheme.json`) |
| Leftover `AT-nnnnn` schemes in the grid | A run stopped before the DELETE tests. Delete them with the Delete icon on the row |
| Using an installed Chrome | `$env:PW_CHROMIUM_PATH="C:\...\chrome.exe"` |
| Playwright reports "No tests found" | A syntax error in the spec; run `node --check GoldScheme/tests/gold-scheme-functional.spec.js` |

---

## 8. Files

| File | Purpose |
|---|---|
| `GoldScheme/tests/gold-scheme.spec.js` | Original create-one-scheme test (TC_GOLDSCHEME_001) |
| `GoldScheme/tests/gold-scheme-functional.spec.js` | 32 functional tests, 26 test types |
| `GoldScheme/pages/GoldSchemePage.js` | Page object: menu path, form fields, slab table, messages |
| `GoldScheme/test-data/scheme.js` | Unique scheme data per run |
| `GoldScheme/test-data/coverage-scheme.json` | Scheme shared between functional tests (auto-created) |
| `utils/qmetry-report.js`, `GoldScheme/qmetry-meta.js` | Builds the report (`utils/qmetry-report.js` is shared) and holds this form's steps / expected results |
| `GoldScheme/run-qmetry.js` | Runs the suite, then builds the report |
