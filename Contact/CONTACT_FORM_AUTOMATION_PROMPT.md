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
APPLICATION UNDER TEST
====================================================

Application: Finsta Banking (Demo NBFC)
URL: https://demonbfc.finsta.co.in/#/Contact/ContactViewNew
Module: Contact Configuration (Contact Master)
Login user shown in header: "Hi Gaurav", Branch context: "New Delhi"

NOTE: This prompt currently covers ONLY the login/navigation → Contact
module flow as verified against the eight screenshots supplied (Contact
List, Contact Info, Address Details, KYC Documents, Bank Details, Personal
Details, GST, Employment Details, Income Details). No login-screen
screenshot was supplied for this app, so login locators below are
provisional — confirm against the actual login page before use. Missing
items to send next are listed under "OPEN ITEMS / MISSING SCREENSHOTS" at
the end of this document.

====================================================
LOGIN STEPS (PROVISIONAL — confirm login page UI)
====================================================

1. Open the application: https://demonbfc.finsta.co.in
2. Enter login credentials (username/password) on the Finsta login screen.
3. Click the Sign In / Login button.
4. Land on the Finsta dashboard (top-right shows "Hi <UserName>" and a
   branch selector, e.g. "New Delhi").

====================================================
NAVIGATION STEPS (VERIFIED)
====================================================

1. From the left menu, expand "Contact".
2. Click "Contact Configuration".
3. Click "Contact" sub-menu item.
4. Contact List page opens at #/Contact/ContactViewNew showing a
   paginated grid of Individual / Business Entity contacts.
5. Click "New" (split button, top-left) to open the Contact creation
   wizard at #/Contact/ContactNew.
6. The wizard opens on the "Contact Info" tab by default with a horizontal
   tab strip: Contact Info | Address Details | KYC Documents |
   Bank Details | Personal Details | GST | Employement Details |
   Income Details.

====================================================
CONTACT MODULE — VERIFIED SCREENS
====================================================

--------------------------------------------------------------------------
0. Contact List (ContactViewNew)
--------------------------------------------------------------------------

Elements
- "New" split button (dropdown arrow — likely Individual/Business Entity
  quick-create options; confirm)
- "Pending Contacts" button
- Pagination: "Prev / Page X of Y (N items) / Next"
- Search type dropdown ("All") + free-text search box + search icon
- Radio toggle: Individual / Business Entity
- Excel export icon (top-right of grid)
- Contact cards, each showing: Name (link), Edit (pencil) icon, Info (i)
  icon, S/o relation, mobile number, address, UCIC number, Loans count

Test Coverage Notes
- Verify grid loads with correct total item/page count
- Search by name, UCIC, mobile — partial match, no-match, special chars
- Toggle Individual vs Business Entity filters the grid correctly
- Pagination Prev/Next boundary behavior (first page Prev disabled, last
  page Next disabled)
- Edit icon opens the same contact in edit mode; Info icon opens read-only
  detail/summary
- Excel export triggers a file download with correct data
- "Pending Contacts" filters to only pending/incomplete contacts

--------------------------------------------------------------------------
1. Contact Info Tab (ContactNew)
--------------------------------------------------------------------------

Actual Form Layout

Top controls (persist across all 8 tabs)
- "Search Contact Name / Pan / Aadhar / Mobile Number / Email" — ng-select
  combobox, placeholder "Select" (used to find/merge an existing contact
  before creating a duplicate)
- Individual / Business Entity radio toggle, with "(UCIC : )" label that
  populates once a UCIC is assigned
- Tab strip: Contact Info | Address Details | KYC Documents |
  Bank Details | Personal Details | GST | Employement Details |
  Income Details
- "View" button (top-right) — returns to Contact List

Personal Details section
- First Name * (required; has a prefix/salutation dropdown, e.g. "Se..")
- Middle Name
- Last Name
- Father Name (prefix dropdown "M.." + First Name + Last Name)
- Mother Name (prefix dropdown "M.." + First Name + Last Name)
- Spouse Name (prefix dropdown "Se.." + First Name + Last Name)
- Mailing Name(s) (display-only label area)
- Upload Photo (Choose file + "No file chosen" indicator)
- Upload Signature Image (Choose file + "No file chosen" indicator,
  shows a placeholder signature image)
