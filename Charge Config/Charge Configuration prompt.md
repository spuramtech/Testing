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
3. Click Charge Configuration (left sub-menu, under Loan Configuration).

====================================================
CHARGE CONFIGURATION  (VERIFIED AGAINST ACTUAL UI — Loans > Loan
Configuration > Charge Configuration screens: add/config form and the
Charge Configuration list grid)
====================================================

Actual Screen Layout — Charge Configuration List Page

Header
- Breadcrumb: Loans | Loan Configuration | Charge Configuration
- Title: "Loans" (page header) / "Charge Configuration" (breadcrumb leaf)
- Search box (top-left, magnifying-glass icon, with a clear "x" icon)
- Action icons (top-right): Export to PDF, Export to Excel, "+ New" button

Grid / List (columns)
- Loan Type  (e.g. "Business Loan", "Personal Loan", "Loan Against
  Property", "Gold Loan", "Bullet Loan")
- Loan Name  (e.g. "Go Capital Business Loan", "New Business Loan",
  "Shaan Finance Personal Loan", "Daily Business Loan",
  "Unsecured Business Loan", "Personal Loan", "Top Light Lap",
  "Gold Loan", "Bullet Loan")
- Charge / Fee  (e.g. "Processing Charges", "Documentation Charges",
  "Application Fee", "Processing Fee", "Processing Fees",
  "Documentation Charge", "Appraisal Fees")
- Row-level actions: Edit (pencil icon), Delete (trash icon)

Pagination Footer
- First / Previous / Page Number(s) / Next / Last controls
- "x - y of z items" style record count (bottom-right, e.g.
  "1 - 10 of 19 items")

--------------------------------------------------------------------------
New / Edit Charge — "Charge Configuration" Form
--------------------------------------------------------------------------

Opened by clicking the "+ New" button (or the Edit pencil icon on a row,
which pre-fills the form with the selected row's data). A "View" button
(top-right) toggles back to the list grid.

Section 1 — Charge Header / Selection
Form Fields
- Loan Type *  (dropdown — e.g. "Personal Loan")
- Loan Name *  (dropdown — e.g. "Personal Loan")
- Charge Name  (dropdown — Select; lists available Charge/Fee types not
  yet configured for the selected Loan Type/Loan Name combination)
Actions
- Add And Save  (blue button with check icon — adds the selected Charge
  Name as a new row in the "already configured charges" grid below and
  persists it)

Grid below the form (already configured charges for this loan)
- Columns: S.No., Loan Type, Loan Name, Charge / Fee (sortable via
  up/down arrows on each column header)
- Row action: "Config" button (opens/expands the Charge Amount panel
  below, scoped to that row's Loan Type-Loan Name-Charge Name)
- Row action: Delete (trash icon)

Section 2 — Charge Amount Panel
Panel heading: "Charge Amount - {Loan Type}-{Loan Name}-{Charge Name}"
  (dynamically reflects the row currently selected via "Config")

Toggle (mutually exclusive, pill/segment buttons; active = filled/orange,
inactive = outline)
- "Charge is Dependent on loan range"
- "Charge is Not Dependent on loan range"

Common Fields (shown regardless of toggle selection)
- Applicant type  (dropdown — Select)
- Loan Pay In  (dropdown — Select)

--- When "Charge is Not Dependent on loan range" is selected ---
- Charge Type  (radio: Fixed / Percentage)
  - Percentage selected shows a numeric "%" input field
- Minimum Charge Amount  (numeric input, default 0)
- Maximum Charge Amount  (numeric input, default 0)

--- When "Charge is Dependent on loan range" is selected ---
- Additional toggle: "On Value" / "On Tenure"  (pill/segment buttons,
  active = filled/orange, inactive = outline)
- "Range" panel:
  - Min Loan Value  (numeric input)
  - Max Loan Value  (numeric input)
- "Charge" panel:
  - Percentage (%)  (numeric input)
  - Min Charge  (numeric input)
  - Max Charge  (numeric input)
- Actions: "Clear Grid" (red button with circular "x" icon) and
  "Add To Grid" (blue button with "+" icon — appends the current
  range/charge row to the grid below)
- Grid below (added range rows, horizontally scrollable):
  - Columns: S.No., Applicant Type, Loan pay-in, Min. Loan Value /
    Tenure, Max. Loan Value / Tenure, Percentage (%), Min Amount,
    Max Amount, Min. Charge (and further columns off-screen, revealed
    via horizontal scrollbar)
  - Empty state: "No data available in table"

GST Type panel (shown regardless of dependency toggle)
- Include  (radio)
- Exclude  (radio, with adjacent "GST %" dropdown — Select)
- No GST  (radio)

Effective Date
- "This Charge is Effective From"  (date picker, defaults to current
  date, format DD/MM/YYYY)

Actions (bottom of Charge Amount panel)
- Add Charge  (blue button with "+" icon — appends the fully configured
  charge-amount row to the master grid at the bottom of the page)

Master Grid (bottom of page, horizontally scrollable)
- Columns: S.No., Loan Type, Loan Name, Charge / Fee, Dependent on Loan
  Range, Applicant Type, Loan pay-in, Charge Applicable On, Min. Loan
  Value, Max. Loan Value (and further columns off-screen, revealed via
  horizontal scrollbar)

Page-level Actions (bottom-right, always visible)
- Clear  (red button with circular "x" icon — resets the entire form)
- Submit  (blue button with check icon — persists the full Charge
  Configuration and returns to / refreshes the Charge Configuration
  list, showing the new/updated row in the grid)

Auto Validation
- Loan Type, Loan Name are mandatory before a Charge Name can be
  selected and before "Add And Save" succeeds
- Charge Name dropdown only lists Charge/Fee types not already
  configured for the selected Loan Type/Loan Name combination
  (no duplicate Charge/Fee per Loan Type-Loan Name pair)
- "Charge is Dependent on loan range" and "Charge is Not Dependent on
  loan range" are mutually exclusive; selecting one deselects the other
  and swaps the visible field set
- "On Value" and "On Tenure" are mutually exclusive within the
  Dependent-on-range mode
- Charge Type radio (Fixed / Percentage) is mutually exclusive;
  selecting Percentage reveals/activates the "%" numeric input
- Minimum Charge Amount must not exceed Maximum Charge Amount
  (Not-Dependent mode); Min Loan Value must not exceed Max Loan Value
  and Min Charge must not exceed Max Charge (Dependent mode)
- GST Type radio (Include / Exclude / No GST) is mutually exclusive;
  selecting Exclude enables the adjacent "GST %" dropdown
- "Add To Grid" requires Min/Max Loan Value and Percentage/Min/Max
  Charge to be populated before a row is appended
- "Clear Grid" empties the range-rows grid without closing the panel
- "Add Charge" requires the Charge Amount panel (dependency mode,
  applicant type, loan pay-in, GST type, effective date) to be
  completed before appending to the master grid
- Editing an existing Charge (Config button) pre-populates the Charge
  Amount panel with the selected row's current values; Submit updates
  that same record in place (row count in the master/list grid must
  not increase)
- Deleting a Charge (trash icon, either sub-grid or list grid) must
  prompt for confirmation before removing the row, and the deleted
  Charge must no longer appear in search results or the grid
- Clear (page-level) resets all sections (header selection, Charge
  Amount panel, GST Type, effective date, master grid) to defaults

Test Coverage Notes (Charge Configuration screen specific)
- New button opens an empty Charge Configuration form; Edit/Config
  opens the form pre-filled with the row's data
- Mandatory-field validation on the header section: blank Loan Type,
  blank Loan Name, Charge Name not selected, and combinations thereof
- Duplicate Charge/Fee validation for the same Loan Type-Loan Name pair
  (Charge Name dropdown must exclude already-configured charges)
- Loan Type / Loan Name dropdowns: verify full option list, default
  "Select" placeholder, single-select behavior, and that Loan Name
  options are filtered/relevant to the selected Loan Type
- "Add And Save" appends a new row to the configured-charges grid with
  correct column values; multiple charges can be added per loan
- "Config" button opens the Charge Amount panel scoped to the correct
  row (heading reflects the correct Loan Type-Loan Name-Charge Name)
- Charge is Dependent vs Not Dependent on loan range toggle correctly
  shows/hides the associated field sets without losing unrelated data
- Not-Dependent mode: Fixed vs Percentage Charge Type toggle; Minimum/
  Maximum Charge Amount numeric accuracy and boundary validation
- Dependent mode: On Value vs On Tenure toggle; Range (Min/Max Loan
  Value) and Charge (Percentage/Min/Max Charge) numeric accuracy;
  "Add To Grid" appends correct row; "Clear Grid" empties the grid;
  multiple range rows can be added and are listed correctly
- GST Type panel: Include / Exclude / No GST mutually exclusive
  behavior; GST % dropdown enabled only when Exclude is selected;
  full GST % option list
- Effective Date: date picker defaults to current date, accepts valid
  future/past dates per business rule, correct DD/MM/YYYY format
- "Add Charge" appends a fully configured row to the master grid at
  the bottom with all selected values reflected in the correct columns
- Submit with valid data across all sections adds/updates the Charge
  Configuration list grid and returns to the list
- Submit while editing updates the existing row without creating a
  duplicate
- Clear (page-level) resets the entire form to defaults
- Delete (sub-grid and list grid): confirmation prompt, cancel vs
  confirm delete, row removed from grid after confirm, record count in
  pagination footer decrements
- Search box: filter list grid by Loan Name/Loan Type/Charge Fee
  (partial match, no results found, clearing search restores full list)
- Export to PDF / Export to Excel: file is generated and contains the
  currently visible grid data
- Pagination: First / Previous / Next / Last controls enable/disable
  correctly at boundaries; "x - y of z items" count stays accurate
  after add/edit/delete
- Sortable grid columns (S.No., Loan Type, Loan Name, Charge/Fee) on
  the configured-charges sub-grid sort ascending/descending correctly
- Horizontal scroll on the Dependent-mode range grid and the master
  grid reveals all columns without data clipping

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
29. Duplicate Charge Validation
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

- Loan Type and Loan Name are required fields on the header section and
  cannot be empty before a Charge Name can be selected.
- A Charge/Fee cannot be configured more than once for the same Loan
  Type-Loan Name combination.
- "Charge is Dependent on loan range" and "Charge is Not Dependent on
  loan range" are mutually exclusive states for a given charge.
- In Not-Dependent mode, Minimum Charge Amount cannot exceed Maximum
  Charge Amount.
- In Dependent mode, Min Loan Value cannot exceed Max Loan Value, and
  Min Charge cannot exceed Max Charge, for any given range row.
- "On Value" and "On Tenure" are mutually exclusive within Dependent
  mode.
- GST Type (Include / Exclude / No GST) must be a single selection;
  GST % is required only when Exclude is selected.
- Charge Type (Fixed / Percentage) must be a single selection.
- Only authorized users can create, edit, or delete a Charge
  Configuration.
- Deleted Charge Configurations should not appear in search or the
  grid.
- Editing an existing Charge Configuration must update the existing
  record, not create a duplicate.

====================================================
NEGATIVE TEST SCENARIOS
====================================================

- Blank mandatory fields (Loan Type, Loan Name, Charge Name)
- Special characters in numeric fields (Charge Amount, Percentage,
  Min/Max Loan Value, Min/Max Charge)
- SQL Injection
- XSS Injection
- Large/overflow numeric values in Charge Amount / Percentage / Loan
  Value fields
- Duplicate Charge/Fee for the same Loan Type-Loan Name combination
- Minimum Charge Amount greater than Maximum Charge Amount
- Min Loan Value greater than Max Loan Value
- Min Charge greater than Max Charge
- Percentage value outside 0-100 range
- Submitting "Add To Grid" or "Add Charge" with incomplete required
  fields
- Network interruption during Add And Save / Add Charge / Submit
- Expired session
- Unauthorized access
- Selecting an invalid/unsupported option via forced DOM manipulation on
  the dropdowns
- Toggling Dependent/Not-Dependent or On Value/On Tenure repeatedly
  without data loss/corruption in already-entered fields

====================================================
API AUTOMATION
====================================================

Reusable API utilities for:
- Create Charge Configuration
- Update Charge Configuration
- Delete Charge Configuration
- Fetch Charge Configuration List
- Fetch Charge Configuration by Id
- Save Charge header (Loan Type/Loan Name/Charge Name) data
- Save Charge Amount (Not-Dependent) data
- Save Charge Amount (Dependent on loan range) data, including range
  grid rows
- Save GST Type / Effective Date data
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
- Validate inserted Charge Configuration
- Validate updated Charge Configuration
- Validate deleted Charge Configuration
- Validate Charge Amount range-row mappings (Dependent mode)
- Validate GST Type / GST % persistence
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
- Radio/Toggle State Validation
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
