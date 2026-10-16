# Inventory Form

Functional tests for **Loans → Gold → Inventory Form** (bind a loan's collateral to its BH packet barcode and store it in a
vault / safe / locker) and its **View** list, built from Gold Flow Entry `npm run inventory`. 67 test cases (59 automated),
IDs `TC_IF_001 …`. Full instructions: `RUN_GUIDE.md`.

```powershell
npm run inventory          # all tests + report
npm run inventory:smoke
npm run inventory:report
```

No inventory is saved and no barcode is used up. Every write is blocked; the packet photo upload and the Save reply are
**simulated**. Scan checks use the app's real read-only lookups. The real save (TC_IF_059, 060) runs only with
`ALLOW_DATA_CREATION=1`, and only on an AUTOTEST loan.

| Path | Contents |
|---|---|
| `tests/` | functional (form, view), validation (scan), business-rules (add / save), negative (roles), api, regression (UI), positive (real – opt-in) |
| `pages/InventoryPage.js` | page object (form + view) |
| `fixtures/` | `inv`, `invReal`, `live`, `fakeUpload`, `mockApi`, `apiHits`, `loginAs`, `record` |
| `test-data/` | `test-cases.js`, `categories.js`, `gold-article.png` |
| `docs/` | entry-flow analysis, requirements, coverage-gap report |
| `utils/discover-inventory.js` | read-only re-scan of the screen |
| `reports/` | QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md |