- Date of Birth * (required, date field)
- Age (likely auto-calculated from DOB, read-only or editable)
- Gender * (required)
- CKYC Number
- Preferred Language

Test Coverage Notes
- First Name / DOB / Gender mandatory-field validation
- Age auto-calculation from Date of Birth (if read-only, verify it can't
  be edited directly; if editable, verify consistency check against DOB)
- Salutation dropdowns constrain Name fields appropriately (e.g. "Se" =
  Self prefix?) — confirm actual dropdown values
- Upload Photo / Upload Signature Image: allowed file types, max size,
  invalid file type rejection, preview rendering
- Search-existing-contact combobox: selecting an existing contact should
  pre-fill the form (edit mode) vs leaving blank for new contact creation
- Duplicate contact detection via Pan/Aadhar/Mobile/Email search

--------------------------------------------------------------------------
2. Address Details Tab
--------------------------------------------------------------------------

Actual Form Layout
- Address Type * (required dropdown, e.g. Permanent/Current/Office)
- Residence * (required dropdown, default "Owned")
- Address * (required, textarea/input)
- Area
- City/Village *
- Country * (default "India")
- State * (dropdown, dependent on Country)
- District * (dropdown, dependent on State)
- Pincode * (default "0" — should not accept 0 as valid)
- Longitude
- Latitude
- "+ Add" button — adds the entered address to a grid below
- Grid columns: Select Communication Addr (radio/checkbox), Address Type,
  Residence, Address Details

Test Coverage Notes
- Mandatory fields: Address Type, Residence, Address, City/Village,
  Country, State, District, Pincode
- Pincode: reject "0"/default value, validate numeric length (6 digits for
  India), reject non-numeric
- State dropdown populates only after Country is selected; District only
  after State is selected (cascading dependency)
- Multiple addresses can be added via "+ Add"; grid updates correctly
- "Select Communication Addr" — only one address can be marked as the
  communication/primary address at a time
- Longitude/Latitude format validation (decimal range)
- Duplicate address entries — allowed or blocked?
- Delete/Edit an already-added address row (icons not visible in
  screenshot — confirm grid has edit/delete actions)

--------------------------------------------------------------------------
3. KYC Documents Tab
--------------------------------------------------------------------------

Actual Form Layout
- Document Type * (required dropdown, e.g. PAN/Aadhar/Passport/Voter ID)
- Document Name * (required dropdown/combobox)
- Reference Number * (required text input)
- "+ Add" button
- Grid: "KYC documents and Income Proof" with columns: Actions, Proof
  Type, Document Name, Reference No., Upload File Name
- Empty state: "No data to display"

Test Coverage Notes
- Mandatory fields: Document Type, Document Name, Reference Number
- Reference Number format validation per document type (e.g. PAN =
  10-char alphanumeric pattern, Aadhar = 12-digit numeric)
- Duplicate document type/reference number — is re-adding the same PAN
  blocked?
- File upload column ("Upload File Name") — form fields shown don't
  include an explicit upload control; confirm whether file upload is
  triggered from an Actions icon in the grid after Add
- Actions column icons (edit/delete) — verify functionality
- Adding multiple KYC docs of different types works; grid reflects all
  correctly
- "No data to display" empty state renders correctly before first Add

--------------------------------------------------------------------------
4. Bank Details Tab
--------------------------------------------------------------------------

Actual Form Layout
- IFSC Code (optional text input — likely auto-fills Bank Name/Branch)
- Bank Name * (required dropdown)
- Branch (dropdown, dependent on Bank Name/IFSC)
- City
- Account Type * (required dropdown, default "Savings Account")
- Mode of Operation (dropdown, e.g. Single/Joint)
- Name as Per Your Bank * (required text input)
- Account Number * (required text input)
- "+ Add" button
- Grid columns: Select Primary, Bank Name, Account Type, Name as Per Your
  Bank, Account Number, IFSC Code, Branch, City, Mode Of Operation
