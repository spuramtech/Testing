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
3. Click Pre-closure (left sub-menu, under Loan Configuration).

====================================================
PRE-CLOSURE  (VERIFIED AGAINST ACTUAL UI — Loans > Loan Configuration >
Pre-closure screens: list grid ("PreClosure") and the New/Edit
Pre-closure configuration form)
====================================================

Actual Screen Layout — Pre-closure List Page

Header
- Breadcrumb: Loans | Loan Configuration | Pre-closure
- Left nav highlights "Pre-closure" (red/active) under Loan
  Configuration, alongside sibling items: Charge, Loans Configuration,
  Charge Configuration
- Search box (top-left, magnifying-glass icon, with a clear "x" icon)
- Action icons (top-right): Export to PDF, Export to Excel, "+ New"
  button (blue)

Grid / List — Title "PreClosure" (columns)
- Loan Type  (e.g. "Bullet Loan", "Loan Against Property",
  "Personal Loan", "Vehicle Loan", "Business Loan")
- Loan Name  (e.g. "Bullet Loan", "Loan Against Property",
  "Personal Loan", "Quick Loan", "New Vehicle Loan",
  "Go Capital Business Loan")
- Min. Lock in Period  (e.g. "6 Months", "1 Months", "2 Months",
  "0 Days", "3 Months")
- Charge Type  (e.g. "percentage")
- Interest Calculated on  (e.g. "Future Principal",
  "Future and Outstanding Principal")
- Each column header has a 3-dot (⋮) column menu/sort icon
- Row-level actions: Edit (pencil icon), Delete (trash icon)

Pagination Footer
- First / Previous / Page Number(s) / Next / Last controls
- "x - y of z items" style record count (bottom-right, e.g.
  "1 - 6 of 6 items")

--------------------------------------------------------------------------
New / Edit Pre-closure — Configuration Form
--------------------------------------------------------------------------

