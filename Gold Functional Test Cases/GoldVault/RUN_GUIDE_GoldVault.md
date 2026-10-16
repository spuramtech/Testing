# Vault (Gold Loan Configuration → Vault) – Run Guide

Screen under test: **Loans → Gold → Gold Loan Configuration → Vault** (route `?open=Vaultconfig`, side panel *Vault Configuration*), logged in as the **Checker / BH admin**. Fields: **Vault Name** (max 250), **Vault Branch** (max 250, free text), **Vault Code** (max 30). The vaults are used by *Safe & Lockers*.

Run every command in **PowerShell** from the automation folder:

```
C:\Users\admin\Desktop\Gold Module\Gold Flow Entry
```

---

## Folder layout

```
Gold Flow Entry\GoldVault\
  RUN_GUIDE_GoldVault.md            this guide
  REQUIREMENTS_GoldVault.md         requirement / business-rule inventory (24 items, status computed from the results)
  requirements.js, qmetry-meta.js   the requirement data and the steps / expected results shown in the report
  run-qmetry.js, build-reports.js, export.js    run the suite and build every report / export
  pages\GoldVaultPage.js            page object (refuses to edit any vault whose code does not start with ATFT)
  tests\gold-vault-functional.spec.js   74 tests, 26 test types
  test-data\coverage-vault.json     the test vault recorded by CREATE_01 (auto-created)
  reports\                          Qmetry-GoldVault.html and the CSV / Markdown deliverables
```

Your original single test (`npm run vault`, `tests\vault.spec.js`, hand-off file `test-data\last-vault.json`) is **unchanged**; this suite never writes the hand-off file.

---

## 1. SAFETY – read before running

**The Vault grid has no delete action.** Every vault that is saved stays. The suite is built around that:

* **One new vault per run** is created (CREATE_01: `AUTOTEST FT Vault nnnnn`, branch `HEAD OFFICE`, code `ATFTnnnnn`). Later tests edit **only that vault** and UPDATE_03 restores its original name and code. Expect **one extra `ATFT…` vault in the list after every full run**.
* The existing vaults (including the hand-off vault of the Safe & Lockers flow) are **only read**; the page object throws if a test tries to edit a vault whose code does not start with `ATFT`.
* Every other test that reaches the save call has the request **aborted in the browser**, so nothing is saved.
* Two tests really send a save to check the server's duplicate rules (DUPLICATE_01 same code, DUPLICATE_02 same name). If the server ever wrongly accepted one, an extra vault named `AUTOTEST FT Vault …` would remain.
* Not executed for safety: an unknown branch (free text, would save an undeletable vault), direct invalid API calls, two users saving the same code.

---

## 2. Before you run

| Need | Detail |
|---|---|
| Node + packages | `npm install` once |
| Settings file | `C:\Users\admin\Desktop\Gold Module\.env` – `BASE_URL`, `CHECKER_BH_USER`, `CHECKER_BH_PASSWORD`; optional `INT_APPRAISER1_*`, `INT_APPRAISER2_*`, `AUDITOR_*` (role test) |
| Hand-off vault | READ_04 uses `test-data\last-vault.json` (from `npm run vault`); it skips itself if the file is missing |
| Server | Must be reachable; a slow server shows up as failed tests with login / page-load timeouts (see Troubleshooting) |

---

## 3. Commands

| Command | What it does |
|---|---|
| `npm run vault-functional` | The 74 tests (headless) |
| `npm run vault-functional:headed` | Same, browser visible |
| `npm run vault-functional:qmetry` | Runs the suite, then builds **all** reports and exports |
| `npm run vault-reports` | Rebuilds every report from `test-results/vault-run.json` without re-running |
| `npm run vault-smoke` | 7 quick read-only tests (a few minutes, creates nothing) |
| `npm run report` | Opens the Playwright HTML report |

One scenario: `npx playwright test GoldVault/tests/gold-vault-functional.spec.js -g "SORT_01" --headed`

**Time:** about **40–60 minutes** on a healthy server. The recorded run took **126 minutes** because the host stalled several times (one test hung for about an hour). Tests run **in file order with one worker**; the update / duplicate / consistency tests need the vault made by CREATE_01 (recorded in `test-data\coverage-vault.json`, so they still work if you re-run only part of the suite after a first full run).

