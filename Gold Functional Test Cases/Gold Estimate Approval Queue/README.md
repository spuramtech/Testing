# Gold Estimate Approval Queue

Functional tests for **Loans → Gold → Gold Estimate Approval Queue** – the multi-role workflow after a Gold Estimate is saved
(Internal Appraiser 2 Verify, External Appraisers, Branch Head final approval). Built from Gold Flow Entry `npm run estimate-approval`,
`estimate-external`, `estimate-checker`. 57 test cases (51 automated), IDs `TC_EQ_001 …`. Full instructions: `RUN_GUIDE.md`.

```powershell
npm run estimatequeue          # all tests + report
npm run estimatequeue:smoke
npm run estimatequeue:report
```

Nothing is approved or reverted on the server: action tests use simulated estimates (`utils/simulate.js`) and blocked / simulated writes.
The real chain (TC_EQ_051) runs only with `ALLOW_DATA_CREATION=1`.

| Path | Contents |
|---|---|
| `tests/` | functional, business-rules (IA2, Checker), api, regression, positive (opt-in) |
| `pages/GoldEstimateApprovalQueuePage.js` | page object + status labels |
| `fixtures/` | `q`, `checkerQ`, `simulate`, `blockWrites`, `mockWrite`, `uid`, `apiHits`, `loginAs`, `record` |
| `utils/simulate.js` | builds and serves simulated pending estimates |
| `test-data/` | `test-cases.js`, `categories.js`, `samples/` (anonymised estimate) |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
