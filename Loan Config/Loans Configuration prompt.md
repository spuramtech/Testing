====================================================
FRAMEWORK REQUEST
====================================================

Generate a complete automation framework that must follow industry best
practices and be production-ready, modular, reusable, maintainable, and
scalable.

====================================================
TECHNOLOGY STACK
====================================================

Framework: Playwright
Language: JavaScript (ES6+)
Architecture: Page Object Model (POM)
Package Manager: npm
Test Runner: Playwright Test
Reporting:
- Playwright HTML Report
- Allure Report
Logging:
- Winston/Pino Logger
Configuration:
- dotenv (.env)
Data:
- JSON
- Excel
- CSV
API:
- Playwright APIRequestContext
Database:
- MySQL/PostgreSQL examples
Version Control:
- Git
CI/CD:
- GitHub Actions
- Jenkins Pipeline

====================================================
FRAMEWORK REQUIREMENTS
====================================================

Generate a complete automation framework including:

Project Folder Structure
playwright.config.js
package.json
README.md
.env
.env.qa
.env.uat
.env.prod
.gitignore

Base Classes
BasePage
BaseTest
Fixtures
Hooks

Page Object Classes
Utilities
Reusable Helpers
Constants
Test Data
Assertions
Custom Reporter
Logger
API Utilities
Database Utilities
Authentication Utilities
File Upload Utilities
Screenshot Utility
Retry Utility
Parallel Execution
Cross Browser Configuration
Environment Configuration
Execution Commands

====================================================
FOLDER STRUCTURE
====================================================

project-root/
│
├── pages/
├── tests/
├── fixtures/
├── data/
├── api/
├── database/
├── utils/
├── helpers/
├── constants/
├── locators/
├── assertions/
├── reports/
├── screenshots/
├── videos/
├── logs/
├── allure-results/
├── allure-report/
├── playwright.config.js
├── package.json
├── .env
├── README.md

====================================================
LOGIN STEPS
====================================================

1. Open the application: https://demonbfc.finsta.co.in/#/
2. Enter the login credentials:
   - Username: admin@kapilit.com
   - Password: kapil@finsta2024
3. Click the Sign In button.

====================================================
NAVIGATION STEPS
====================================================

1. Click the Loans module.
2. Click Loan Configuration.
3. Click Loans Configuration (left sub-menu, under Loan Configuration).

====================================================
LOANS CONFIGURATION  (VERIFIED AGAINST ACTUAL UI — Loans > Loan
Configuration > Loans Configuration screens: list grid, and the
Loan Creation / Loan Configuration / Installment Due Date / Penal
Interest / Identification Documents tabbed wizard)
====================================================

Actual Screen Layout — Loans Configuration List Page

Header
- Breadcrumb: Loans | Loan Configuration | Loans Configuration
- Title: "Loans Configuration"
- Search box (top-left, magnifying-glass icon, with a clear "x" icon)
- Action icons (top-right): Export to PDF, Export to Excel, "+ New" button

Grid / List (columns)
- Loan Type  (e.g. "Bullet Loan", "Business Loan", "Gold Loan",
  "Loan Against Property")
- Loan Name  (e.g. "GOLD", "Lap", "Daily Business Loan",
  "Go Capital Business Loan", "New Business Loan",
  "Unsecured Business Loan", "New Gold Loan", "Loan Against Property")
- Loan ID  (e.g. "CSBL00018", "CSBLG00001", "CSBLAP00001",
  "BLDBL0000001", "USBL0000001", "BLNBL0000001", "UBL0000001",
  "GLGL0000001", "GLNGL0000001", "CSAP00001")
- Row-level actions: Edit (pencil icon), Delete (trash icon)

Pagination Footer
- First / Previous / Page Number(s) / Next / Last controls
- "x - y of z items" style record count (bottom-right, e.g.
  "1 - 10 of 17 items")

--------------------------------------------------------------------------
New / Edit Loan — Tabbed Wizard ("Loans Configuration")
--------------------------------------------------------------------------