---

## 4. The tests (74, all 26 test types)

| # | Test type | Test cases | What is checked |
|---|---|---|---|
| 1 | Positive / Create | CREATE_01 | A valid vault is saved ("Save Successfully") and listed |
| 2 | Read / Persistence | READ_01–04 | Columns and rows; test vault survives a fresh login; codes unique across all pages and equal to the pager total; the hand-off vault is still there |
| 3 | Update / Edit | UPDATE_01–03 | Change name, change code, restore the original values (button "Update") |
| 4 | Delete & Cancel | CANCEL_01, 02, DELETE_01 | × closes the New / Edit panel without saving; DELETE is **N/A** (no delete action) |
| 5 | Negative / Required field | REQUIRED_01–04 | Empty panel and each missing field show "Vault Name / Branch / Code Required"; nothing sent |
| 6 | Input validation | INPUT_01–05 | Spaces only; special characters in the code (recorded); script text; Unicode; trimming of spaces |
| 7 | Boundary values | BOUNDARY_01–05 | 250 / 251 characters (name), 30 / 31 (code), one-character values |
| 8 | Default values | DEFAULT_01 | Empty panel; Vault Branch is not pre-filled |
| 9 | Date / calendar | DATE_01 | N/A – no dates |
| 10 | Business rules | BUSINESS_01, 02 | Unknown branch **not executed**; Vault Code stays editable (recorded) |
| 11 | Data consistency | CONSISTENCY_01–03 | Excel export vs grid; Edit panel vs grid; the new vault appears in the **Safe & Lockers** Vault dropdown |
| 12 | Duplicate prevention | DUPLICATE_01, 02 | Same code / same name are rejected by the server |
| 13 | Search | SEARCH_01–06 | By code, by name (lower case), by branch, unknown ("No records available."), script text, clearing |
| 14 | Filtering | FILTER_01 | N/A – only the search box |
| 15 | Sorting | SORT_01–03 | Code, Name, Branch: ascending then descending, in the right order |
| 16 | Pagination | PAGINATION_01, 02 | "1 - 10 of N items", page 2, first / previous / next / last |
| 17 | Clear / Reset | CLEAR_01, 02 | Clear empties the panel; reopening shows an empty panel |
| 18 | Navigation & UI layout | NAV_01, 02 | Breadcrumb *Vault & Safe > Vault*, Overview, browser Back |
| 19 | Role-based access | ROLE_01 | Internal Appraisers 1 / 2 and Auditor cannot open the screen |
| 20 | Workflow (approval) | WORKFLOW_01 | N/A – no approval step |
| 21 | API | API_01–05 | List API 200 + JSON; save payload; list refused without login; save URL recorded; direct invalid call **not executed** |
| 22 | Error recovery | ERROR_01, 02 | Fix the fields after "Required"; failed save keeps the values |
| 23 | File download / upload | FILE_01–03 | Excel (`Vault Configuration.xlsx`), PDF (`Vault Configuration.pdf`), export after a search |
| 24 | Accessibility & responsive | A11Y_01–05 | Phone / tablet width, accessible names, Tab order; other browsers **not executed** |
| 25 | Session / concurrency / browser | SESSION_01–06 | No login; storage cleared; refresh; double-click New and Save; two writers **not executed** |
| 26 | Field length & autocomplete | LENGTH_01 | maxlength 250 / 250 / 30 |

---

## 5. Reports and deliverables (`GoldVault\reports\`)

| File | What it is |
|---|---|
| `Qmetry-GoldVault.html` | Filterable report: summary, 26-type grid, **coverage reconciliation**, **requirement coverage**, every test with steps / expected / actual / screenshot |
| `QMetry-Import-GoldVault.csv` | One row per step, for QMetry **Import from Excel/CSV** (Upload File → Map Fields → Import). Summary and Step Summary are the mandatory QMetry fields; map the other columns in the Map Fields step |
| `Execution-Results-GoldVault.csv` | One row per test: ID, requirement, steps, expected, actual, status, evidence, defect ID, script, timestamp, duration |
| `Traceability-GoldVault.csv` | Requirement → test → script → status → evidence → defect |
| `Reconciliation-and-Gaps-GoldVault.md` | Generated / Automated / Discovered / Executed / Passed / Failed / Blocked / Skipped / Not executed / N/A; coverage by the 37 test categories; reasons for every not-executed test; final gap list |
| `Defect-Candidates-GoldVault.md` | Failed tests with reproducible steps (**candidates, not confirmed**) |
| `execution-results.json` | Machine-readable results everything else is built from |

