# Gold Functional Test Cases

Functional test suites for the Gold Module, organised **by menu module and form**. Each form folder holds everything for
that form – tests, page object, test-case inventory, docs, evidence and its own reports – and can be run on its own.

```
Gold Functional Test Cases/
├── common/                         shared by every form
│   ├── config/env.js               reads ..\.env (BASE_URL, logins, BROWSER, …)
│   ├── pages/                      LoginPage, GoldRateApprovalPage
│   └── utils/                      nav, dates, workdays, api, report.js, run-form.js
├── Gold Loan Configuration/        menu module
│   ├── RUN_GUIDE.md
│   └── Daily Gold Rate/            one form  (README.md inside)
│       ├── tests/                  functional, validation, business-rules, negative, positive, api, regression
│       ├── pages/                  DailyGoldRatePage
│       ├── fixtures/               logged-in page, API capture, actual-result recorder
│       ├── test-data/              test-cases.js (inventory), categories.js, gold-rate-data.js
│       ├── docs/                   entry-flow analysis, requirements, coverage-gap report
│       ├── evidence/               discovery screenshots, run-1 create evidence
│       ├── reports/                QMetryReport.html, qmetry-import.csv, execution-results.json, reconciliation.md
│       └── test-results/           raw Playwright results, screenshots, traces
├── Gold Rate Approval Queue/       a form on its own (README.md + RUN_GUIDE.md inside)
│   └── (same sub-folders as Daily Gold Rate)
├── Gold Scheme Matrix/             a form on its own (README.md + RUN_GUIDE.md inside)
├── Gold Estimates/                 a form on its own (README.md + RUN_GUIDE.md inside)
├── Gold Estimate Approval Queue/   a form on its own (README.md + RUN_GUIDE.md inside)
├── Gold Token/                     a form on its own (README.md + RUN_GUIDE.md inside)
├── playwright.config.js            one config; the runner points it at a form folder
└── package.json
```

## Setup (once)

```powershell
cd "C:\Users\Admin\OneDrive\Desktop\Gold Module\Gold Functional Test Cases"
npm install
npx playwright install chromium
```

URL and logins come from `Gold Module\.env` (shared with Gold Flow Entry).

## Run form-wise

```powershell
npm run forms                                       # list every form and its run command
npm run form -- "Daily Gold Rate"                   # one form (also: daily-gold-rate)
npm run form -- "Daily Gold Rate" --grep @smoke     # extra Playwright options after the form name
npm run form -- "Daily Gold Rate" --grep TC_GR_030  # one test case
npm run form -- "Daily Gold Rate" --report-only     # rebuild the report from the last run
npm run form -- "Gold Loan Configuration"           # every form in a module
npm run test:all                                    # every form
```

Short commands for Gold Token: `npm run goldtoken`, `goldtoken:smoke`, `goldtoken:regression`, `goldtoken:api`, `goldtoken:headed`, `goldtoken:report`.

Short commands for Gold Estimate Approval Queue: `npm run estimatequeue`, `estimatequeue:smoke`, `estimatequeue:regression`, `estimatequeue:api`, `estimatequeue:headed`, `estimatequeue:report`.

Short commands for Gold Estimates: `npm run goldestimate`, `goldestimate:smoke`, `goldestimate:regression`, `goldestimate:api`, `goldestimate:headed`, `goldestimate:report`.

Short commands for Gold Scheme Matrix: `npm run goldscheme`, `goldscheme:smoke`, `goldscheme:regression`, `goldscheme:api`, `goldscheme:headed`, `goldscheme:report`.

Short commands for Gold Rate Approval Queue: `npm run approvalqueue`, `approvalqueue:smoke`, `approvalqueue:regression`, `approvalqueue:api`, `approvalqueue:headed`, `approvalqueue:report`.

Short commands for Daily Gold Rate: `npm run dailygoldrate`, `dailygoldrate:smoke`, `dailygoldrate:regression`,
`dailygoldrate:api`, `dailygoldrate:headed`, `dailygoldrate:report` (opens its QMetryReport.html).

Each form's report is in `<Module>\<Form>\reports\QMetryReport.html`.

## Adding a new form

1. Create `<Module>\<Form Name>\` (or `<Form Name>\` directly in this folder for a stand-alone form) with `tests\`, `pages\`, `fixtures\`, `test-data\test-cases.js` (and optionally `test-data\categories.js`).
   Copying `Gold Loan Configuration\Daily Gold Rate` and replacing its tests is the quickest start.
2. Use shared code from `common\` (`require('../../../common/pages/LoginPage')` from the form's `pages`/`fixtures`).
3. Give test IDs a form prefix (e.g. `TC_GS_001` for Gold Scheme) and put the ID at the start of each test title.
4. `npm run forms` picks it up automatically – no config change needed.