- Bottom nav: Back | Next | Clear | Save & Continue

Test Coverage Notes
- Mandatory fields: Bank Name, Account Type, Name as Per Your Bank,
  Account Number
- IFSC Code format validation (11-char alphanumeric, e.g. AAAA0XXXXXX) and
  auto-population of Branch/City when a valid IFSC is entered
- Account Number: numeric-only, min/max length per bank, masking on
  display (if applicable)
- "Select Primary" — only one bank account can be primary at a time
- Duplicate account number validation
- Back/Next navigation preserves entered-but-not-yet-added form data (or
  correctly discards it — confirm expected behavior)
- Clear button resets the current tab's input fields without removing
  already-added grid rows
- Save & Continue persists all tabs' data up to this point and moves
  forward (or shows validation errors if upstream mandatory tabs are
  incomplete)

--------------------------------------------------------------------------
5. Personal Details Tab (second "Personal Details", distinct from
   Contact Info's Personal Details section)
--------------------------------------------------------------------------

Actual Form Layout

Birth & Nationality
- Place of Birth (text)
- Country of Birth (dropdown, default "India")
- Nationality/Citizen of (dropdown, default "Indian")
- Community Details (dropdown, placeholder "Select")
- Religion (dropdown, default "Hindu")

Residential Status *
- Radio: Resident (default selected) / Non-Resident

Marital Status *
- Radio: Married (default selected) / Unmarried / Divorced / Separated /
  Widowed

Test Coverage Notes
- Residential Status and Marital Status are required radio groups —
  verify one option is always selected/selectable and required-on-submit
  if cleared (radios can't normally be "cleared", so validate default
  behavior)
- Country of Birth / Nationality / Religion dropdown default values match
  business expectation for domestic customers
- Community Details dropdown — verify options list and dependency (if
  any) on Religion selection
- Switching Residential Status to "Non-Resident" — verify if any
  additional fields appear (e.g. NRE/NRO bank flag) — not visible in this
  screenshot, confirm

--------------------------------------------------------------------------
6. GST Tab
--------------------------------------------------------------------------

Actual Form Layout
- GST Type (dropdown, default "Consumers")
- GST IN (text input)
- GST State (dropdown)
- Address (textarea/input)
- Area
- City/Village
- Country (default "India")
- State (dropdown, dependent on Country)
- District (dropdown, dependent on State)
- Pincode
- GST Start Date (date, defaults to current date, e.g. 31/08/2026)
- "Clear" and "+ Add" buttons
- Grid columns: GST Type, GST In, GST State, City, Start Date
- Empty state: "No records available."
- Bottom nav: Back | Next | Clear | Save & Continue

Test Coverage Notes
- None of the GST fields are marked mandatory (*) in this tab — confirm
  whether GST section is fully optional and can be skipped via Next/Save
  & Continue with no rows added
- GSTIN format validation (15-char alphanumeric pattern) when a value is
  entered
- GST Start Date cannot be a future date beyond reasonable business rule
  (confirm) and defaults sensibly
- Cascading Country → State → District behaves the same as Address tab
- Adding a GST record with only some fields filled — confirm which
  become mandatory once "+ Add" is clicked despite no visible asterisk

--------------------------------------------------------------------------
7. Employement Details Tab (note: UI label is spelled "Employement",
   automation locators/test names should match the ACTUAL DOM text/id,
   not the corrected spelling)
--------------------------------------------------------------------------

Actual Form Layout
- Segmented control: Employed (selected/highlighted default) | Self
  Employed | Others
- Name of the Organization (text)
- Nature of Organization (dropdown, placeholder "Select")
- Employment Role (text)
- Office Address (textarea/input)
- Office Phone No. (text)
- Total Work experience in years (text/number)
- Reporting to (text)
- Employment in Current Company (text/number) + unit dropdown (default
  "Years")
- Bottom nav: Back | Next | Clear | Save & Continue

Test Coverage Notes
- No field shows a required asterisk in this screenshot — confirm actual
  mandatory rules per employment type (Employed vs Self Employed vs
  Others likely show/hide different fields — only "Employed" fields are
  visible here)
- Switching segmented control (Employed → Self Employed → Others) should
  swap the visible field set; capture screenshots of the other two states
  to complete this section
- Office Phone No. format validation
- Total Work experience / Employment in Current Company: numeric-only,
  non-negative, reasonable upper bound (e.g. cannot exceed age-18)
- Unit dropdown for "Employment in Current Company" — verify Years/Months
  toggle changes validation range

--------------------------------------------------------------------------
8. Income Details Tab
--------------------------------------------------------------------------

Actual Form Layout
- Gross Annual Income (numeric, default 0)
- Net Annual Income (after statutory deductions) (numeric, default 0)
- Average Annual Expenses (numeric, default 0)
- "Income from other sources" radio group: INCOME (default) / EXPENDETURE
  / ASSETS / LIABILITIES
- Select Source (dropdown, placeholder "Select")
- Annual Amount Received (numeric input)
- "+ Add" button
- Grid columns: Type, Income Source, Annual Amount Received
- Empty state: "No records available."
- Bottom nav: Back | Clear | Save & Continue (no "Next" — this is the
  last tab)

Test Coverage Notes
- Net Annual Income should logically be <= Gross Annual Income — verify
  if the UI enforces this or if it's purely informational
- Negative number entry should be rejected on all three top numeric
  fields
- Switching the "Income from other sources" radio changes the Select
  Source dropdown's option list (Income sources vs Expenditure categories
  vs Asset types vs Liability types) — verify each variant
