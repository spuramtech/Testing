# Gold Token – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. Login from `Gold Module\.env`: **INT_APPRAISER1** (maker).
Run **one test session at a time**. Test IDs **TC_GT_001 – TC_GT_044** (46 cases, 41 automated).

## Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run goldtoken` | All automated tests + report | 10 min |
| `npm run goldtoken:smoke` | 6 quick checks | 2 min |
| `npm run goldtoken:regression` | All @regression tests | 10 min |
| `npm run goldtoken:api` | API tests (TC_GT_037, 038) | 1 min |
| `npm run goldtoken:headed` | All tests, browser visible | 10 min |
| `npm run goldtoken:report` | Rebuild and open `reports\QMetryReport.html` | seconds |
| `npm run goldtoken:discover` | Read-only re-scan of the screen | 1 min |

From the `Gold Module` folder: `npm run goldtoken`, `npm run goldtoken:smoke`, `npm run goldtoken:report`.

```powershell
npm run form -- "Gold Token" --grep TC_GT_030                  # one test
npm run form -- "Gold Token" --grep "TC_GT_028|TC_GT_029"      # several
npm run form -- "Gold Token" tests/validation                  # one group
npm run form -- "Gold Token" --grep TC_GT_030 --rerun          # rerun, keep the rest of the last result
```

Groups: `functional` (lists, overview) · `validation` (nominee) · `business-rules` (loan details, amount, save) · `api` · `regression` (UI) ·
`positive` (real loan – opt-in).

## How the tests work (simulated token)

Saving a token creates a **permanent gold loan** and uses up the token, and the available tokens usually belong to real estimates of
other users. So the form tests add a **simulated token `UID99999`** to the list – a copy of a used AUTOTEST token (customer
"Autotest Dcgjbi Qa", ring 10.5 g, eligible ₹1,03,643.19, scheme 9 months @ 18 %) – and **block every write**. Nothing is saved.

## Real loan (off by default)

TC_GT_041 turns an available **AUTOTEST** token into a loan (permanent). It skips when no AUTOTEST token is available:

```powershell
$env:ALLOW_DATA_CREATION="1"; npm run form -- "Gold Token" --grep TC_GT_041 --rerun; Remove-Item Env:ALLOW_DATA_CREATION
```

## Categories (TC_GT_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001 |
| Data consistency | 002, 003, 006, 022 |
| Read views | 004, 005, 007, 009 |
| Field state | 008 |
| Nominee – required & business rules | 010, 011, 016, 018 |
| Nominee – input validation | 012 – 015, 019 |
| Duplicate prevention & edit | 017, 020 |
| Loan terms from scheme | 021, 036 |
| Amount validation & boundaries | 023 – 029 |
| Save integrity & payload | 030 – 032 |
| Error handling & double submit | 033, 034 |
| Navigation (Back) | 035 |
| API | 037, 038 |
| Accessibility & responsive | 039, 040 |
| Create (real) | 041 |

## Reports

`Gold Token\reports\`: `QMetryReport.html`, `qmetry-import.csv`, `execution-results.json`, `reconciliation.md`, `playwright-html\`.
