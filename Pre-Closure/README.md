# Pre-closure Automation (Playwright + POM)

Playwright automation targeting **Loans > Loan Configuration > Pre-closure**
in the Finsta NBFC demo app, based on `Pre-Closure prompt.md`.

## Setup

```bash
npm install
npx playwright install
```

`.env` holds `BASE_URL`, `LOGIN_USERNAME`, `LOGIN_PASSWORD`.

## Run

```bash
npm test                  # all tests, all browsers
npm run test:smoke        # @smoke only
npm run test:regression   # @regression only
npm run test:headed       # headed mode
npm run report            # open the last HTML report
```

## Structure

- `pages/` — Page Object classes (`LoginPage`, `PreClosurePage`)
- `fixtures/baseFixtures.js` — `loggedInPage`, `preClosurePage` fixtures
- `tests/` — smoke, functional (positive), negative specs
- `data/` — JSON test data

## Notes

- Locators in `PreClosurePage.js` are written against the observed UI
  (dropdowns/inputs by position, radios by label) and should be tightened
  with `data-testid`/stable selectors once available from the dev team —
  positional locators are brittle if the form layout changes.
- Tests tagged `@destructive` create/edit/delete real records in this
  environment and are excluded from routine runs by default; run
  explicitly with `--grep @destructive` only against a safe environment.
- Full enterprise scope from the prompt (API layer, DB validation, Allure,
  CI/CD pipelines, multi-env config) is intentionally out of scope here —
  this delivers a working, runnable UI test suite for the Pre-closure form.
  Extend incrementally as those layers become needed.