- Adding multiple rows across different radio types populates the Type
  column correctly per row
- Save & Continue on the final tab should trigger full-form validation
  across ALL 8 tabs (not just this one) before allowing final Contact
  creation — verify error surfacing/navigation back to the offending tab

====================================================
COMMON BUSINESS RULES (Contact Module)
====================================================

- UCIC is system-generated and read-only; assigned only after the contact
  is saved (shown as blank "(UCIC : )" for a new/unsaved contact).
- Mandatory fields differ per tab: Contact Info (First Name, DOB, Gender),
  Address Details (Address Type, Residence, Address, City/Village,
  Country, State, District, Pincode), KYC Documents (Document Type,
  Document Name, Reference Number), Bank Details (Bank Name, Account
  Type, Name as Per Bank, Account Number), Personal Details (Residential
  Status, Marital Status). GST, Employment, Income tabs show no mandatory
  markers in the screenshots supplied — confirm.
- Country → State → District is a cascading dependent dropdown pattern
  repeated in Address Details and GST tabs — must be implemented as one
  reusable helper/page-component.
- Grids using "+ Add" (Address, KYC, Bank, GST, Income) all follow the
  same interaction pattern: fill inline fields → Add → row appended to a
  table below → Save & Continue persists the whole tab.
- "Individual" vs "Business Entity" radio at the top changes which tabs
  and fields are shown (Business Entity likely swaps Personal Details for
  Company/Authorized-Signatory details) — NOT covered by these
  screenshots; must be captured separately.
- Back / Next / Clear / Save & Continue navigation pattern is consistent
  across Bank Details, Personal Details, GST, Employment Details, and
  Income Details tabs.

====================================================
TEST COVERAGE
====================================================

1. Unit Testing (page-object/helper unit tests where logic exists, e.g.
   date/IFSC/GSTIN validators)
2. Smoke Testing (login → navigate to Contact → open New Contact form
   loads all 8 tabs)
3. Sanity Testing (one happy-path contact created end-to-end)
4. Regression Testing (full field-level suite across all 8 tabs)
5. Functional Testing
6. UI Testing (tab strip, buttons, grids render correctly)
7. End-to-End Testing (create → save → appears in Contact List with
   correct UCIC/details)
8. Validation Testing (mandatory fields, formats)
9. Business Rule Validation (see above)
10. API Validation (if Contact Save exposes REST endpoints — confirm via
    network trace; not yet captured)
