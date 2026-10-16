# Gold Token

Functional tests for **Loans → Gold → Gold Token** (turning an approved estimate's token into a gold loan), built from Gold Flow Entry
`npm run token`. 46 test cases (41 automated), IDs `TC_GT_001 …`. Full instructions: `RUN_GUIDE.md`.

```powershell
npm run goldtoken          # all tests + report
npm run goldtoken:smoke
npm run goldtoken:report
```

No loan is created: form tests use a simulated token `UID99999` and block every write. The real save (TC_GT_041) runs only with
`ALLOW_DATA_CREATION=1` and only on an AUTOTEST token.

| Path | Contents |
|---|---|
| `tests/` | functional, validation (nominee), business-rules (loan details), api, regression, positive (opt-in) |
| `pages/GoldTokenPage.js` | page object |
| `fixtures/` | `gt`, `simToken`, `blockWrites`, `mockWrite`, `apiHits`, `loginAs`, `record` |
| `test-data/` | `test-cases.js`, `categories.js`, `samples/` (simulated token from an AUTOTEST estimate) |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
