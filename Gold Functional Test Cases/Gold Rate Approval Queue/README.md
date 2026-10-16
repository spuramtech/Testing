# Gold Rate Approval Queue

Functional tests for the **Checker Approval Queue** of daily gold rates (opened from the *Gold Rate Approval* card on
Gold Loan Configuration, checker users only). Built from `Gold Flow Entry` → `npm run approval`.
56 test cases (48 automated) – IDs `TC_GQ_001 …`.

## Run (from the `Gold Functional Test Cases` folder)

```powershell
npm run approvalqueue              # all tests + report
npm run approvalqueue:smoke        # 6 quick checks
npm run approvalqueue:regression
npm run approvalqueue:api          # API tests
npm run approvalqueue:headed       # watch in the browser
npm run approvalqueue:report       # open reports\QMetryReport.html
npm run form -- "Gold Rate Approval Queue" --grep TC_GQ_013   # one test
npm run form -- "Gold Rate Approval Queue" tests/validation   # one group
```

## Data safety

* By default **nothing is approved or rejected.** Tests either block the Approve/Reject call, answer it with a **simulated** server
  response (marked "simulated" in the test title), or call the API for a **non-existent record (999999999)**.
* Real actions are opt-in:

| Test | Switch | Effect |
|---|---|---|
| TC_GQ_044 real reject | `$env:ALLOW_APPROVAL="1"` | rejects pending days listed in `GQ_TARGET_DATES` (default `2026-06-02,2026-07-06` = automation test data) |
| TC_GQ_045 real approve | `ALLOW_APPROVAL=1` **and** `$env:GQ_ALLOW_REAL_APPROVE="1"` | approves a target day – the rate goes live for loans |

## Folder

| Path | Contents |
|---|---|
| `tests/` | functional (view, search, roles), validation (reject modal), business-rules, negative (failures, double click), api, positive (real, opt-in), regression (UI) |
| `pages/GoldRateApprovalQueuePage.js` | page object |
| `fixtures/` | `queue` (checker, queue open), `blockWrites`, `mockWrite`, `apiHits`, `loginAs`, `record` |
| `test-data/` | `test-cases.js`, `categories.js`, `approval-data.js` |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
| `utils/discover-approval-queue.js` | read-only re-discovery (`npm run approvalqueue:discover`) |
