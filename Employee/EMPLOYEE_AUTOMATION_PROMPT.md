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

NOTE: This Employee module reuses the SAME framework already generated for
the Contact module (see ../CONTACT_FORM_AUTOMATION_PROMPT.md and the
project root's pages/, tests/, helpers/, constants/, utils/ folders). Do
NOT scaffold a second, separate framework — add new page objects and spec
files into the existing structure:
- pages/EmployeeListPage.js
- pages/EmployeeFormPage.js
- tests/employeeList.spec.js
- tests/employeeForm.spec.js
- data/employeeTestData.json

====================================================
APPLICATION UNDER TEST
====================================================

Application: Finsta Banking (Demo NBFC)
Module: Contact > Contact Configuration > Employees
Routes (verified live):
- List: #/Contact/ContactToEmployeesView
- Add/Edit form: #/Contact/ContactToEmployees
Login/navigation/auth are IDENTICAL to the Contact module — reuse
helpers/authHelper.js and the existing sidebar navigation pattern
(#a0 -> #mhalltitle66 -> then the "Employees" leaf link instead of
"Contact").

====================================================
NAVIGATION STEPS (VERIFIED)
====================================================

1. Login (see CONTACT_FORM_AUTOMATION_PROMPT.md — identical flow).
2. Expand "Contact" in the left sidebar.
3. Click "Contact Configuration".
4. Click "Employees" sub-menu item (sibling of "Contact").
5. Lands on the Employees list at #/Contact/ContactToEmployeesView.
6. Click "+ New" (top-right) to open the Add Employee form at
   #/Contact/ContactToEmployees.

====================================================
EMPLOYEE MODULE — VERIFIED SCREENS
====================================================

--------------------------------------------------------------------------
1. Employees List (ContactToEmployeesView) — VERIFIED AGAINST SCREENSHOT
--------------------------------------------------------------------------

Elements
- Free-text search/filter input (top-left, no visible label, placeholder
  blank in this screenshot — confirm actual placeholder text)
- Export icons: PDF export, Excel export (top-right)
- "+ New" button (top-right) — opens the Add Employee form
- Data grid (kendo/ngx-style grid, NOT the Contact module's card layout)
  with sortable/menu columns (each column header has a "⋮" column-menu
  icon): Employee Name, Pmobile No, Basic Amount, Allowance / Variable
  Pay, CTC Amount, Designation, Role, and a trailing Edit (pencil) icon
  column
- Pagination footer: First / Prev / page numbers (1, 2, …) / Next / Last,
  and a "X - Y of Z items" counter (verified: "1 - 10 of 13 items", i.e.
  page size 10)

Test Coverage Notes
- Grid loads with correct total item count and page size
- Column sort via column-menu icon (verify each sortable column)
- Search/filter input narrows the grid (confirm exact matching behavior —
  name-only vs all-columns)
- Pagination: First/Prev/Next/Last button states at boundaries (Prev/First
  disabled on page 1, Next/Last disabled on last page)
- Edit icon opens the same employee in edit mode at
  #/Contact/ContactToEmployees with fields pre-filled
- PDF export and Excel export both trigger a downloadable file with data
  matching the current grid (including any active filter/sort)
- "+ New" always opens a blank form, never carries over stale data from a
  previously edited employee

--------------------------------------------------------------------------
2. Add / Edit Employee (ContactToEmployees) — VERIFIED AGAINST SCREENSHOT
--------------------------------------------------------------------------

Actual Form Layout

- Employee Name (searchable combobox/ng-select, has a clear "×" icon and
  dropdown arrow — this looks up an EXISTING Contact record, i.e. an
  employee must already exist as a Contact before being added here;
  confirm this assumption against actual dropdown options)
- Basic Salary (P.A.) * (required, numeric)
- Allowance / Variable Pay (P.A.) * (required, numeric)
- Total Cost to Company (CTC) : 0 — READ-ONLY, auto-calculated display
  (Basic Salary + Allowance / Variable Pay, verified as 20,000 + 1 =
  20,001 and 60,000 + 1,300 = 61,300 in the List screenshot — confirm
  exact formula, e.g. whether it's a straight sum or has additional
  components not visible on this form)
- Designation * (required dropdown, combobox) + adjacent "+" button to
  add a new Designation master value inline
- Role * (required dropdown, combobox) + adjacent "+" button to add a new
  Role master value inline
- Date of Joining * (required date field)
- Buttons: Clear (red, with × icon), Save (blue, with check icon)
- "View" button (top-right) — returns to the Employees list

Auto Validation
- CTC recalculates live as Basic Salary / Allowance are typed (verify:
  on blur, on input, or only on Save?)
- Employee Name combobox: confirm whether it is filtered to Contacts not
  already linked to an employee record, or shows all Contacts
- Designation/Role "+" buttons: confirm whether they open a modal, an
  inline row, or navigate away — capture a screenshot of that flow before
  automating it
- All four marked fields (Basic Salary, Allowance, Designation, Role,
  Date of Joining — 5 total asterisks visible) are mandatory before Save
  succeeds

Test Coverage Notes (Employee form specific)
- Employee Name search: partial match, no results, clearing a selected
  employee, selecting an employee already linked to a record (duplicate
  prevention — confirm expected behavior)
- Mandatory-field validation: Save with each required field blank in
  turn, and with all blank
- Basic Salary / Allowance: numeric-only, negative rejected, zero
  accepted or rejected (confirm business rule), decimal precision,
  extremely large values, non-numeric characters
- CTC display: verify it always equals the correct sum and updates
  immediately, is never independently editable
- Designation "+" and Role "+" inline-add flows: adding a new master
  value, then confirming it appears selected/selectable without a page
  reload
- Date of Joining: reject far-future dates (business-rule dependent —
  confirm whether future joining dates are actually valid here, unlike
  Contact's Date of Birth), invalid formats, very old dates
- Clear button resets all fields on the current form without navigating
  away
- Save with valid data: confirm the new/edited employee appears correctly
  in the Employees list grid (name, mobile, basic, allowance, CTC,
  designation, role) — mobile number shown in the grid ("Pmobile No")
  is NOT a field on this form, so it must be pulled from the linked
  Contact record; verify this join is correct
- Edit flow: open an existing employee via the grid's pencil icon,
  confirm every field pre-fills correctly, change one field, Save, and
  confirm the grid reflects only that change

====================================================
BUSINESS RULES (Employee Module)
====================================================

- An Employee record is linked to an existing Contact (via Employee
  Name) — Employees cannot be created independently of a Contact.
- CTC = Basic Salary (P.A.) + Allowance / Variable Pay (P.A.) — confirm
  no additional hidden components (bonuses, deductions) before treating
  this as the final formula.
- Basic Salary, Allowance, Designation, Role, and Date of Joining are all
  mandatory.
- Designation and Role are master-data dropdowns that can be extended
  inline via their "+" buttons — new values must immediately become
  available for selection.
- Mobile number displayed in the Employees grid is sourced from the
  linked Contact, not entered on this form.
- (To confirm) Whether one Contact can be linked to only one Employee
  record, or multiple (e.g. re-hire scenarios).

====================================================
NEGATIVE TEST SCENARIOS
====================================================

- Blank mandatory fields (Basic Salary, Allowance, Designation, Role,
  Date of Joining) individually and all together
- Negative Basic Salary / Allowance
- Zero Basic Salary / Allowance (confirm if this is actually invalid)
- Non-numeric characters in Basic Salary / Allowance
- Decimal precision edge cases (e.g. 20000.999)
- Extremely large salary values (overflow / display truncation)
- SQL Injection / XSS payloads in any free-text field exposed by the
  Designation/Role "+" add-new flow
- Selecting an Employee Name already linked to an existing employee
  record (duplicate)
- Invalid/garbage Date of Joining input
- Network interruption during Save
- Expired session while mid-form
- Unauthorized/direct URL access to #/Contact/ContactToEmployees or
  #/Contact/ContactToEmployeesView without login

====================================================
TEST COVERAGE
====================================================

1. Unit Testing (page-object/helper unit tests where logic exists, e.g.
   CTC-calculation and date validators)
2. Smoke Testing (navigate to Employees list, open New Employee form,
   confirm all fields render)
3. Sanity Testing (one happy-path employee created end-to-end and
   verified in the grid)
4. Regression Testing (full field-level suite across list + form)
5. Functional Testing
6. UI Testing
7. End-to-End Testing (Contact creation -> Employee creation -> appears
   correctly linked in Employees grid)
8. Validation Testing (mandatory fields, numeric formats)
9. Business Rule Validation (CTC formula, Contact-Employee linkage)
10. API Validation (once Employee Save/Update/Search endpoints are
    confirmed via network trace — not yet captured)
11. Database Validation (once employee/designation/role table names are
    confirmed — not yet captured)
12. Security Testing (auth-gated routes, session timeout mid-form)
13. Accessibility Testing (axe-core scan on both Employees screens)
14. Cross Browser Testing (Chromium, Firefox, WebKit)
15. Responsive Testing
16. Boundary Value Analysis (salary amounts, CTC calculation edges,
    Basic Salary / Allowance min-max)
17. Equivalence Partitioning
18. Negative Testing
19. Positive Testing
20. Exception Handling
21. Error Message Validation
22. File Upload Validation (only if the Employee form gains a document
    upload field — not present on the verified screens; otherwise not
    applicable)
23. Search Validation (Employees list search/filter, Employee Name
    combobox lookup)
24. Sorting Validation (Employees grid column sort)
25. Filtering Validation (Employees grid filter/column-menu)
26. Print Validation (PDF export counts as the print-equivalent path
    here — verify layout/content matches the grid)
27. Role-Based Access Testing (confirm whether every logged-in role can
    create/edit Employees, or if it's restricted, e.g. to HR/Admin roles)
28. Session Validation (expired session while mid-form on the Employee
    form)
29. Duplicate Voucher Validation (interpreted here as: duplicate Employee
    record for the same Contact — confirm whether the app blocks linking
    one Contact to more than one active Employee record)
30. Currency Validation (Basic Salary, Allowance, and CTC amount
    formatting/precision)
31. Date Validation (Date of Joining — reject invalid formats, confirm
    business rule on future vs past dates)
32. Sanity Test Cases
33. Edge Case Test Scenarios (e.g. Basic Salary or Allowance at 0,
    extremely large CTC, rapid double-click on Save)
34. Performance Test Recommendations (Employees grid pagination behavior
    at scale — verified at 13 items/page size 10, recommend load-testing
    with hundreds/thousands of employees)
35. DAST and SAST Vulnerabilities (XSS/SQLi in Employee Name search and
    any free-text field surfaced by the Designation/Role "+" add-new
    flow)
36. Microfrontend Integration Testing — NOT APPLICABLE (no evidence this
    app uses a microfrontend architecture)
37. Telematics Testing — NOT APPLICABLE (no GPS/vehicle-tracking data
    involved in the Employee module)

====================================================
TAGS
====================================================

@smoke @sanity @regression @functional @negative @positive @security
@accessibility @crossbrowser @destructive

NOTE: Any test that clicks Save on this live production-like app must be
tagged @destructive and excluded by default from routine runs, same
convention as the Contact module (it creates a real employee record
against a real Contact in the shared demo instance).

====================================================
OPEN ITEMS / MISSING SCREENSHOTS (send these next)
====================================================

1. The Designation "+" and Role "+" inline add-new flow (modal vs inline
   row vs navigation) — not yet captured.
2. The Employee Name combobox's open dropdown state (to confirm whether
   it lists all Contacts or only unlinked ones).
3. A validation-error state screenshot (e.g. Save clicked with blank
   mandatory fields) to confirm exact error message text/placement.
4. The grid's column-menu ("⋮") open state, to confirm available sort/
   filter/hide options per column.
5. Network trace of Save/Update/Delete/Search calls, if API-layer
   automation is required.
6. Database schema/table names for Employee, Designation, and Role
   masters, if DB-layer validation is required.
7. Confirmation of the CTC formula (whether any component beyond Basic +
   Allowance ever applies).

Once these are supplied, this document will be corrected the same way the
Contact module's prompt was corrected from provisional to UI-verified,
and employee-form/list page objects + specs can be generated into the
existing framework with full coverage confidence.