Opened by clicking the "+ New" button (or the Edit pencil icon on a row,
which pre-fills the wizard with the selected row's data). The wizard has
5 tabs shown as pill/chip navigation across the top; the active tab is
highlighted dark blue. Tabs can be clicked directly to jump between
sections in addition to using the "Next" button to progress sequentially.
A breadcrumb-style header line ("Loans Configuration | Personal Loan |
Ss Pl | PLSP0000001") and a "View" button (top-right) are shown once a
loan record is selected/being edited.

Tab 1 — Loan Creation
Form Fields
- Loan Type *  (dropdown — Select)
- Loan Name *  (free-text input)
- Loan Code *  (free-text input)
- Company Code  (free-text input, highlighted/required styling)
- Branch Code  (free-text input, highlighted/required styling)
- Series  (free-text input, default "0000001")
- Loan ID  (free-text input, highlighted/required styling)
Grid below the form (existing configured loans)
- Columns: S.No., Loan Type, Loan Name, Loan ID (sortable via up/down
  arrows on each column header)
- Pagination: Previous / Page Number(s) / Next
Actions
- Clear  (red button with circular "x" icon — resets all form fields)
- Next  (blue button with chevron icon — advances to Loan Configuration
  tab)

Tab 2 — Loan Configuration
Form Fields
- Select Contact *  (radio: Individual / Business Entity)
- Applicant Type  (free-text/lookup input)
- Interest Mode  (radio: Fixed / Floating)
- Loan pay-in period  (dropdown — Select)
- Interest Rate Type  (dropdown — Select)
- Interest Rate per annum — Minimum  (numeric input)
- Interest Rate per annum — Maximum  (numeric input, "P.A" suffix)
- Loan Amount panel — "Not Applicable" checkbox; when unchecked:
  Minimum Loan Amount (numeric, default 0), Maximum Loan Amount
  (numeric, default 0)
- Tenure(Installments) panel — "Not Applicable" checkbox; when
  unchecked: From (numeric, default 0), To (numeric, default 0)
- This loan is effective from *  (date picker, defaults to current date)
Actions
- Add  (blue button — adds the configured interest/amount/tenure
  combination as a new row to the grid below)
Grid below the form (added configuration rows)
- Columns: S.No., Applicant type, Pay in, Interest Rate Type,
  Interest Mode, FRR Type, FRR Rate, Min. Interest Rate,
  Max. Interest Rate, Min Loan Amt, Max Loan Amt (horizontally
  scrollable — horizontal scrollbar shown at grid bottom)
- Empty state: "No data available in table"
Actions (bottom)
- Clear  (red button with circular "x" icon)
- Next  (blue button with chevron icon — advances to Installment Due
  Date tab)

Tab 3 — Installment Due Date
Form Fields
- Instalment Type Config  (radio: EMI / No EMI)
- Loan Installment Mode  (dropdown — Select)
- Installment Due Date  (radio group):
  - A fixed date of a month
  - Based on loan disbursal date
  - Installment due date
  - End of the Month
Actions
- Next  (blue button with chevron icon — advances to Penal Interest tab)

Tab 4 — Penal Interest
Form Fields
- How is Penal Interest Calculated?  (radio: Simple Interest)
- Penal Interest on DUE installments panel:
  - Fixed %  (radio, selected) with numeric input (default 0, "P.A"
    suffix)
- Grace Period panel:
  - Numeric input (default 0, "Days" suffix)
Actions
- Clear  (red button with circular "x" icon)
- Next  (blue button with chevron icon — advances to Identification
  Documents tab)

Tab 5 — Identification Documents
Intro text: "Select required/mandatory proofs"
Collapsible accordion sections (chevron toggle, default collapsed
except as noted):
- PAN / FORM 60  — rows: PAN CARD, Form 60
  (columns: Mandatory checkbox, Required checkbox, Proof Type)
- Identification Documents  — rows: Aadhaar, Voter ID, Passport,
  Driving Licence, utility Bills
  (columns: Mandatory checkbox, Required checkbox, Proof Type)
- Address Documents  — (accordion; proof rows load when expanded)
- Financial Documents  — rows: Pay Slip, Financial Statements,
  Form 16A, Form 16, ITR, GSTR 1, GSTR 2, GSTR 3B
  (columns: Mandatory checkbox, Required checkbox, Proof Type)
- Bank Proof  — rows: Bank Statement, Bank Passbook, Cheque with Name
  (columns: Mandatory checkbox, Required checkbox, Proof Type)
Each row has two independent checkboxes: "Mandatory" and "Required",
both unchecked by default, per Proof Type.
Actions
- Submit  (blue button with check icon — persists the full wizard
  configuration and returns to the Loans Configuration list, showing
  the new/updated row in the grid)

Auto Validation
- Loan Type, Loan Name, and Loan Code are mandatory on the Loan
  Creation tab before Next/Save succeeds
- Duplicate Loan Name/Loan Code should not be allowed (case-insensitive
  match against existing grid rows)
- Loan Type, Loan Installment Mode, Interest Rate Type, Loan pay-in
  period dropdowns must only accept values from their predefined
  option lists (no free text)
- "Not Applicable" checkboxes (Loan Amount, Tenure) disable their
  associated numeric inputs when checked and re-enable them when
  unchecked
- Interest Rate Minimum must not exceed Maximum; Tenure From must not
  exceed To; Loan Amount Minimum must not exceed Maximum
- Clear resets the current tab's fields to defaults without closing
  the wizard
- Navigating tabs directly (clicking a pill) preserves already-entered
  data in other tabs
- Editing an existing Loan pre-populates all tabs with the selected
  row's current values; Submit updates that same record in place (row
  count in the grid must not increase)
- Deleting a Loan (trash icon) must prompt for confirmation before
  removing the row, and the deleted Loan must no longer appear in
  search results or the grid
- At least one Proof Type combination should be selectable per
  document category on the Identification Documents tab

Test Coverage Notes (Loans Configuration screen specific)
- New button opens an empty Loan Creation tab; Edit opens the wizard
  pre-filled with the row's data across all 5 tabs
- Mandatory-field validation on Loan Creation: blank Loan Name, Loan
  Type not selected, blank Loan Code, and combinations thereof
- Duplicate Loan Name/Loan Code validation (exact match and
  case-insensitive match)
- Loan Type dropdown: verify full option list (Bullet Loan, Business
  Loan, Gold Loan, Loan Against Property, Personal Loan, etc.), default
  "Select" placeholder, single-select behavior
- Loan Configuration tab: Individual vs Business Entity radio toggles
  Applicant Type behavior; Fixed vs Floating Interest Mode toggles
  associated fields; "Not Applicable" checkboxes correctly
  enable/disable Loan Amount and Tenure inputs
- Add button on Loan Configuration tab appends a new row to the
  configuration grid with correct column values; multiple rows can be
  added
- Installment Due Date tab: EMI vs No EMI radio toggles Loan
  Installment Mode dropdown relevance; only one Installment Due Date
  radio option selectable at a time
- Penal Interest tab: Fixed % numeric input accuracy; Grace Period
  numeric input accuracy; Clear resets both panels
- Identification Documents tab: expand/collapse each accordion
  section; Mandatory/Required checkboxes are independently togglable
  per Proof Type row; verify full proof-type list per category
- Submit with valid data across all tabs adds a new row to the Loans
  Configuration grid and returns to the list
- Submit while editing updates the existing row without creating a
  duplicate
- Clear button behavior on Loan Creation, Loan Configuration, and
  Penal Interest tabs
- Tab navigation: clicking tab pills directly (not just Next) moves
  between sections without losing unsaved in-progress data
- Delete: confirmation prompt, cancel vs confirm delete, row removed
  from grid after confirm, record count in pagination footer decrements
- Search box: filter grid by Loan Name/Loan Type (partial match, no
  results found, clearing search restores full list)
- Export to PDF / Export to Excel: file is generated and contains the
  currently visible grid data
- Pagination: First / Previous / Next / Last controls enable/disable
  correctly at boundaries; "x - y of z items" count stays accurate
  after add/edit/delete
- Sortable grid columns (S.No., Loan Type, Loan Name, Loan ID) on the
  Loan Creation tab's embedded grid sort ascending/descending correctly
- Horizontal scroll on the Loan Configuration tab's added-rows grid
  reveals all columns (FRR Type, FRR Rate, Min/Max Interest Rate,
  Min/Max Loan Amt) without data clipping

====================================================
TEST COVERAGE
====================================================

1. Unit Testing
2. Smoke Testing
3. Sanity Testing
4. Regression Testing
5. Functional Testing
6. UI Testing
7. End-to-End Testing
8. Validation Testing
9. Business Rule Validation
10. API Validation
11. Database Validation
12. Security Testing
13. Accessibility Testing (axe-core)
14. Cross Browser Testing
15. Responsive Testing
16. Boundary Value Analysis
17. Equivalence Partitioning
18. Negative Testing
19. Positive Testing
20. Exception Handling
21. Error Message Validation
22. File Upload Validation
23. Search Validation
24. Sorting Validation
25. Filtering Validation
26. Print Validation
27. Role-Based Access Testing
28. Session Validation
29. Duplicate Loan Validation
30. Currency Validation
31. Date Validation
32. Sanity Test Cases
33. Edge Case Test Scenarios
34. Performance Test Recommendations
35. DAST and SAST Vulnerabilities
36. Microfrontend Integration Testing (only if the application under test
    is built using a microfrontend architecture; otherwise not applicable)
37. Telematics Testing (only if the application integrates telematics/GPS/
    vehicle-tracking data; otherwise not applicable)

====================================================
BUSINESS RULES
====================================================

- Loan Name and Loan Code must be unique.
- Loan Type, Loan Name, and Loan Code are required fields and cannot be
  empty.
- Loan Type, Loan Installment Mode, and Interest Rate Type must be
  selected from predefined lists only.
- Interest Rate Minimum cannot exceed Interest Rate Maximum.
- Loan Amount Minimum cannot exceed Loan Amount Maximum (when
  "Not Applicable" is unchecked).
- Tenure From cannot exceed Tenure To (when "Not Applicable" is
  unchecked).
- Only one Installment Due Date option can be active at a time.
- Only authorized users can create, edit, or delete a Loan
  Configuration.
- Deleted Loan Configurations should not appear in search or the grid.
- Duplicate Loan Name/Loan Code combinations are not allowed.
- At least the mandatory Identification Document proof types must be
  configured before the loan configuration is considered complete.

====================================================
NEGATIVE TEST SCENARIOS
====================================================

- Blank mandatory fields (Loan Type, Loan Name, Loan Code)
- Special characters in Loan Name / Loan Code
- SQL Injection
- XSS Injection
- Large text input in Loan Name / Loan Code
- Duplicate Loan Name / Loan Code
- Interest Rate Minimum greater than Maximum
- Loan Amount Minimum greater than Maximum
- Tenure From greater than To
- Network interruption during Submit
- Expired session
- Unauthorized access
- Selecting an invalid/unsupported option via forced DOM manipulation on
  the dropdowns
- Submitting the wizard with an incomplete tab (skipping required tabs
  via direct pill navigation)

====================================================
API AUTOMATION
====================================================

Reusable API utilities for:
- Create Loan Configuration
- Update Loan Configuration
- Delete Loan Configuration
- Fetch Loan Configuration List
- Fetch Loan Configuration by Id
- Save Loan Creation tab data
- Save Loan Configuration (interest/amount/tenure) tab data
- Save Installment Due Date tab data
- Save Penal Interest tab data
- Save Identification Documents tab data
- Validate API Response
- Schema Validation
- Authentication
- Token Management
- Reusable API Client

====================================================
DATABASE VALIDATION
====================================================

Reusable database utilities for:
- MySQL
- PostgreSQL
- Validate inserted Loan Configuration
- Validate updated Loan Configuration
- Validate deleted Loan Configuration
- Validate Identification Document proof-type mappings
- Parameterized SQL queries

====================================================
REPORTING
====================================================

- Playwright HTML Report
- Allure Report
- Screenshots on failure
- Videos on failure
- Trace Viewer
- Execution Logs
- Console Logs
- Timestamped Reports

====================================================
LOGGING
====================================================

Enterprise logging using Winston/Pino including:
- Info
- Debug
- Warning
- Error
- Execution Start
- Execution End
- API Logs
- Database Logs

====================================================
ASSERTIONS
====================================================

Reusable assertion utilities for:
- Element Visibility
- Element Enabled
- Element Disabled
- Element Text
- Page URL
- Page Title
- Toast Message
- Table Validation
- Dropdown Validation
- Accordion Expand/Collapse Validation
- Checkbox State Validation
- API Response
- Database Values

====================================================
TEST DATA MANAGEMENT
====================================================

Data-driven testing with:
- JSON
- CSV
- Excel
- Parameterized test execution
- Dynamic data generation using Faker.js

====================================================
PLAYWRIGHT FEATURES
====================================================

- Page Fixtures
- Custom Fixtures
- beforeAll
- beforeEach
- afterEach
- afterAll
- Soft Assertions
- Explicit Waits
- Reusable Locators
- Environment-based execution
- Retries
- Parallel execution
- Serial execution where needed
- Browser Context Management
- Multiple User Sessions
- Storage State Authentication

====================================================
TAGS
====================================================

@smoke @sanity @regression @functional @api @database @security
@accessibility @crossbrowser @negative @positive @destructive

Note: any test that clicks Submit/Delete on this live production-like app
must additionally be tagged @destructive and excluded by default from
routine runs.

====================================================
CROSS BROWSER
====================================================

- Chromium
- Firefox
- WebKit
- Headed Mode
- Headless Mode

====================================================
CI/CD
====================================================

Complete pipelines for:
- GitHub Actions
- Jenkins

Including:
- Install dependencies
- Execute tests
- Publish Allure Report
- Archive HTML Report
- Upload screenshots
- Upload videos
- Generate artifacts

====================================================
BEST PRACTICES
====================================================

- SOLID Principles
- DRY
- KISS
- YAGNI
- Reusable Components
- Clean Architecture
- Dependency Injection where applicable
- Proper Error Handling
- Meaningful Comments
- Meaningful Variable Names
- Modular Code
- Reusable Functions
- No hardcoded waits
- No duplicated code

====================================================
DELIVERABLES
====================================================

Generate complete runnable code for every file in the framework. Do not
provide only snippets — generate every required file completely,
including:
- Folder structure
- JavaScript source code
- Configuration files
- Test data
- Sample API payloads
- Database utilities
- Complete Page Object classes
- Reusable helper classes
- Example end-to-end test scripts
- Execution commands
- README documentation
- CI/CD YAML files
- Jenkinsfile
- Allure configuration
- Logger configuration

The final output must be production-ready and capable of being cloned,
installed using npm install, and executed immediately using Playwright in
a real enterprise project.
