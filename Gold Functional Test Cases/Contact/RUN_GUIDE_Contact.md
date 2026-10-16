# Contact Form – Run Guide

Screen under test: **Contact → Contact Configuration → Contact** (list) and **New → Manual** (create / edit form), logged in as **Internal Appraiser 1**.

Run every command in **PowerShell** from the automation folder (npm scripts and `npx playwright test Contact/tests/...` paths are relative to it):

```
C:\Users\admin\Desktop\Gold Module\Gold Flow Entry
```

---

## Folder layout

Everything contact-related lives in the `Contact` folder:

```
Gold Flow EntryContact  RUN_GUIDE_Contact.md        this guide
  run-qmetry.js               runs both suites, then builds the report
  tests                      create-contact.spec.js, contact-functional.spec.js, contact-coverage.spec.js
  pagesContactPage.js        page object for the Contact form
  test-data                  contact.js (unique data per run), coverage-contact.json (shared by the coverage, Estimate and Approval suites)
  reportsQmetry-Contact.html the Qmetry-style report
```

Shared helpers (login page, flow file, report generator) stay in `pages`, `utils` and `test-data` at the top level, because every form uses them.

---

## 1. Before you run

| Need | Detail |
|---|---|
| Node + packages | `npm install` once (Playwright 1.48.2 and dotenv are already in `node_modules`) |
| Settings file | `C:\Users\admin\Desktop\Gold Module\.env` (one level above the automation folder) |
| Required keys | `BASE_URL` (keep the trailing `/`), `INT_APPRAISER1_USER`, `INT_APPRAISER1_PASSWORD` |
| Optional keys | `CHECKER_BH_*` and `AUDITOR_*` (only used by the role-access test) |
| Network | The QC server must be reachable. When QC is slow, tests time out on login or page load (see Troubleshooting) |

Run against another server for one run only:

```powershell
$env:BASE_URL="http://host214.kapilits.com:8411/"; npm run contact
```

> **Test data warning:** these tests create real `AUTOTEST …` contacts on the server and the Contact module has no delete action, so they cannot be cleaned up from the app. A full run creates about 8 new contacts.

---

## 2. Commands

| Command | What it does |
|---|---|
| `npm run contact` | **TC_CONTACT_001** – creates one new Individual contact (and starts a new end-to-end flow) |
| `npm run contact:headed` | Same, browser visible |
| `npm run contact-functional` | 16 functional tests: **F01–F12** (validation) and **P01–P04** (positive) |
| `npm run contact-functional:headed` | Same, browser visible |
| `npm run contact-functional:qmetry` | Runs the functional **and** coverage suites, then builds **Contact/reports/Qmetry-Contact.html** (works even when some tests fail) |
| `npx playwright test Contact/tests/contact-coverage.spec.js` | The 31-test, 26-type coverage suite on its own (no npm shortcut) |
| `npm run report` | Opens the Playwright HTML report (screenshots, video and trace on failure) |

Run one scenario only:

```powershell
npx playwright test Contact/tests/contact-functional.spec.js -g "F03" --headed
npx playwright test Contact/tests/contact-coverage.spec.js -g "SEARCH_01" --headed
```

Typical time for the full combined run (47 tests): **20–25 minutes** when QC is healthy; longer when QC is slow.

---

## 3. Test files

| File | Tests | Notes |
|---|---|---|
| `Contact/tests/create-contact.spec.js` | TC_CONTACT_001 | Full create with address, PAN and bank; stores the contact in `test-data/current-flow.json` for the later flow steps |
| `Contact/tests/contact-functional.spec.js` | F01–F12, P01–P04 | Validation and positive scenarios. F12 and P04 need an existing contact: run `npm run contact` once first |
| `Contact/tests/contact-coverage.spec.js` | 31 tests | All 26 test types (below). The first test creates a contact and saves it to `Contact/test-data/coverage-contact.json` for the others |

### Functional tests (contact-functional.spec.js)

| ID | Scenario |
|---|---|
| F01 | Form loads with the mandatory fields and the Address / Documents / Bank tabs |
| F02 | Save with every field empty is rejected |
| F03 / F04 | Save without Mobile / without First Name is rejected |
| F05 | Mobile rejects letters and special characters (typed key by key) |
| F06 / F07 | Mobile shorter than 10 / longer than 10 digits is rejected |
| F08 | Invalid email is rejected |
| F09 | Contact Info only (no address / KYC / bank) is not saved |
| F10 | Invalid PAN (`12345`) is not added to Documents |
| F11 | Pincode takes digits only, max 6 |
| F12 | Duplicate mobile number is rejected |
| P01 | Create with all fields (Male) and find it in the list |
| P02 | Create with mandatory fields only (no Last Name / Father Name / Email) |
| P03 | Create a Female contact (title Ms) |
| P04 | Existing contact can be searched and loaded into the form |

### Coverage suite – 26 test types (contact-coverage.spec.js)

