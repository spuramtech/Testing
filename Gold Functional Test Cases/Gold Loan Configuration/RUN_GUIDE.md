# Gold Loan Configuration – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
```

Forms in this module:

| Form | Folder | Test IDs | Short command |
|---|---|---|---|
| Daily Gold Rate | `Gold Loan Configuration\Daily Gold Rate` | TC_GR_001 – TC_GR_064 | `npm run dailygoldrate` |

Gold Rate Approval Queue and Gold Scheme Matrix are separate forms – see `..\Gold Rate Approval Queue\RUN_GUIDE.md` and `..\Gold Scheme Matrix\RUN_GUIDE.md`.

---

## 1. One-time setup

```powershell
npm install
npx playwright install chromium
```

## 2. URL and logins

All tests read `C:\Users\Admin\OneDrive\Desktop\Gold Module\.env` (the same file Gold Flow Entry uses):

```
BASE_URL=http://host214.kapilits.com:8411/
INT_APPRAISER1_USER=...   INT_APPRAISER1_PASSWORD=...    ← maker (tryfinsta)
CHECKER_BH_USER=...       CHECKER_BH_PASSWORD=...        ← checker (admin)
```

Change the URL for one run only:

```powershell
$env:BASE_URL="http://host214.kapilits.com:8411/"; npm run dailygoldrate:smoke
Remove-Item Env:BASE_URL
```

Before running: the server must be up and both logins must work. Run **one test session at a time** – all tests use the same maker login.

---

## 3. Run the whole module or list forms

| Command | What it does |
|---|---|
| `npm run forms` | Lists every form and its run command |
| `npm run test:gold-loan-configuration` | Runs every form in Gold Loan Configuration |
| `npm run form -- "Gold Loan Configuration"` | Same as above |
| `npm run test:all` | Runs every form in every module |
| `npm run test:all:smoke` | Smoke tests of every form |

## 4. Daily Gold Rate

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run dailygoldrate` | All 61 automated tests + report | 12–15 min |
| `npm run dailygoldrate:smoke` | 6 quick checks (navigation, grid, New panel, calculation, required field, create*) | 1–4 min |
| `npm run dailygoldrate:regression` | All @regression tests | 12–15 min |
| `npm run dailygoldrate:api` | API tests (TC_GR_050, 051) | 1 min |
| `npm run dailygoldrate:headed` | All tests with the browser visible | 12–15 min |
| `npm run dailygoldrate:report` | Rebuilds the report from the last run and opens `QMetryReport.html` | seconds |
| `npm run dailygoldrate:discover` | Re-scans the screen (screenshots + field list into `evidence\discovery`) | 1 min |

\* the create test is skipped unless data creation is switched on (section 6).

### Run part of the form

```powershell
npm run form -- "Daily Gold Rate" --grep TC_GR_030              # one test case
npm run form -- "Daily Gold Rate" --grep "TC_GR_030|TC_GR_037"  # several test cases
npm run form -- "Daily Gold Rate" --grep TC_GR_030 --headed     # one test, browser visible
npm run form -- "Daily Gold Rate" --grep "24K input"            # by words in the test title
npm run form -- "daily-gold-rate" --grep @smoke                 # the short name also works
```

Run one test group (folder) of the form:

```powershell
npm run form -- "Daily Gold Rate" tests/validation               # one group
npm run form -- "Daily Gold Rate" tests/negative tests/api       # several groups
npm run form -- "Daily Gold Rate" tests/validation --headed      # one group, browser visible
```

Rerun only some tests and keep the rest of the last full result in the report (e.g. after a timeout):

```powershell
npm run form -- "Daily Gold Rate" --grep "TC_GR_009|TC_GR_012" --rerun
```

Test groups: `functional`, `validation`, `business-rules`, `negative`, `positive`, `api`, `regression`.

### Test types (categories) and their IDs