11. Database Validation (verify persisted contact row/UCIC in DB — schema
    not yet supplied)
12. Security Testing (auth-gated route, session timeout on ContactNew)
13. Accessibility Testing (axe-core scan on ContactNew and ContactViewNew)
14. Cross Browser Testing (Chromium, Firefox, WebKit)
15. Responsive Testing
16. Boundary Value Analysis (Pincode length, Account Number length, Age
    bounds, income amounts)
17. Equivalence Partitioning
18. Negative Testing
19. Positive Testing
20. Exception Handling
21. Error Message Validation
22. File Upload Validation (Photo, Signature Image)
23. Search Validation (Contact List search, top-of-form existing-contact
    search)
24. Sorting Validation (Contact List grid — confirm if sortable)
25. Filtering Validation (Individual/Business Entity toggle, Pending
    Contacts)
26. Print Validation (not observed in these screenshots — confirm if
    Contact has a print/export action beyond Excel)
27. Role-Based Access Testing (does every logged-in role see "New" /
    Edit / Pending Contacts the same way?)
28. Session Validation (expired session while mid-form on ContactNew)
29. Duplicate Record Validation (duplicate PAN/Aadhar/Mobile/Email,
    duplicate bank account number, duplicate GSTIN)
30. Currency/Amount Validation (Income Details numeric fields)
31. Date Validation (DOB not in future, GST Start Date rules, no invalid
    formats)
32. Sanity Test Cases
33. Edge Case Test Scenarios (e.g. adding 0 rows to an optional grid then
    Save & Continue; switching Individual→Business Entity mid-fill)
34. Performance Test Recommendations (grid pagination at 1000+ contacts,
    already observed 1082 items across 109 pages)
35. DAST and SAST Vulnerabilities (XSS/SQLi in free-text fields: Address,
    Remarks-equivalents, Name fields)
36. Microfrontend Integration Testing — NOT APPLICABLE (no evidence this
    app uses a microfrontend architecture)
37. Telematics Testing — NOT APPLICABLE (no GPS/vehicle-tracking data
    involved in the Contact module)

====================================================
NEGATIVE TEST SCENARIOS
====================================================

- Blank mandatory fields (per tab, see Business Rules section)
- Invalid Pincode (0, non-numeric, wrong length)
- Invalid IFSC Code format
- Invalid GSTIN format
- Invalid PAN/Aadhar reference number format
- Negative amount (Income Details fields)
- Decimal precision validation (Income amounts)
- Maximum amount validation
- Special characters in Name/Address free-text fields
- SQL Injection in all free-text inputs
- XSS Injection in all free-text inputs
- Large text input (Address, Remarks-equivalent fields)
- Duplicate contact (same PAN/Aadhar/Mobile/Email)
- Duplicate bank account number
- Duplicate GSTIN
- Invalid file upload (Photo/Signature — wrong type)
- Large file upload (Photo/Signature exceeding max size)
- Unsupported file type upload
- Network interruption mid-save
- Expired session mid-form
- Unauthorized access to ContactNew/ContactViewNew routes without login

====================================================
API AUTOMATION
====================================================

Reusable API utilities for (endpoints not yet captured via network trace
— to be confirmed):
- Create Contact
- Update Contact
- Delete/Deactivate Contact
- Search Contact (by Name/PAN/Aadhar/Mobile/Email/UCIC)
- Add Address / KYC Document / Bank Account / GST / Income record
- Validate API Response
- Schema Validation
- Authentication / Token Management
- Reusable API Client

====================================================
DATABASE VALIDATION
====================================================

Reusable database utilities for (schema not yet supplied — to be
confirmed):
- MySQL / PostgreSQL
- Validate inserted contact row and generated UCIC
- Validate address/KYC/bank/GST/income child records
- Validate updated contact
- Validate deleted/deactivated contact
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
- Info / Debug / Warning / Error
- Execution Start / Execution End
- API Logs
- Database Logs

====================================================
ASSERTIONS
====================================================

