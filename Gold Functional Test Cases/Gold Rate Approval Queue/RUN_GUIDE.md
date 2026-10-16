# Gold Rate Approval Queue – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
```

Test IDs: **TC_GQ_001 – TC_GQ_052** (56 cases, 48 automated). Login used: **CHECKER_BH** (admin, Gold Rate checker);
some role tests also log in as INT_APPRAISER1 (tryfinsta) and INT_APPRAISER2 (priya).

## 1. One-time setup

```powershell
npm install
npx playwright install chromium
```

URL and logins come from `C:\Users\Admin\OneDrive\Desktop\Gold Module\.env` (`BASE_URL`, `CHECKER_BH_USER/PASSWORD`,
`INT_APPRAISER1_USER/PASSWORD`, `INT_APPRAISER2_USER/PASSWORD`). The checker must be set as Gold Rate checker
(Form-wise Approvals > Gold Rate). Run **one test session at a time**.

## 2. Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run approvalqueue` | All 48 automated tests + report | 8–10 min |
| `npm run approvalqueue:smoke` | 6 quick checks | 1–2 min |
| `npm run approvalqueue:regression` | All @regression tests | 8–10 min |
| `npm run approvalqueue:api` | API tests (TC_GQ_036 – 043) | 2 min |
| `npm run approvalqueue:headed` | All tests, browser visible | 8–10 min |
| `npm run approvalqueue:report` | Rebuild the report from the last run and open `QMetryReport.html` | seconds |
| `npm run approvalqueue:discover` | Read-only re-scan of the screen (`evidence\discovery`) | 1 min |

From the `Gold Module` folder: `npm run approvalqueue`, `npm run approvalqueue:smoke`, `npm run approvalqueue:report`.

### Part of the form

```powershell
npm run form -- "Gold Rate Approval Queue" --grep TC_GQ_013               # one test
npm run form -- "Gold Rate Approval Queue" --grep "TC_GQ_029|TC_GQ_030"    # several tests
npm run form -- "Gold Rate Approval Queue" --grep TC_GQ_013 --headed      # one test, browser visible
npm run form -- "Gold Rate Approval Queue" tests/validation               # one group
```

Rerun only some tests and keep the rest of the last full result in the report (e.g. after a timeout):

```powershell
npm run form -- "Gold Rate Approval Queue" --grep "TC_GQ_037" --rerun
```

Groups: `functional` (view, search, roles) · `validation` (reject modal) · `business-rules` · `negative` (failures, double click) ·
`api` · `positive` (real approve/reject – opt-in) · `regression` (UI).

### Categories and IDs (TC_GQ_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001, 003, 006 |
| Data consistency | 002, 004 |
| Sorting | 005 |
| Search | 007 – 011 |
| Reject modal & remarks validation | 012, 013, 014, 016 |
| Cancel | 015 |
| Boundary & special characters | 017, 018 |
| Business rules / Payload | 019, 020, 024, 025 |
| Workflow transition | 022, 023, 044*, 045* |
| Usability / Safety | 021 |
| Concurrency | 026, 041 |
| Error recovery | 027, 028 |
| Double submit | 029, 030 |
| Role-based access | 031 – 035 |
| API | 036 – 040, 042, 043 |
| Accessibility & responsive | 046 – 048 |

\* opt-in, see section 4.

## 3. What the tests change on the server – nothing by default

* Approve / Reject clicks are **blocked**, or answered by a **simulated** server reply (tests say "simulated" in their title).
* API write tests use a **non-existent record (999999999)**.

## 4. Real approve / reject (off by default)

| Test | Turn on | What happens |
|---|---|---|
| TC_GQ_044 – real reject | `$env:ALLOW_APPROVAL="1"; npm run form -- "Gold Rate Approval Queue" --grep TC_GQ_044` | Rejects pending days in `GQ_TARGET_DATES` (default `2026-06-02,2026-07-06` = automation test data) |
| TC_GQ_045 – real approve | `$env:ALLOW_APPROVAL="1"; $env:GQ_ALLOW_REAL_APPROVE="1"; npm run form -- "Gold Rate Approval Queue" --grep TC_GQ_045` | Approves a target day – **the rate goes live for loans** |

Choose other days: `$env:GQ_TARGET_DATES="2026-10-14"` (yyyy-mm-dd, comma-separated).
Switch off afterwards: `Remove-Item Env:ALLOW_APPROVAL, Env:GQ_ALLOW_REAL_APPROVE, Env:GQ_TARGET_DATES`

## 5. Options

| Option | Default | Meaning |
|---|---|---|
| `BROWSER` | chromium | chromium / firefox / webkit |
| `CHECKER_ROLE` | CHECKER_BH | `.env` account used as checker |
| `MAKER_ROLE` | INT_APPRAISER1 | `.env` account used as non-checker |
| `BASE_URL` | from `.env` | `$env:BASE_URL="http://…/"` for one run |

## 6. Reports

`Gold Rate Approval Queue\reports\`: `QMetryReport.html` (summary, test-type table, filters, evidence), `qmetry-import.csv`,
`execution-results.json`, `reconciliation.md`, `playwright-html\` (traces). The report shows the **latest run only** –
running one test replaces the full results – add `--rerun` to keep them (see above).

## 7. When something fails

| Message | Cause | Fix |
|---|---|---|
| `page.waitForURL … GoldRateApprovalQueue` timeout | screen slow to open | rerun |
| Tests SKIPPED "queue is empty" | no pending submission | save a Daily Gold Rate (creates one) or wait for makers |
| `Missing CHECKER_BH_USER …` | login missing in `.env` | add it |
| FAILED with app behaviour | possible defect | see `docs\coverage-gap-report.md` (DC-01 – DC-08) |
