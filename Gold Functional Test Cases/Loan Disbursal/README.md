# Loan Disbursal

Functional tests for **Loans → Loan Management → Loan Disbursal** (approved list and the disbursement form, Submit For Approval),
built from Gold Flow Entry `npm run disbursal`. 65 test cases (56 automated), IDs `TC_LD_001 …`. Full instructions: `RUN_GUIDE.md`.

```powershell
npm run disbursal          # all tests + report
npm run disbursal:smoke
npm run disbursal:report
```

Nothing is submitted. Every write is blocked; Submit replies are **simulated**. The list's Actions icon (*Revert to Approval*) is
never clicked. The real submit (TC_LD_056) runs only with `ALLOW_DATA_CREATION=1`, and only on an AUTOTEST loan.

| Path | Contents |
|---|---|
| `tests/` | functional (list, loan details), validation (payout), business-rules (submit), negative (roles), api, regression (UI), positive (real – opt-in) |
| `pages/LoanDisbursalPage.js` | page object |
| `fixtures/` | `ld`, `loan`, `ldReal`, `api`, `mockApi`, `apiHits`, `loginAs`, `record` |
| `test-data/` | `test-cases.js`, `categories.js` |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `utils/discover-disbursal.js` | read-only re-scan of the screen |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