Reusable assertion utilities for:
- Element Visibility / Enabled / Disabled
- Element Text
- Page URL / Page Title
- Toast/Notification Message
- Table/Grid Validation (Address, KYC, Bank, GST, Income grids)
- Dropdown Validation (including cascading Country→State→District)
- API Response
- Database Values

====================================================
TEST DATA MANAGEMENT
====================================================

Data-driven testing with:
- JSON (per-tab field data sets)
- CSV
- Excel
- Parameterized test execution
- Dynamic data generation using Faker.js (names, addresses, PAN-like
  strings, account numbers — clearly marked as synthetic test data)

====================================================
PLAYWRIGHT FEATURES
====================================================

- Page Fixtures / Custom Fixtures
- beforeAll / beforeEach / afterEach / afterAll
- Soft Assertions
- Explicit Waits (no hardcoded waits)
- Reusable Locators, scoped per tab (critical — this app has multiple
  visually similar dropdowns/inputs across the 8 tabs; every locator MUST
  be scoped to its own tab/section container, never indexed page-wide)
- Environment-based execution
- Retries
- Parallel execution
- Serial execution where needed (the 8-tab wizard is inherently
  sequential per contact — treat one contact's full-tab flow as a serial
  block)
- Browser Context Management
- Multiple User Sessions
- Storage State Authentication

====================================================
TAGS
====================================================

@smoke @sanity @regression @functional @api @database @security
@accessibility @crossbrowser @negative @positive @destructive

NOTE: Any test that clicks Save & Continue / Add / final contact-creation
Submit on this live demo app must additionally be tagged @destructive and
excluded by default from routine runs, since it creates real records
visible in the shared Contact List (already at 1082 items).

====================================================
CROSS BROWSER
====================================================

- Chromium / Firefox / WebKit
- Headed Mode / Headless Mode

====================================================
CI/CD
====================================================

Complete pipelines for GitHub Actions and Jenkins, including:
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

- SOLID, DRY, KISS, YAGNI
- Reusable Components / Clean Architecture
- Dependency Injection where applicable
- Proper Error Handling
- Meaningful Comments / Variable Names
- Modular, Reusable Code
- No hardcoded waits, no duplicated code

====================================================
DELIVERABLES
====================================================

Generate complete runnable code for every file in the framework — not
snippets. Include: folder structure, JS source, config files, test data,
sample API payloads (once endpoints confirmed), database utilities, full
Page Object classes for all 9 Contact screens (List + 8 tabs), reusable
helpers, example E2E scripts, execution commands, README, CI/CD YAML,
Jenkinsfile, Allure config, Logger config. Must be cloneable, npm
installable, and immediately runnable with Playwright.

====================================================
OPEN ITEMS / MISSING SCREENSHOTS (send these next)
====================================================

1. Login page UI (username/password fields, Sign In button, any
   company/branch selection prior to login — the SSC Agenda prompt this
   was modeled on had a multi-step company/branch login; confirm whether
   Finsta has the same).
2. "Business Entity" mode for Contact Info and all subsequent tabs (the
   fields captured are for "Individual" only).
3. Employment Details tab in "Self Employed" and "Others" states (only
   "Employed" was captured).
4. Contact List "Info" (i) icon detail/read-only view.
5. Edit-mode view of an existing contact (pencil icon) to confirm whether
   field behavior/validation differs from create mode.
6. Grid row Edit/Delete actions for Address, KYC, Bank, GST, and Income
   tables (icons not visible in the supplied screenshots — confirm they
   exist).
7. Any success/error toast or confirmation dialog shown after Save &
   Continue or final submission.
8. Network trace / API endpoint names for Create/Update/Search Contact,
   if API-layer automation is required.
9. Database schema/table names for Contact, Address, KYC, Bank, GST,
   Income, if DB-layer validation is required.
10. Business Entity-specific fields (Company Name, GST/PAN of entity,
    Authorized Signatory details) if applicable to this NBFC's workflow.

Once these are supplied, this document will be corrected the same way the
SSC Agenda "Confirmation" tab was corrected from provisional to
UI-verified, and the framework generation can proceed with full coverage
confidence.
