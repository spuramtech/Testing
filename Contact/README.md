# Finsta Banking — Contact Module Automation Framework

Playwright + JavaScript (POM) automation framework for the Finsta NBFC
Contact module, generated from `CONTACT_FORM_AUTOMATION_PROMPT.md`.

## Stack
Playwright Test, Page Object Model, Winston logging, Allure + HTML
reporting, dotenv multi-environment config, Faker.js data generation,
JSON/CSV/Excel data-driven testing, MySQL/PostgreSQL DB utilities,
`APIRequestContext`-based API client.

## Setup
```bash
npm install
npx playwright install --with-deps
cp .env.qa .env   # or set ENV=qa/uat/prod
```
Fill in `LOGIN_USERNAME` / `LOGIN_PASSWORD` in the relevant `.env.*` file.

## Running tests
```bash
npm test                       # all tests, all browsers
npm run test:no-destructive    # excludes @destructive (recommended default)
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:negative
npm run test:chromium
npm run test:qa / test:uat / test:prod
```

Run only the live-data-creating end-to-end flow explicitly:
```bash
npx playwright test --grep @destructive
```

## Reports
```bash
npm run report:show     # Playwright HTML report
npm run allure:generate && npm run allure:open   # Allure report
```

## Project structure
```
pages/        Page Object classes (one per Contact tab + list + login)
tests/        Spec files (smoke, list, per-tab, e2e, accessibility)
fixtures/     Custom Playwright fixtures wiring page objects
helpers/      auth, data generation, file readers, validators
constants/    Route/tab/enum constants
assertions/   Reusable assertion helpers
api/          APIRequestContext client + Contact API wrapper (endpoints
              are placeholders — confirm real routes before enabling)
database/     MySQL/PostgreSQL client + Contact SQL queries (schema is
              placeholder — confirm real tables before enabling)
utils/        env loader, Winston logger
data/         JSON/CSV test data
```

## Status: what's verified vs provisional
Verified against actual screenshots: Contact List, Contact Info, Address
Details, KYC Documents, Bank Details, Personal Details, GST, Employment
Details (Employed state only), Income Details.

Provisional / not yet captured — see
`CONTACT_FORM_AUTOMATION_PROMPT.md` → "OPEN ITEMS / MISSING SCREENSHOTS":
- Login page UI (locators in `pages/LoginPage.js` are best-guess selectors)
- Business Entity mode for all tabs
- Employment Details in Self Employed / Others state
- Grid row edit/delete actions
- Toast/success message selectors
- Real API endpoints and DB schema

**Before running against the real app**: open the app once with
Playwright Inspector (`npx playwright codegen https://demonbfc.finsta.co.in`)
and correct any locator in `pages/*.js` that doesn't match the live DOM —
many locators here use positional/text-based fallbacks since exact
`id`/`name`/`data-testid` attributes weren't visible in the screenshots.

## Tags
`@smoke @sanity @regression @functional @api @database @security
@accessibility @crossbrowser @negative @positive @destructive @boundary
@e2e`

`@destructive` tests write real records to the shared Contact List and are
excluded from `test:no-destructive` and the CI/Jenkins default run.
