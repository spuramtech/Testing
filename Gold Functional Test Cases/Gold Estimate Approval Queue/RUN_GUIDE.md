# Gold Estimate Approval Queue – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. Logins from `Gold Module\.env`: **CHECKER_BH** (Branch Head),
**INT_APPRAISER1** (maker), **INT_APPRAISER2** (verifier), **EXT_APPRAISER1**. Run **one test session at a time**.
Test IDs **TC_EQ_001 – TC_EQ_055** (57 cases, 51 automated).

## Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run estimatequeue` | All automated tests + report | 10 min |
| `npm run estimatequeue:smoke` | 7 quick checks | 2 min |
| `npm run estimatequeue:regression` | All @regression tests | 10 min |
| `npm run estimatequeue:api` | API tests (TC_EQ_044 – 048) | 2 min |
| `npm run estimatequeue:headed` | All tests, browser visible | 10 min |
| `npm run estimatequeue:report` | Rebuild and open `reports\QMetryReport.html` | seconds |
| `npm run estimatequeue:discover` | Read-only re-scan for one role: `npm run estimatequeue:discover -- CHECKER_BH` | 1 min |

From the `Gold Module` folder: `npm run estimatequeue`, `npm run estimatequeue:smoke`, `npm run estimatequeue:report`.

```powershell
npm run form -- "Gold Estimate Approval Queue" --grep TC_EQ_037                  # one test
npm run form -- "Gold Estimate Approval Queue" --grep "TC_EQ_026|TC_EQ_027"      # several
npm run form -- "Gold Estimate Approval Queue" tests/business-rules               # one group
npm run form -- "Gold Estimate Approval Queue" --grep TC_EQ_037 --rerun          # rerun, keep the rest of the last result
```

Groups: `functional` (queue, filters, detail, inboxes) · `business-rules` (IA2 verification, Checker approval) · `api` · `regression` (UI) ·
`positive` (real chain – opt-in).

## How the action tests work (simulated estimates)

The queue only has actionable work right after somebody saves an estimate, and every Approve / Revert is permanent. So the IA2 and
Checker action tests serve the screens a **simulated estimate** – `GE9999999901` (awaiting IA2) and `GE9999999902` (Ready for Approval),
built from an anonymised real estimate in `test-data\samples\`. Their Approve / Revert calls are **blocked or answered by a simulated
reply**. Nothing on the server changes. Real queue data is only read (filters, search, View).

## Real end-to-end chain (off by default)

TC_EQ_051 saves a real estimate as INT_APPRAISER1, verifies it as INT_APPRAISER2 and approves it as CHECKER_BH – it creates a
**permanent GE number and pledge token**:

```powershell
$env:ALLOW_DATA_CREATION="1"; npm run form -- "Gold Estimate Approval Queue" --grep TC_EQ_051 --rerun; Remove-Item Env:ALLOW_DATA_CREATION
```

## Categories (TC_EQ_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001, 010, 015 |
| Filtering & search | 002, 003, 005 – 007 |
| Data consistency | 004, 008, 011, 013 |
| Detail view & audit trail | 012, 014 |
| Role-based inboxes | 009, 016 – 019 |
| IA2 verification (simulated) | 020 – 022, 026, 027 |
| Required remarks & cancel | 023 – 025, 040 |
| Checker final approval (simulated) | 032 – 037, 041, 043 |
| Usability / safety | 028 |
| Error handling & double submit | 029, 030, 038, 039 |
| Segregation of duties | 031, 042 |
| API | 044 – 048 |
| Accessibility & responsive | 049, 050 |
| Real end-to-end chain | 051 |

## Reports

`Gold Estimate Approval Queue\reports\`: `QMetryReport.html`, `qmetry-import.csv`, `execution-results.json`, `reconciliation.md`, `playwright-html\`.
