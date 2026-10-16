# Gold Estimates

Functional tests for **Loans → Gold → Gold Estimates** (New Estimate), built from `Gold Flow Entry` → `npm run estimate`.
64 test cases (58 automated), IDs `TC_GE_001 …`. Full instructions: `RUN_GUIDE.md`.

```powershell
npm run goldestimate          # all tests + report
npm run goldestimate:smoke
npm run goldestimate:report
```

No estimate is saved unless you run TC_GE_052 with `ALLOW_DATA_CREATION=1` (a saved estimate cannot be deleted).

| Path | Contents |
|---|---|
| `tests/` | functional, validation, business-rules, negative, positive (opt-in), api, regression |
| `pages/GoldEstimatesPage.js` | page object + `expectedNet()` wastage rule |
| `fixtures/` | `ge`, `geContact`, `blockSave`, `blockWrites`, `mockWrite`, `apiHits`, `record` |
| `test-data/` | `test-cases.js`, `categories.js`, `gold-article.png` |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