Opened by clicking the "+ New" button (or the Edit pencil icon on a row,
which pre-fills the form with the selected row's data). This is a single
(non-tabbed) form. A breadcrumb-style header line ("Loans |
Loan Configuration | Pre-closure") is shown, along with a "View" button
(top-right, blue, back-arrow icon) that returns to the list grid.

Form Fields
- Loan Type  (dropdown — Select)
- Loan Name  (dropdown — Select)
- Min. Lock-in Period before availing preclosure of loan  (numeric input
  + adjoining unit dropdown — Select; unit values include Days/Months
  as seen in the grid, e.g. "0 Days", "1 Months", "6 Months")
- Charge Type panel:
  - Percentage  (numeric input with "%" suffix box)
- Pre-Closure interest is calculated on  (radio group):
  - Future Principal
  - Future Principal and Outstanding Principal
- GST is  (radio group):
  - Included
  - Excluded  (default selected) — reveals adjoining "GST %"
    dropdown (Select) when chosen
  - No GST

Actions (bottom-right)
- Clear  (red button with circular "x" icon — resets all form fields to
  defaults)
- Save  (blue button with check icon — persists the Pre-closure
  configuration and returns to the Pre-closure list, showing the
  new/updated row in the grid)

Auto Validation
- Loan Type and Loan Name are mandatory before Save succeeds
- Loan Name dropdown options are dependent on/filtered by the selected
  Loan Type
- Min. Lock-in Period numeric value and its unit (Days/Months) are both
  required together
- Charge Type Percentage must be a valid numeric value (e.g. 0-100,
  non-negative)
- Only one "Pre-Closure interest is calculated on" option can be
  selected at a time (Future Principal vs Future Principal and
  Outstanding Principal)
- Only one "GST is" option can be selected at a time (Included /
  Excluded / No GST)
- Selecting "Excluded" for GST requires a GST % to be chosen from the
  adjoining dropdown; "Included" and "No GST" hide/disable that dropdown
- Duplicate Pre-closure configuration for the same Loan Type + Loan Name
  combination should not be allowed
- Clear resets the current form's fields to defaults without closing
  the form
- Editing an existing Pre-closure row pre-populates the form with the
  selected row's current values; Save updates that same record in place
  (row count in the grid must not increase)
- Deleting a Pre-closure row (trash icon) removes it immediately, with no
  confirmation step (verified against the live app); the deleted row must
  no longer appear in search results or the grid

Test Coverage Notes (Pre-closure screen specific)
- New button opens an empty Pre-closure form; Edit opens the form
  pre-filled with the row's data
- Mandatory-field validation on the form: Loan Type not selected, Loan
  Name not selected, blank Min. Lock-in Period, and combinations thereof
- Loan Type dropdown: verify full option list (Bullet Loan, Loan Against
  Property, Personal Loan, Vehicle Loan, Business Loan, Gold Loan, etc.),
  default "Select" placeholder, single-select behavior
- Loan Name dropdown: options change based on the selected Loan Type;
  default "Select" placeholder
- Min. Lock-in Period: numeric input accuracy, unit dropdown (Days/
  Months) selection, boundary values (0 Days, large values)
- Charge Type Percentage: numeric input accuracy, boundary values
  (0%, 100%, negative, decimal)
- "Pre-Closure interest is calculated on" radio toggle: Future Principal
  vs Future Principal and Outstanding Principal, default selection,
  mutually exclusive behavior
- "GST is" radio toggle: Included vs Excluded vs No GST, default
  selection ("Excluded"), GST % dropdown appears only when "Excluded" is
  selected, mutually exclusive behavior
- Save with valid data adds a new row to the Pre-closure grid and
  returns to the list
- Save while editing updates the existing row without creating a
  duplicate
- Clear button resets all fields (Loan Type, Loan Name, Min. Lock-in
  Period, Charge Type Percentage, radio selections) to defaults
- Delete: row is removed from the grid immediately on clicking the trash
  icon (no confirmation step), record count in pagination footer decrements
- Search box: filter grid by Loan Name/Loan Type (partial match, no
  results found, clearing search restores full list)
- Export to PDF / Export to Excel: file is generated and contains the
  currently visible grid data
- Pagination: First / Previous / Next / Last controls enable/disable
  correctly at boundaries; "x - y of z items" count stays accurate
  after add/edit/delete
- Sortable/menu-driven grid columns (Loan Type, Loan Name, Min. Lock in
  Period, Charge Type, Interest Calculated on) via the 3-dot column menu
- Duplicate Loan Type + Loan Name Pre-closure configuration validation
  (exact match and case-insensitive match)

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
29. Duplicate Pre-closure Configuration Validation
30. Currency/Percentage Validation
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

- A Pre-closure configuration is uniquely identified by the Loan Type +
  Loan Name combination; duplicates are not allowed.
- Loan Type and Loan Name are required fields and cannot be empty.
- Loan Type and Loan Name must be selected from predefined lists only,
  with Loan Name filtered/dependent on the selected Loan Type.
- Min. Lock-in Period (value + unit) is required and must be a
  non-negative numeric value.
- Charge Type Percentage must be a valid non-negative numeric value.
- Only one "Pre-Closure interest is calculated on" option can be active
  at a time (Future Principal or Future Principal and Outstanding
  Principal).
- Only one "GST is" option can be active at a time (Included, Excluded,
  or No GST); GST % is mandatory only when "Excluded" is selected.
- Only authorized users can create, edit, or delete a Pre-closure
  configuration.
- Deleted Pre-closure configurations should not appear in search or the
  grid.

====================================================
NEGATIVE TEST SCENARIOS
====================================================

- Blank mandatory fields (Loan Type, Loan Name, Min. Lock-in Period)
- Special characters in numeric fields (Min. Lock-in Period, Charge Type
  Percentage)
- SQL Injection
- XSS Injection
- Large/out-of-range numeric values in Min. Lock-in Period / Percentage
- Duplicate Loan Type + Loan Name Pre-closure configuration
- Negative or non-numeric Charge Type Percentage
- Selecting "Excluded" for GST without choosing a GST %
- Network interruption during Save
- Expired session
- Unauthorized access
- Selecting an invalid/unsupported option via forced DOM manipulation on
  the dropdowns
- Submitting the form with an incomplete Loan Type/Loan Name dependency
  (Loan Name selected before Loan Type, via forced DOM manipulation)

====================================================
API AUTOMATION
====================================================

Reusable API utilities for:
- Create Pre-closure Configuration
- Update Pre-closure Configuration
- Delete Pre-closure Configuration
- Fetch Pre-closure Configuration List
- Fetch Pre-closure Configuration by Id
- Fetch Loan Name list by Loan Type (dependent dropdown)
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
- Validate inserted Pre-closure Configuration
- Validate updated Pre-closure Configuration
- Validate deleted Pre-closure Configuration
- Validate Loan Type/Loan Name dependency mapping
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
- Radio Button State Validation
- Conditional Field Visibility Validation (e.g. GST % dropdown)
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

Note: any test that clicks Save/Delete on this live production-like app
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
