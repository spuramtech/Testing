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
3. Click Charge (left sub-menu, under Loan Configuration).

====================================================
CHARGE  (VERIFIED AGAINST ACTUAL UI — Loans > Loan Configuration > Charge
screen and "New Charge Name" side panel screenshots)
====================================================

Actual Screen Layout — Charge List Page

Header
- Breadcrumb: Loans | Loan Configuration | Charge
- Search box (top-left, magnifying-glass icon, with a clear "x" icon)
- Action icons (top-right): Export to PDF, Export to Excel, "+ New" button

Grid / List (columns)
- Charge  (e.g. "Processing Charges")
- Type Of Ledger  (e.g. "Income")
- Applicable  (e.g. "Upto Disbusement")
- Row-level actions: Edit (pencil icon), Delete (trash icon)

Pagination Footer
- First / Previous / Page Number / Next / Last controls
- "1 - 1 of 1 items" style record count (bottom-right)

--------------------------------------------------------------------------
New / Edit Charge — Side Panel ("New Charge Name")
--------------------------------------------------------------------------

Opened by clicking the "+ New" button (or the Edit pencil icon on a row,
which pre-fills the same panel with the selected row's data).

Form Fields
- New Charge Name *  (free-text input)
- Type Of Ledger *  (dropdown — Select; e.g. Income, Expense)
- Applicable *  (dropdown — Select; e.g. Upto Disbusement)

Panel Actions
- Clear  (red button with circular "x" icon — resets the form fields)
- Save  (blue button with check icon — persists the record and returns to
  the Charge list, showing the new/updated row in the grid)
- Close ("X" icon, top-right of the panel) — dismisses the panel without
  saving

Auto Validation
- New Charge Name, Type Of Ledger, and Applicable are mandatory before
  Save is enabled/succeeds
- Duplicate Charge Name should not be allowed (case-insensitive match
  against existing grid rows)
- Type Of Ledger and Applicable dropdowns must only accept values from
  their predefined option lists (no free text)
- Clear resets New Charge Name to empty and both dropdowns to "Select"
  without closing the panel
- Close discards unsaved changes and returns to the list without adding/
  updating a row
- Editing an existing Charge pre-populates all three fields with the
  selected row's current values; Save updates that same row in place
  (row count in the grid must not increase)
- Deleting a Charge (trash icon) must prompt for confirmation before
  removing the row, and the deleted Charge must no longer appear in
  search results or the grid

Test Coverage Notes (Charge screen specific)
- New button opens an empty "New Charge Name" panel; Edit opens it
  pre-filled with the row's data
- Mandatory-field validation: blank Charge Name, Type Of Ledger not
  selected, Applicable not selected, and all combinations thereof
- Duplicate Charge Name validation (exact match and case-insensitive
  match, e.g. "Processing Charges" vs "processing charges")
- Type Of Ledger dropdown: verify full option list, default "Select"
  placeholder, single-select behavior
- Applicable dropdown: verify full option list, default "Select"
  placeholder, single-select behavior
- Save with valid data adds a new row to the grid and closes the panel
- Save while editing updates the existing row without creating a
  duplicate
- Clear button behavior on both New and Edit flows
- Close ("X") behavior discards changes on both New and Edit flows
- Delete: confirmation prompt, cancel vs confirm delete, row removed
  from grid after confirm, record count in pagination footer decrements
- Search box: filter grid by Charge name (partial match, no results
  found, clearing search restores full list)
- Export to PDF / Export to Excel: file is generated and contains the
  currently visible grid data
- Pagination: First / Previous / Next / Last controls enable/disable
  correctly at boundaries; "x - y of z items" count stays accurate after
  add/edit/delete

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

- Charge Name must be unique.
- Charge Name, Type Of Ledger, and Applicable are required fields and
  cannot be empty.
- Type Of Ledger and Applicable must be selected from predefined lists
  only.
- Only authorized users can create, edit, or delete a Charge.
- Deleted Charges should not appear in search or the grid.
- Duplicate Charge names are not allowed.

====================================================
NEGATIVE TEST SCENARIOS
====================================================

- Blank mandatory fields (Charge Name, Type Of Ledger, Applicable)
- Special characters in Charge Name
- SQL Injection
- XSS Injection
- Large text input in Charge Name
- Duplicate Charge Name
- Network interruption during Save
- Expired session
- Unauthorized access
- Selecting an invalid/unsupported option via forced DOM manipulation on
  the dropdowns

====================================================
API AUTOMATION
====================================================

Reusable API utilities for:
- Create Charge
- Update Charge
- Delete Charge
- Fetch Charge List
- Fetch Charge by Id
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
- Validate inserted Charge
- Validate updated Charge
- Validate deleted Charge
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
