# Daily Gold Rate (Gold Loan Configuration)

Functional tests for **Loans → Gold → Gold Loan Configuration → Daily Gold Rate**, built from the single-entry
automation in `Gold Flow Entry` (`npm run goldrate`). 68 test cases (61 automated) in 26 test-type categories.

## Run (from the `Gold Functional Test Cases` folder)

```powershell
npm run dailygoldrate              # all tests + report
npm run dailygoldrate:smoke        # 6 quick checks
npm run dailygoldrate:regression
npm run dailygoldrate:api
npm run dailygoldrate:headed       # watch in the browser
npm run dailygoldrate:report       # open reports\QMetryReport.html
npm run form -- "Daily Gold Rate" --grep TC_GR_030   # one test
```

| Variable | Default | Meaning |
|---|---|---|
| `BROWSER` | chromium | chromium / firefox / webkit |
| `MAKER_ROLE` / `CHECKER_ROLE` | INT_APPRAISER1 / CHECKER_BH | `.env` accounts used |
| `ALLOW_DATA_CREATION` | 0 | `1` runs create/update/delete (TC_GR_041–044, 046) – can leave a PERMANENT locked rate |
| `ALLOW_APPROVAL` | 0 | `1` lets TC_GR_056 approve a pending Internal Rate (affects other users) |

## Folder contents

| Path | Contents |
|---|---|
| `tests/` | functional, validation, business-rules, negative, positive, api, regression |
| `pages/DailyGoldRatePage.js` | page object (grid, panel, calendar, Internal Rate tab) |
| `fixtures/` | logged-in page `grp`, `loginAs`, `apiHits`, `record` |
| `test-data/` | `test-cases.js` inventory, `categories.js`, `gold-rate-data.js`, `last-created-rate.json` |
| `docs/` | `entry-flow-analysis.md`, `requirements.md`, `coverage-gap-report.md` |
| `reports/` | `QMetryReport.html`, `qmetry-import.csv`, `execution-results.json`, `reconciliation.md` |
| `evidence/` | discovery screenshots; `run1-create/` = double-save defect evidence |
| `utils/discover-gold-rate.js` | re-discover the screen (`npm run dailygoldrate:discover`) |

## Test data safety

* By default no test creates, updates or deletes a gold rate.
* Two locked records were left on host214 while building this suite: **01/06/2026 (₹14,555.50)** and **04/07/2026 (₹14,268.22)**.
* TC_GR_045 opens the delete confirmation on an existing row and always cancels; negative save tests block the save before it reaches the server.