| Category | Test IDs (TC_GR_…) |
|---|---|
| Positive / Create | 041 |
| Read / Persistence | 042, 053 |
| Update / Edit | 044 |
| Delete & Cancel | 045, 046 |
| Negative / Required field | 037, 038, 040 |
| Input validation (24K) | 015, 019–027, 062 |
| Boundary values | 016, 028, 029 |
| Default values | 003, 013, 014 |
| Date / calendar validation | 017, 018 |
| Business rules / Calculation | 030, 031, 033, 034, 035, 036 |
| Data consistency | 007, 032 |
| Duplicate prevention | 039 |
| Search | 009, 010, 011, 063 |
| Filtering | 004, 005 |
| Sorting | 006 |
| Pagination | 008 |
| Clear / Reset | 052 |
| Navigation & UI layout | 001, 002, 064 |
| Role-based access | 047, 048, 049 |
| Workflow (approval) | 056 |
| API | 043, 050, 051 |
| Error recovery | 060, 061 |
| File download | 012 |
| Accessibility & responsive | 054, 055 |

Example – run one category: `npm run form -- "Daily Gold Rate" --grep "TC_GR_0(09|10|11|63)"` (Search).

---

## 5. Options

Set before the command; remove afterwards with `Remove-Item Env:<NAME>`.

| Option | Default | Example | Meaning |
|---|---|---|---|
| `BROWSER` | chromium | `$env:BROWSER="firefox"; npm run dailygoldrate:smoke` | chromium / firefox / webkit (install first: `npx playwright install firefox`) |
| `MAKER_ROLE` | INT_APPRAISER1 | `$env:MAKER_ROLE="INT_APPRAISER2"` | which `.env` account is the maker |
| `CHECKER_ROLE` | CHECKER_BH | `$env:CHECKER_ROLE="CHECKER_BH"` | which `.env` account is the checker |
| `WORKERS` | 1 | – | keep 1 (same login for all tests) |
| `ALLOW_DATA_CREATION` | 0 | see section 6 | runs create / update / delete tests |
| `ALLOW_APPROVAL` | 0 | see section 6 | runs the checker approval test |

## 6. Tests that change data (off by default)

| Tests | Switch on | Why it is off |
|---|---|---|
| TC_GR_041 – 044, 046 (create, read-back, payload, update, delete) | `$env:ALLOW_DATA_CREATION="1"; npm run form -- "Daily Gold Rate" --grep "TC_GR_04[1-6]"` | A new back-dated rate can lock at once and then **cannot be deleted** |
| TC_GR_056 (checker approves a pending Internal Rate) | `$env:ALLOW_APPROVAL="1"; npm run form -- "Daily Gold Rate" --grep TC_GR_056` | Approves a real rate that other users see |

Switch them off again afterwards:

```powershell
Remove-Item Env:ALLOW_DATA_CREATION
Remove-Item Env:ALLOW_APPROVAL
```

Records already left on host214 (locked): **01/06/2026 ₹14,555.50** and **04/07/2026 ₹14,268.22** – see `Daily Gold Rate\test-data\last-created-rate.json`.

---

## 7. Reports

After every run the form's reports are rebuilt in `Daily Gold Rate\reports\`:

| File | Use |
|---|---|
| `QMetryReport.html` | Summary cards, **Test types** table, filters (category, status, priority), steps / expected / actual / evidence per test |
| `qmetry-import.csv` | Import into QMetry (one row per step, with Test Type column) |
| `execution-results.json` | Machine-readable results |
| `reconciliation.md` | Generated / Automated / Discovered / Executed / Passed / Failed / … per test |
| `playwright-html\` | Playwright report with traces and videos: `npx playwright show-report "Gold Loan Configuration/Daily Gold Rate/reports/playwright-html"` |

Open the QMetry report: `npm run dailygoldrate:report`

The report always shows the **latest run only** – a smoke run replaces the result of a full run.

## 8. When something fails

| Message | Cause | Fix |
|---|---|---|
| `Missing INT_APPRAISER1_USER / ..._PASSWORD in .env` | login not in `Gold Module\.env` | add the keys |
| `Timeout … waiting for URL /#\/Dashboard/` | server slow or login wrong | check `BASE_URL` and the password, rerun |
| `browserContext.newPage: Test timeout` | browser failed to start (machine busy) | rerun the test |
| Test SKIPPED: `ALLOW_DATA_CREATION=1 not set` | data-changing test, off by default | section 6 |
| Test SKIPPED: `no editable row …` | every recent rate is already approved / locked | expected – nothing to edit that day |
| Test FAILED with an app message | possible application defect | see `Daily Gold Rate\docs\coverage-gap-report.md` (DC-001 – DC-009) |

Results depend on the date and live data (e.g. the default Trans Date check expects the previous working day; new rates or approvals change the grid checks).
