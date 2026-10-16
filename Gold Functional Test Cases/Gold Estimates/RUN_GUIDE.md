# Gold Estimates – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. URL and logins come from `Gold Module\.env`
(`BASE_URL`, `INT_APPRAISER1_USER/PASSWORD`). Run **one test session at a time**. Test IDs **TC_GE_001 – TC_GE_062**
(64 cases, 58 automated). The tests need at least one **AUTOTEST** contact (create one with `npm run contact` in Gold Flow Entry).

## Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run goldestimate` | All automated tests + report | 12 min |
| `npm run goldestimate:smoke` | 8 quick checks | 2 min |
| `npm run goldestimate:regression` | All @regression tests | 12 min |
| `npm run goldestimate:api` | API tests (TC_GE_053 – 055) | 1 min |
| `npm run goldestimate:headed` | All tests, browser visible | 12 min |
| `npm run goldestimate:report` | Rebuild and open `Gold Estimates\reports\QMetryReport.html` | seconds |
| `npm run goldestimate:discover` | Read-only re-scan of the screen | 1 min |

From the `Gold Module` folder: `npm run goldestimate`, `npm run goldestimate:smoke`, `npm run goldestimate:report`.

```powershell
npm run form -- "Gold Estimates" --grep TC_GE_043                 # one test
npm run form -- "Gold Estimates" --grep "TC_GE_034|TC_GE_035"     # several tests
npm run form -- "Gold Estimates" tests/business-rules              # one group
npm run form -- "Gold Estimates" --grep TC_GE_043 --rerun         # rerun, keep the rest of the last full result
```

Groups: `functional` (layout, master data, lists) · `validation` (inputs, mandatory) · `business-rules` (weights, value, LTV) ·
`negative` (review, payload, failures) · `positive` (real save – opt-in) · `api` · `regression` (UI).

## Categories (TC_GE_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001, 014, 015 |
| Default values & dropdowns | 002, 004, 005, 008, 009, 011 |
| Date validation | 003 |
| Contact search | 006, 007 |
| Grid behaviour & Clear | 012, 013 |
| Input validation | 016 – 023, 028 |
| Boundary & cross-field validation | 024 – 027 |
| Required fields | 029 – 031 |
| Article limits | 010, 032 |
| Business rules – weight & value | 034 – 041 |
| Business rules – LTV & scheme | 042 – 044, 051, 058 |
| Review & payload | 033, 045 – 047 |
| Error recovery & double submit | 048 – 050 |
| Create (real) | 052 |
| API | 053 – 055 |
| Accessibility & responsive | 056, 057 |

## Data safety

* By default **no estimate is saved.** Tests stop at the review dialog, block `SaveMakerEntry`, or answer it with a simulated response.
* Tests that reach the review upload `gold-article.png` (stores a small image file on the server – nothing else).
* **TC_GE_052** saves a real estimate (GE number, goes into the approval chain, **cannot be deleted**). Run it only on purpose:

```powershell
$env:ALLOW_DATA_CREATION="1"; npm run form -- "Gold Estimates" --grep TC_GE_052 --rerun; Remove-Item Env:ALLOW_DATA_CREATION
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `ESTIMATE_CONTACT` | Autotest | text used to search the contact |
| `ESTIMATE_ROLE` | INT_APPRAISER1 | `.env` account used as maker |
| `BROWSER` | chromium | chromium / firefox / webkit |

## Reports

`Gold Estimates\reports\`: `QMetryReport.html`, `qmetry-import.csv`, `execution-results.json`, `reconciliation.md`, `playwright-html\`.