| # | Test type | Test case(s) | What is checked |
|---|---|---|---|
| 1 | Positive / Create | CREATE_01 | Full contact saved |
| 2 | Read / Persistence | READ_01 | Saved contact listed with name, mobile, PAN, email after a fresh login |
| 3 | Update / Edit | UPDATE_01 | Load contact via Search Contact, change email, **Update** |
| 4 | Delete & Cancel | CANCEL_01, DELETE_01 | Leaving the form saves nothing; DELETE is **N/A** (no delete control) |
| 5 | Negative / Required field | REQUIRED_01 | Contact without Address is not saved |
| 6 | Input validation | INPUT_01 | First Name rejects digits / special characters |
| 7 | Boundary values | BOUNDARY_01 | 5-digit pincode is not added |
| 8 | Default values | DEFAULT_01 | New form is empty; Male is preselected |
| 9 | Date / calendar validation | DATE_01 | Future years cannot be chosen as Date of Birth |
| 10 | Business rules / Calculation | BUSINESS_01 | A 5-year-old cannot be saved as a borrower |
| 11 | Data consistency | CONSISTENCY_01 | List card shows exactly the entered address, PAN and mobile |
| 12 | Duplicate prevention | DUPLICATE_01 | A PAN already used is blocked at Add or Save |
| 13 | Search | SEARCH_01 (Phone / Name / PAN), SEARCH_02 | Search finds the contact; unknown number returns nothing |
| 14 | Filtering | FILTER_01 | Individual vs Business Entity tabs |
| 15 | Sorting | SORT_01 | List is newest first (UCIC descending) |
| 16 | Pagination | PAGINATION_01 | Next / Prev change the page and the summary |
| 17 | Clear / Reset | CLEAR_01, CLEAR_02 | Clearing the search restores the list; the form **Clear** link empties the form |
| 18 | Navigation & UI layout | NAV_01 | Tabs keep entered data when switching |
| 19 | Role-based access | ROLE_01 | Contact menu per role (results recorded as notes) |
| 20 | Workflow (approval) | WORKFLOW_01 | Pending Contacts dialog opens (Manual Request / E-Kyc tabs) |
| 21 | API | API_01 | All POST / PUT calls while creating returned 2xx |
| 22 | Error recovery | ERROR_01 | Rejected save, then double-click Save → exactly one contact |
| 23 | File download / upload | FILE_01 | **Skipped** – see Known issues |
| 24 | Accessibility & responsive | A11Y_01 | Fits a 390×844 phone; Tab moves focus |
| 25 | Session / concurrency / browser | SESSION_01 | Form is not shown without login |
| 26 | Field length & autocomplete | LENGTH_01 | Mobile, First Name and Pincode have a maximum length |

---

## 4. Qmetry.html report

`npm run contact-functional:qmetry` writes **`Contact/reports/Qmetry-Contact.html`**: one self-contained file with summary cards, a pass-rate donut, a **coverage grid of all 26 test types**, and a searchable, filterable table. Click a row for steps, expected / actual result, notes and a screenshot.

* Each run overwrites `Contact/reports/Qmetry-Contact.html`. Every form writes its own report file in its own folder, so they never overwrite each other. Copy the file first if you want to keep an older Contact report.
* Build the report again from the last results without re-running the tests:

```powershell
node utils/qmetry-report.js test-results/qmetry-run.json Contact/reports/Qmetry-Contact.html
```

* Merge a re-run of a few tests over the main results (a later file replaces the earlier result for the same test):

```powershell
$env:PLAYWRIGHT_JSON_OUTPUT_NAME="test-results-rerun/rerun.json"
npx playwright test Contact/tests/contact-functional.spec.js -g "F09|F12" --output=test-results-rerun --reporter=list,json
node utils/qmetry-report.js test-results/qmetry-run.json,test-results-rerun/rerun.json Contact/reports/Qmetry-Contact.html
```

Playwright empties `test-results` at the start of every run, so a normal re-run wipes the first run's JSON and screenshots. Use `--output=` as above to keep them.

---

## 5. Last result (15 Oct 2026, QC)

**44 passed, 1 failed, 2 skipped of 47** (the report in `Contact/reports/Qmetry-Contact.html`).

| Item | Result |
|---|---|
| DATE_01 – **failed** | The Date of Birth calendar does not disable future years (2027 is selectable). Possible defect; I did not check whether a future date can be saved. |
| DELETE_01 – skipped | Not applicable: no delete control on the Contact list or form |
| FILE_01 – skipped | The Documents table has an "Upload File Name" column, but the control that triggers an upload could not be found; needs a manual check |
| F12 duplicate mobile | Failed once, passed on later runs – duplicate-mobile handling looked inconsistent |
| Duplicate PAN | Blocked when the document is added |
| Other behaviour | Name auto-capitalises ("Navcheck"); Male is preselected |

Several tests (F09, F12, P01, P03) first failed with page-load timeouts while QC was slow; they passed when re-run alone. The list cards also have **Edit** and **View** icons that are not covered by tests yet.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `page.waitForURL … Timeout 60000ms` during login or navigation | QC is slow or hung. Re-run just those tests with `-g "<id>"` |
| `Missing INT_APPRAISER1_USER / …_PASSWORD in .env` | Add the keys to `C:\Users\admin\Desktop\Gold Module\.env` |
| Coverage tests after CREATE_01 fail with "Cannot read properties of undefined" | CREATE_01 did not save; fix it first (or check `Contact/test-data/coverage-contact.json`) |
| F12 / P04 are skipped | No flow exists yet: run `npm run contact` once to create one |
| `Save & Continue` not found when editing | After loading an existing contact the button is called **Update** |
| Using an installed Chrome | `$env:PW_CHROMIUM_PATH="C:\...\chrome.exe"` |
| Playwright reports "No tests found" | Syntax error in a spec; run `node --check Contact/tests/contact-coverage.spec.js` |

---

## 7. Files

| File | Purpose |
|---|---|
| `Contact/pages/ContactPage.js` | Page object: menu path, form fields, date picker, tabs, address / document / bank helpers, list search |
| `Contact/test-data/contact.js` | Unique contact data per run (name, mobile, PAN, bank, address) |
| `test-data/current-flow.json` | The contact started by `npm run contact` (used by F12, P04 and the later flow steps) |
| `Contact/test-data/coverage-contact.json` | Contact shared between coverage tests (auto-created) |
| `utils/qmetry-report.js`, `utils/qmetry-meta.js` (shared) | Builds the report; holds the 26 types and the steps / expected results |
| `Contact/run-qmetry.js` | Runs both contact suites, then builds the report |
