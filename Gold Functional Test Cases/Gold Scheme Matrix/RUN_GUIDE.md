# Gold Scheme Matrix – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. URL and logins come from `Gold Module\.env`
(`BASE_URL`, `CHECKER_BH_USER/PASSWORD`, `INT_APPRAISER1_USER/PASSWORD`). Run **one test session at a time**.
From the `Gold Module` folder you can also use `npm run goldscheme`, `npm run goldscheme:smoke` and `npm run goldscheme:report`.

## Commands

Login used: **CHECKER_BH** (admin). Role tests also use INT_APPRAISER1.

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run goldscheme` | All 71 automated tests + report | 15–20 min |
| `npm run goldscheme:smoke` | 8 quick checks (incl. one real create + delete) | 3 min |
| `npm run goldscheme:regression` | All @regression tests | 15–20 min |
| `npm run goldscheme:api` | API tests (TC_GS_060 – 064) | 2 min |
| `npm run goldscheme:headed` | All tests, browser visible | 15–20 min |
| `npm run goldscheme:report` | Rebuild and open `Gold Scheme Matrix
eports\QMetryReport.html` | seconds |
| `npm run goldscheme:discover` | Read-only re-scan of the screen | 1 min |

```powershell
npm run form -- "Gold Scheme Matrix" --grep TC_GS_034         # one test
npm run form -- "Gold Scheme Matrix" tests/business-rules      # one group
$env:GS_SKIP_CRUD="1"; npm run goldscheme; Remove-Item Env:GS_SKIP_CRUD   # without real create/update/delete
```

| Category | IDs (TC_GS_…) |
|---|---|
| Navigation & UI layout | 001, 002, 010 |
| Default values & dropdowns | 003, 011 – 014 |
| Pagination & sorting | 004, 005 |
| Data consistency | 006 – 009 |
| Date validation · Clear | 015 · 016 |
| Input validation | 017 – 026 |
| Required fields & negative save | 027 – 031 |
| Boundary values (rate 2 % – 24 %) | 032, 071 – 074 |
| Business rules – slabs & Internal LTV | 033 – 041 |
| API payload · Error recovery · Double submit | 042, 043 · 044 – 046 · 047 |
| Create / Read · Update · Duplicate | 048, 049 · 050, 051, 059 · 052 |
| Scheme on / effectiveness · Delete | 053, 056 · 054, 055 |
| Role-based access · API | 057, 058 · 060 – 064 |
| Accessibility & responsive | 065 – 067 |

**Data:** TC_GS_048 – 056 create real **Inactive** schemes `AUTOTEST FT …` (code `AT-T…`) and delete them after each test.
All other tests block or simulate the save. If a run is stopped half-way, delete any `AT-T…` scheme from the grid.

Rerun only some tests and keep the rest of the last full result in the report (e.g. after a timeout):

```powershell
npm run form -- "Gold Scheme Matrix" --grep "TC_GS_009|TC_GS_035" --rerun
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `GS_SKIP_CRUD` | – | `1` skips the real create/update/delete tests |
| `SCHEME_ROLE` | CHECKER_BH | `.env` account with Scheme Matrix rights |
| `MAKER_ROLE` | INT_APPRAISER1 | `.env` account without rights (role tests) |
| `BROWSER` | chromium | chromium / firefox / webkit |

## Reports

`Gold Scheme Matrix\reports\`: `QMetryReport.html`, `qmetry-import.csv`, `execution-results.json`, `reconciliation.md`,
`playwright-html\`. The report shows the **latest run only**.

## If a run is stopped half-way

A test that was creating a scheme may leave an `AUTOTEST FT …` scheme (code `AT-T…`) behind – delete it from the grid with the
Delete button. Normal runs, passed or failed, delete their own schemes.
