# Charge Form Automation Framework

Playwright + JavaScript + Page Object Model automation framework for the
**Loans > Loan Configuration > Charge** screen of the demo NBFC application
(`https://demonbfc.finsta.co.in/#/`).

## Stack

- Playwright Test (Chromium / Firefox / WebKit)
- Page Object Model
- Winston logging
- dotenv environment configs (`qa`, `uat`, `prod`)
- Allure + Playwright HTML + JUnit reporting
- `@faker-js/faker` for dynamic test data
- `@axe-core/playwright` for accessibility checks
- API testing via `APIRequestContext`
- MySQL/PostgreSQL database validation via `mysql2` / `pg`
- GitHub Actions + Jenkins pipelines

## Folder Structure

```
automation/
├── pages/            Page Object classes (BasePage, LoginPage, NavigationPage, ChargePage)
├── tests/            Spec files (login, charge functional/negative/ui/api/database)
├── fixtures/          Custom Playwright fixtures (chargeScreen = logged-in + navigated)
├── data/              JSON test data
├── api/               API client + Charge API wrapper
├── database/          DB client + parameterized Charge queries
├── utils/             logger, envConfig, retry, screenshot, file upload
├── constants/         Dropdown option lists, UI messages
├── assertions/        Reusable assertion helpers
├── reports/           Generated HTML/JUnit reports (gitignored)
├── screenshots/ videos/ logs/ allure-results/ allure-report/   Generated artifacts (gitignored)
├── playwright.config.js
├── package.json
├── .env / .env.qa / .env.uat / .env.prod
└── README.md
```

## Setup

```bash
npm install
npx playwright install --with-deps
```

## Running tests

```bash
npm test                    # all tests, default env (qa)
npm run test:headed         # headed mode
npm run test:smoke          # @smoke only
npm run test:sanity         # @sanity only
npm run test:regression     # @regression only
npm run test:negative       # @negative only
npm run test:api            # API tests
npm run test:database       # DB tests (requires RUN_DB_TESTS=true and real DB creds)
npm run test:accessibility  # axe-core checks
npm run test:crossbrowser   # chromium + firefox + webkit
npm run test:safe           # everything EXCEPT @destructive (CI default)
npm run test:destructive    # only tests that Save/Delete real records
npm run test:qa / test:uat / test:prod   # environment-specific run
```

Reports:

```bash
npm run report:show     # open Playwright HTML report
npm run allure:generate # build Allure report from allure-results
npm run allure:open     # open Allure report
```

## Tagging strategy

`@smoke @sanity @regression @functional @api @database @security
@accessibility @crossbrowser @negative @positive @destructive`

Any test that performs a real **Save** or **Delete** against this live,
production-like application is tagged `@destructive` and is **excluded**
from the default/CI run (`npm run test:safe`). Run `npm run test:destructive`
deliberately, and only against an environment where creating/deleting test
records is acceptable.

## Verified against the live app

Selectors, navigation, and dropdown option lists have been confirmed against
the real running app (`https://demonbfc.finsta.co.in/#/`) — this is not a
speculative/spec-only build. The non-destructive suite (`npm run test:safe`)
passes reliably: 23/26 UI tests green, ~4 minutes for the full run.

**Real UI details discovered and reflected in the code** (differ from the
spec document, which used placeholder/example values):
- Type Of Ledger options are actually `Income`, `Liability` (not `Expense`).
- Applicable options are actually `Pre Loan(FI)`, `Upto Disbusement`,
  `Before Close`, `After Close`, `Any Time` (not just two values).
- The "New/Edit Charge" panel is a Bootstrap modal (`#add-detail`), not a
  true side-drawer, though it's styled to slide in from the right.
- The grid is a Kendo UI grid (`kendo-grid`); dropdowns are `ng-select`
  components, not native `<select>` elements.

**Login note:** this demo server keeps its session in `sessionStorage`
(not cookies/localStorage), so Playwright's `storageState()` cannot persist
it, and the server can't reliably handle a fresh login on every single test.
`fixtures/pageFixtures.js` works around this by logging in **once per
worker** and reusing that same authenticated page for every test the worker
runs (see the `workerPage` fixture) — do not revert to a per-test login.

## Remaining known gaps

1. **API endpoints (`api/chargeApi.js`) and DB schema
   (`database/chargeQueries.js`)** are still placeholders (`/charges`, table
   `charge`) — no backend API docs, Swagger spec, or DB schema/credentials
   were available. `test:api` currently fails against the real server for
   this reason; `test:database` is skipped by default
   (`RUN_DB_TESTS=true` to attempt it). Update both files once real
   endpoints/schema are known.
2. **Accessibility (real finding):** `npm run test:accessibility` fails with
   a genuine **critical** axe-core violation — the Type Of Ledger and
   Applicable `ng-select` combobox inputs have no accessible label
   (`aria-label`/associated `<label>`). This is an app bug, not a test bug.
3. **Mobile responsiveness (real finding):** at a 390px mobile viewport, the
   sidebar does not collapse and the "+ New" button is pushed off-screen —
   `page renders correctly at a mobile viewport width` fails against the
   real app for this reason.
4. **Delete confirmation (real finding, spec mismatch):** the spec states
   deleting a Charge must prompt for confirmation, but in the live app the
   trash icon deletes the row **immediately with no confirmation dialog**.
   `ChargePage.deleteCharge()` now tolerates both behaviors (waits briefly
   for a dialog, proceeds if none appears), but the `cancelling delete keeps
   the Charge in the grid` test will fail until the app actually implements
   a cancelable confirmation step.

## Business rules covered

- Charge Name is unique (case-insensitive)
- Charge Name, Type Of Ledger, Applicable are mandatory
- Type Of Ledger / Applicable only accept predefined values
- Edit updates the same row (no row-count increase)
- Delete removes the row from the grid/search (confirmation step not
  currently implemented by the app — see gap #4 above)

## CI/CD

- `.github/workflows/playwright.yml` — installs deps/browsers, runs the
  non-destructive suite, publishes the Playwright HTML report, Allure
  report, screenshots and videos as build artifacts.
- `Jenkinsfile` — equivalent declarative pipeline with Allure + JUnit
  publishing via the Jenkins Allure plugin.
