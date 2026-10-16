# Gold Packet Barcode Generator

Functional tests for **Loans → Gold → Gold Packet Barcode Generator** and its **Barcode Register**, built from Gold Flow Entry
`npm run barcode`. 69 test cases (61 automated), IDs `TC_PB_001 …`. Full instructions: `RUN_GUIDE.md`.

```powershell
npm run barcode          # all tests + report
npm run barcode:smoke
npm run barcode:report
```

No barcode is created. Every write is blocked; Print sticker and Cancel replies are **simulated** to check what the screen sends and
shows. The real print + cancel (TC_PB_060, 061) run only with `ALLOW_DATA_CREATION=1`, and only on an AUTOTEST loan.

| Path | Contents |
|---|---|
| `tests/` | functional (generator, register), validation (loan select), business-rules (print, one-barcode rule), negative (roles), api, regression (UI), positive (real – opt-in) |
| `pages/GoldBarcodePage.js` | page object (generator + register) |
| `fixtures/` | `bc`, `register`, `bcReal`, `mockWrite`, `apiHits`, `loginAs`, `record` |
| `test-data/` | `test-cases.js`, `categories.js` |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `utils/discover-barcode.js` | read-only re-scan of the screen |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
