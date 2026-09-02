# Loans Configuration - Automation Framework

Playwright + JavaScript automation framework (Page Object Model) for the
**Loans Configuration** screen of the NBFC demo application
(`https://demonbfc.finsta.co.in/#/`).

## Stack

- Playwright Test (`@playwright/test`)
- Page Object Model architecture
- dotenv for environment configuration (`.env`, `.env.qa`, `.env.uat`, `.env.prod`)
- Winston logging (`utils/logger.js`), falls back to console if `winston` isn't installed
- Allure reporting (`allure-playwright`) alongside the built-in Playwright HTML report

## Setup

```bash
npm install
npx playwright install
```

Credentials and target URL live in `.env` / `.env.<env>`:

```
BASE_URL=https://demonbfc.finsta.co.in/#/
LOGIN_USERNAME=admin@kapilit.com
LOGIN_PASSWORD=kapil@finsta2024
```

Select an environment with `ENV=qa|uat|prod` (defaults to `qa`).

## Running tests

```bash
npm test                    # all tests, all browsers
npm run test:headed         # headed mode
npm run test:smoke          # @smoke only
npm run test:regression     # @regression only
npm run test:negative       # @negative only
npm run test:chromium       # single browser
npm run report               # open the last Playwright HTML report
```

Allure results are written to `allure-results/`. Generate/open the report with:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## Tags

`@smoke @sanity @regression @functional @negative @positive @destructive
@security @boundary @duplicate @search @print @e2e`

**Important:** tests in `tests/loansConfiguration/endToEnd.spec.js` actually click
Submit/Delete against the live app and are tagged `@destructive`. They are **not**
run by `npm test` by default in CI-style pipelines — run them deliberately with
`npm run test:destructive` only against an environment where creating/deleting
test data is acceptable.

## Structure

```
pages/                       Page Object classes (BasePage, LoginPage,
                              LoansConfigurationListPage, LoansConfigurationWizardPage)
fixtures/pageFixtures.js      Custom Playwright fixtures (page objects + authenticatedPage)
constants/testData.js         Credentials, loan type list, test data builders
utils/logger.js               Winston-based logger with console fallback
tests/loansConfiguration/     Spec files, one per concern:
  login.spec.js                 - authentication
  list.spec.js                   - list page, search, export, pagination
  loanCreationTab.spec.js        - Tab 1 (Loan Creation) incl. security/negative cases
  loanConfigurationTab.spec.js   - Tab 2 (Loan Configuration) incl. boundary rules
  installmentAndPenalTabs.spec.js- Tabs 3 & 4
  identificationDocumentsTab.spec.js - Tab 5 (accordions/checkboxes)
  endToEnd.spec.js                - full create/edit/delete flows (@destructive)
playwright.config.js          Test runner config (projects, reporters, timeouts)
```

## Known limitation — locators

The page objects use resilient, semantic locators (`getByRole`, `getByLabel`,
`getByText`) built directly from the field labels and button text documented in
`Loans Configuration prompt.md`. They were **not** verified against the live DOM
(no browser session was available while generating this framework). Before
relying on these tests:

1. Run `npm run codegen` against the real app to confirm exact accessible names,
   especially for the dropdowns, the "Not Applicable" checkboxes, and the
   Fixed %/Grace Period inputs on the Penal Interest tab — these are the
   locators most likely to need adjustment.
2. Run `npm run test:smoke -- --headed` first and fix any locator mismatches
   before running the full suite.

## Extending

- **API tests**: add an `api/` folder with a thin wrapper over
  `request.newContext()` and reuse `constants/testData.js` payloads.
- **DB validation**: add a `database/` folder with a `mysql2`/`pg` client and
  parameterized queries validating rows written by the E2E specs.
- **CI**: add `.github/workflows/playwright.yml` running
  `npm ci && npx playwright install --with-deps && npm run test:smoke`, then
  archive `reports/html-report` and `allure-results` as artifacts.