Evidence screenshots, videos and traces stay in the `test-results-vault*` folders.

To merge a re-run of a few tests over the main results:

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME="test-results-vault-b/fix.json"
npx playwright test GoldVault/tests/gold-vault-functional.spec.js -g "SEARCH_06|NAV_01" --output=test-results-vault-b --reporter=list,json
node GoldVault/build-reports.js test-results-vault/vault.json test-results-vault-b/fix.json
```

---

## 6. Last result (16 Oct 2026, host214 `http://host214.kapilits.com:8411/`)

**74 test cases: 61 passed, 5 failed, 4 not executed, 4 not applicable, 0 blocked.** Test vault created: `ATFT68357` (name restored to its original value at the end).

Defect candidates (**not confirmed** – each needs a human to confirm the expected behaviour; details in `reports/Defect-Candidates-GoldVault.md`):

| ID | Finding |
|---|---|
| DC-VAULT-003 | **The Excel export holds only the current page.** With 19 vaults the sheet has the header plus 10 rows; vaults 11–19 (including the test vault) are missing. |
| DC-VAULT-001 | **A vault with only spaces in Name, Branch and Code is sent for saving** (the "Required" check passes for spaces). Whether the server then stores it was not tested. |
| DC-VAULT-002 | Values are sent **untrimmed** (`"  AUTOTEST TRIM  "`, `"  HEAD OFFICE  "`). |
| DC-VAULT-004 / 005 | The screen scrolls sideways on a 390 px phone and on a 768 px tablet. |

What passed that matters most: the server **rejects a duplicate Vault Code and a duplicate Vault Name**; each missing field shows its own "Required" message and sends nothing; 250 / 30 character limits hold; all codes are unique across the 19 vaults; search (name, branch, code, unknown, script text), sorting on all three columns and paging work; the PDF export is a real PDF; the new vault appears in the **Safe & Lockers** dropdown; only the admin can open the screen; a failed save keeps the values; a double-click sends one save.

Observations (not defects): Vault Code stays editable after saving (not tested whether safes follow a changed code); Vault Branch is free text with no check against real branches (not executed); Vault Code accepts any characters including `#$<>/`; the save URL is `/api/loans/Masters/InventoryMasters/savevaultconfiguration` and carries no user id; after clearing the session a save shows "Unknown Error" and the screen stays open; a refresh closes the New panel.

Not executed: BUSINESS_01 (unknown branch), API_05 (direct invalid API call), SESSION_06 (two writers), A11Y_04 (Firefox / WebKit not installed). Not applicable: DELETE_01, DATE_01, FILTER_01, WORKFLOW_01.

Tests re-written or re-run after the first run (and why): READ_04 (search needed a retry on a slow server), PAGINATION_02 (the first-page button is disabled on page 1), CONSISTENCY_02 / SEARCH_06 / NAV_01 (login page-load timeouts, passed on re-run).

---

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `page.goto … Timeout` / `locator.fill … input:not([type=password])` during login | The server is slow or down. Check `BASE_URL`, wait, re-run those tests |
| Many `ATFT…` vaults in the list | One is created per full run and vaults cannot be deleted from the grid; ask the administrator to remove them in the database if needed |
| UPDATE / DUPLICATE tests skipped: "CREATE_01 has not created the test vault yet" | Run CREATE_01 first (or the whole suite) |
| `Refusing to edit vault …` | A test tried to edit a vault that is not an `ATFT…` test vault – this is the safety guard; do not remove it |
| READ_04 skipped | No `test-data\last-vault.json`; run `npm run vault` first |
| Using an installed Chrome | `$env:PW_CHROMIUM_PATH="C:\...\chrome.exe"` |
