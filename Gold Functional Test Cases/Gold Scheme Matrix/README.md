# Gold Scheme Matrix

Functional tests for **Gold Scheme Matrix** (opened from its card on Loans → Gold → Gold Loan Configuration), built from `Gold Flow Entry` → `npm run scheme`.
76 test cases (71 automated), IDs `TC_GS_001 …`. Login: **CHECKER_BH** (admin); role tests also use INT_APPRAISER1.

## Run (from the `Gold Functional Test Cases` folder) – full guide: RUN_GUIDE.md

```powershell
npm run goldscheme              # all tests + report (15–20 min)
npm run goldscheme:smoke        # 8 quick checks
npm run goldscheme:regression
npm run goldscheme:api
npm run goldscheme:headed
npm run goldscheme:report       # open reports\QMetryReport.html
npm run form -- "Gold Scheme Matrix" --grep TC_GS_034          # one test
npm run form -- "Gold Scheme Matrix" tests/business-rules       # one group
$env:GS_SKIP_CRUD="1"; npm run goldscheme                      # without the real create/update/delete tests
```

## Data safety

* Validation, business-rule and failure tests **never save** – save calls are blocked or answered with a simulated response.
* `tests/positive` (TC_GS_048–056) **create real schemes** named `AUTOTEST FT …` with code `AT-T…`, normally **Inactive**, and the
  `created` fixture **deletes them after every test, pass or fail**. Skip them with `GS_SKIP_CRUD=1`.
* If a run is killed half-way, look for `AT-T…` codes in the grid and delete them (Delete button).

## Folder

| Path | Contents |
|---|---|
| `tests/` | functional (grid, new form, roles), validation (fields, mandatory), business-rules (slabs, LTV), negative (payload, failures), positive (real CRUD), api, regression (UI) |
| `pages/GoldSchemeMatrixPage.js` | page object + `internalLtv()` rule |
| `fixtures/` | `gsm`, `blockWrites`, `mockWrite`, `created` (auto-delete), `apiHits`, `loginAs`, `record`, `testScheme()` |
| `test-data/` | `test-cases.js`, `categories.js` |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
