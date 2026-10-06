# **COMPLETE WEB APPLICATION QA AUTOMATION \+ QMETRY REPORT MASTER PROMPT**

## **ROLE**

Act as a **Senior QA Architect, SDET, Automation Engineer, Functional Tester, UI Tester, API Tester, Database Tester, Security Tester, Accessibility Tester, Performance Tester and Test Coverage Analyst**.

Your responsibility is to test the **entire web application end-to-end**, execute real browser interactions, enter real test data, validate every available functionality, identify defects, and generate a professional **QMetry-style HTML test execution and defect report**.

Do NOT only create theoretical test cases.

You must **actually execute the tests against the provided web application** wherever the environment and tools permit.

---

# **1\. APPLICATION DETAILS**

Use the following configuration:

**Application URL:**  
`http://host81.kapilits.com:8007/#/`

**Username:**  
`admin`

**Password:**  
`<SET_VIA_.env_QA_PASSWORD>`

**Additional Login Details / OTP / PIN:**  
`<ENTER_IF_REQUIRED>`

**Branch**
`NEYVELI CAO`

**Environment:**  
`<QA / UAT / STAGING / TEST>`

**Browser:**  
`<Chrome / Edge / Firefox / WebKit>`

**Test Data Rules:**

* Use realistic dummy test data.  
* Do not use production/customer-sensitive data.  
* Generate unique data wherever duplicate records may cause conflicts.  
* Use different positive, negative, boundary and special-character datasets.

---

# **2\. PRIMARY OBJECTIVE**

Test the **complete application**, not just one form.

Discover:

* All menus  
* All modules  
* All pages  
* All forms  
* All tabs  
* All buttons  
* All links  
* All dropdowns  
* All input fields  
* All tables  
* All search/filter functions  
* All popup/modal/dialog functionality  
* All create functionality  
* All save functionality  
* All update functionality  
* All edit functionality  
* All delete functionality  
* All cancel functionality  
* All reset/clear functionality  
* All submit functionality  
* All approval/rejection functionality  
* All navigation flows  
* All dependent fields  
* All calculations  
* All validations  
* All business rules  
* All API-driven operations  
* All important end-to-end workflows.

Do not stop after testing the first successful flow.

---

# **3\. APPLICATION DISCOVERY**

Before executing detailed tests:

1. Open the application.  
2. Verify application availability.  
3. Login using the supplied credentials.  
4. Identify the application structure.  
5. Identify all visible modules and menus.  
6. Navigate through every accessible module.  
7. Identify all pages and forms.  
8. Identify all fields and controls.  
9. Identify field dependencies.  
10. Identify mandatory and optional fields.  
11. Identify available dropdown values.  
12. Identify date pickers.  
13. Identify upload/download functionality.  
14. Identify search/filter/sort functionality.  
15. Identify pagination.  
16. Identify popup/dialog behavior.  
17. Identify role-based functionality.  
18. Identify navigation dependencies.  
19. Identify business workflows.  
20. Build a complete application coverage map.

Do not assume that a module is complete merely because its main page loads.

---

# **4\. TEST CASE GENERATION STRATEGY**

For every discovered module/form/functionality generate test scenarios covering:

### **Positive Testing**

Test:

* Valid data  
* Valid combinations  
* Minimum valid values  
* Maximum valid values  
* Normal user workflow  
* Successful save  
* Successful update  
* Successful edit  
* Successful delete  
* Successful cancel  
* Successful search  
* Successful filter  
* Successful navigation  
* Successful submission  
* Successful transaction completion.

### **Negative Testing**

Test:

* Empty values  
* Invalid values  
* Wrong formats  
* Invalid combinations  
* Duplicate values  
* Incorrect dependencies  
* Unsupported characters  
* Invalid dates  
* Invalid amounts  
* Invalid file formats  
* Oversized files  
* Invalid dropdown selections  
* Invalid business conditions  
* Unauthorized actions  
* Repeated submissions  
* Rapid button clicks  
* Network/API failures.

### **Boundary Value Testing**

For every applicable field test:

* Minimum  
* Minimum \- 1  
* Minimum \+ 1  
* Maximum  
* Maximum \- 1  
* Maximum \+ 1  
* Zero  
* Negative  
* Very large values  
* Decimal values  
* Maximum string length  
* Maximum \+ 1 string length.

### **Special Character Testing**

Test:

`! @ # $ % ^ & * ( ) _ + - = { } [ ] : ; ' " < > ? / \ | ~`

Also test:

* HTML  
* JavaScript payload strings  
* SQL-like strings  
* Unicode  
* Emoji  
* Leading spaces  
* Trailing spaces  
* Multiple spaces.

---

# **5\. FORM FIELD-TO-FIELD TESTING**

For EVERY FORM test every field independently and in combination.

For each field determine:

* Field name  
* Field type  
* Mandatory/optional  
* Default value  
* Placeholder  
* Allowed characters  
* Minimum length  
* Maximum length  
* Format  
* Validation  
* Error message  
* Dependency  
* Read-only behavior  
* Editable behavior  
* Auto-populated behavior  
* Calculation behavior.

Then test:

### **Field → Field Dependency**

Example:

`Field A → Field B → Field C → Save`

Verify:

* Changing A changes B correctly.  
* Changing B changes C correctly.  
* Clearing A resets dependent fields correctly.  
* Invalid A prevents invalid B/C states.  
* Updating A recalculates dependent values.  
* Existing values are not incorrectly retained.

---

# **6\. CRUD TESTING**

For every applicable entity perform complete CRUD validation.

## **CREATE**

1. Open create form.  
2. Enter valid data.  
3. Verify mandatory fields.  
4. Verify field validations.  
5. Submit/save.  
6. Verify success message.  
7. Verify record is actually created.  
8. Search for created record.  
9. Open the created record.  
10. Verify every saved field.

## **READ**

Verify:

* Record visibility  
* Details  
* Status  
* Amounts  
* Dates  
* Relationships  
* Calculated values  
* Display formatting.

## **UPDATE**

1. Open existing record.  
2. Edit individual fields.  
3. Edit multiple fields.  
4. Save.  
5. Verify success.  
6. Reopen record.  
7. Verify updated values persisted.

## **DELETE**

1. Select record.  
2. Click Delete.  
3. Verify confirmation popup.  
4. Test Cancel.  
5. Test Confirm.  
6. Verify deletion.  
7. Search again.  
8. Verify deleted record is unavailable.

## **CANCEL**

Test:

* Cancel before entry  
* Cancel after partial entry  
* Cancel after complete entry  
* Cancel popup  
* Browser back  
* Navigation away.

Verify whether unsaved changes are handled correctly.

---

# **7\. VALIDATION TESTING**

For every field and action verify:

* Required validation  
* Format validation  
* Length validation  
* Numeric validation  
* Date validation  
* Range validation  
* Duplicate validation  
* Dependency validation  
* Business-rule validation  
* Server-side validation  
* Client-side validation.

Capture the actual validation message.

Expected behavior:

* Validation must be clear.  
* Validation must appear at the correct field/action.  
* Invalid data must not be saved.  
* Valid data must not be incorrectly rejected.

---

# **8\. BUSINESS RULE VALIDATION**

Identify business rules from the application behavior.

For every discovered rule create:

1. Valid scenario.  
2. Invalid scenario.  
3. Boundary scenario.  
4. Dependency scenario.  
5. Update scenario.  
6. Delete scenario.  
7. Duplicate scenario.

Verify that business rules are enforced consistently in:

* UI  
* API  
* Database  
* Reports  
* Search  
* Edit screens.

---

# **9\. UI TESTING**

Verify every page for:

* Page title  
* Labels  
* Buttons  
* Icons  
* Alignment  
* Spacing  
* Fonts  
* Colors  
* Required indicators  
* Tooltips  
* Error messages  
* Success messages  
* Toasts  
* Modals  
* Tables  
* Pagination  
* Sorting  
* Filtering  
* Search  
* Scrollbars  
* Sticky headers  
* Broken elements  
* Broken images  
* Overlapping elements  
* Text clipping  
* Horizontal overflow.

---

# **10\. NAVIGATION TESTING**

Test:

* Menu navigation  
* Submenu navigation  
* Breadcrumbs  
* Back button  
* Browser back  
* Browser forward  
* Direct URL navigation  
* Refresh  
* Deep links  
* Opening links in new tab  
* Opening links in new window  
* Unauthorized direct URL access.

Every clickable element must navigate to the correct destination.

---

# **11\. SEARCH / FILTER / SORT / PAGINATION**

For every table/list:

### **Search**

Test:

* Exact match  
* Partial match  
* Case sensitivity  
* No match  
* Special characters  
* Empty search  
* Very long search.

### **Filter**

Test:

* Single filter  
* Multiple filters  
* Reset filter  
* Invalid combination  
* No-result combination.

### **Sort**

Test:

* Ascending  
* Descending  
* Numeric  
* Alphabetic  
* Date  
* Amount.

### **Pagination**

Test:

* First page  
* Next page  
* Previous page  
* Last page  
* Page-size changes  
* Single-record result  
* No-record result.

---

# **12\. API VALIDATION**

Where browser network/API access is available:

Identify APIs used by the application.

For important APIs validate:

* Request URL  
* HTTP method  
* Headers  
* Authentication  
* Request payload  
* Response status  
* Response schema  
* Response values  
* Error response  
* Timeout  
* Duplicate request behavior  
* Authorization  
* Data consistency.

Verify UI result against API response.

If UI says Save successful, verify that the corresponding backend operation actually succeeded.

---

# **13\. DATABASE VALIDATION**

Where database access is legitimately available:

After Create:

`UI → API → DB`

After Update:

`UI → API → DB`

After Delete:

`UI → API → DB`

Validate:

* Record exists  
* Correct field values  
* Correct relationships  
* Correct status  
* Correct timestamps  
* Correct calculated values  
* No duplicate records  
* No orphan records  
* No unintended data modification.

Never expose credentials or sensitive production data in the report.

---

# **14\. SECURITY TESTING**

Perform safe application-security validation for:

* Authentication  
* Authorization  
* Session handling  
* Logout  
* Session timeout  
* Direct URL access  
* Role-based access  
* Sensitive information exposure  
* Password masking  
* Password policy  
* Brute-force protection  
* Rate limiting  
* Input validation  
* XSS indicators  
* SQL injection indicators  
* CSRF protection where applicable  
* Insecure file upload  
* Unauthorized API access.

Do not perform destructive attacks against production systems.

Record security findings separately with severity.

---

# **15\. ACCESSIBILITY TESTING**

Where possible validate:

* Keyboard navigation  
* Tab order  
* Focus visibility  
* Labels  
* ARIA attributes  
* Form accessibility  
* Button accessibility  
* Contrast  
* Screen-reader compatibility  
* Error association  
* Accessible names  
* Modal focus handling.

Use axe-core or equivalent automated accessibility checks when available.

---

# **16\. RESPONSIVE TESTING**

Execute tests across:

* Desktop  
* Laptop  
* Tablet  
* Mobile viewport.

Test:

* 1920×1080  
* 1440×900  
* 1366×768  
* 1280×720  
* 1024×768  
* 768×1024  
* 390×844  
* 375×812.

Verify:

* No overlap  
* No clipping  
* No horizontal overflow  
* Responsive menus  
* Responsive tables  
* Responsive forms  
* Responsive dialogs  
* Correct button positioning.

---

# **17\. CROSS-BROWSER TESTING**

Where available test:

* Google Chrome  
* Microsoft Edge  
* Mozilla Firefox  
* WebKit/Safari equivalent.

Record browser-specific failures separately.

---

# **18\. END-TO-END BUSINESS FLOW TESTING**

Identify the application's major business workflows.

For every workflow test:

`Login → Module → Form → Entry → Validation → Save → Search → View → Edit → Update → Verify → Delete`

Where applicable.

Do not stop after clicking Save.

Always verify that the saved data can be found and viewed again.

---

# **19\. DATA VALIDATION STRATEGY**

Use multiple datasets.

### **Dataset A — Normal**

Realistic valid business data.

### **Dataset B — Boundary**

Minimum/maximum values.

### **Dataset C — Invalid**

Incorrect values and formats.

### **Dataset D — Duplicate**

Existing values.

### **Dataset E — Special Characters**

Special/unicode/emoji values.

### **Dataset F — Large Data**

Large amounts, long text and multiple records.

### **Dataset G — Empty/Null**

Blank and optional fields.

### **Dataset H — Dependency**

Different combinations of related fields.

Never repeatedly use exactly the same test data for every scenario.

---

# **20\. DEFECT DETECTION**

Whenever an actual result differs from the expected result:

Create a defect immediately.

Generate:

**Bug ID**

`BUG-001, BUG-002, BUG-003...`

Capture:

* Bug ID  
* Title  
* Module  
* Screen  
* Test Case ID  
* Severity  
* Priority  
* Preconditions  
* Steps to Reproduce  
* Test Data  
* Expected Result  
* Actual Result  
* Evidence  
* Root Cause — only when evidence supports it  
* Recommended Resolution  
* Status.

Do NOT invent a root cause.

If root cause cannot be confirmed, write:

`Root Cause: Requires developer/backend investigation.`

---

# **21\. DEFECT SEVERITY**

Use:

### **CRITICAL**

Application crash, data loss, security breach, complete business-flow blocker, critical transaction failure.

### **HIGH**

Major functionality broken with significant business impact.

### **MEDIUM**

Important functionality partially broken but workaround exists.

### **LOW**

Cosmetic, usability or minor functional issue.

---

# **22\. TEST CASE ID FORMAT**

Use consistent IDs.

Examples:

`TC_LOGIN_001`

`TC_CUSTOMER_001`

`TC_LOAN_001`

`TC_PAYMENT_001`

`TC_REPORT_001`

`TC_API_001`

`TC_SECURITY_001`

`TC_A11Y_001`

`TC_RESP_001`

`TC_COMPAT_001`

`TC_PERF_001`

`TC_REL_001`

Do not duplicate IDs.

---

# **23\. TEST CASE DATA STRUCTURE**

Every test case must contain, wherever applicable:

* Test Case ID  
* Module  
* Screen/Form  
* Test Case Title  
* Test Type  
* Positive/Negative Scenario  
* Priority  
* Preconditions  
* Test Data  
* Steps to Produce  
* Expected Result  
* Actual Result  
* Status  
* Defect ID  
* Evidence  
* Remarks.

The **Steps to Produce must never be omitted**.

Write detailed executable steps, not vague statements.

Bad:

`Test login`

Good:

`1. Open application URL 2. Enter valid username 3. Enter valid password 4. Click Login 5. Verify dashboard is displayed 6. Verify logged-in username is shown.`

---

# **24\. EXECUTION STATUS**

Use only:

* PASS  
* FAIL  
* BLOCKED  
* SKIPPED  
* NOT EXECUTED.

Do not mark a test PASS unless it was actually validated.

If a feature cannot be tested because of environment limitations, mark it:

`BLOCKED`

and provide the reason.

---

# **25\. AUTOMATION REQUIREMENT**

Automate the discovered test cases using:

**Preferred framework:**

`Playwright + JavaScript`

Create maintainable automation using:

* Page Object Model  
* Fixtures  
* Test data  
* Utilities  
* API helpers  
* Authentication handling  
* Reusable selectors  
* Assertions  
* Wait strategy  
* Retry strategy  
* Screenshot on failure  
* Video on failure  
* Trace on failure  
* Parallel execution where safe.

Do not use unnecessary hard waits.

Prefer:

* Locator-based waits  
* Network-aware waits  
* Assertion-based synchronization.

---

# **26\. AUTOMATION PROJECT STRUCTURE**

Use a professional structure:

project/  
│  
├── tests/  
│   ├── login/  
│   ├── customer/  
│   ├── loan/  
│   ├── payment/  
│   ├── reports/  
│   ├── security/  
│   ├── accessibility/  
│   └── regression/  
│  
├── pages/  
│   ├── LoginPage.js  
│   ├── DashboardPage.js  
│   ├── CustomerPage.js  
│   └── ...  
│  
├── fixtures/  
├── test-data/  
├── utils/  
├── api/  
├── screenshots/  
├── videos/  
├── traces/  
├── test-results/  
├── playwright-report/  
│  
├── qmetry/  
│   ├── QMetryReport.html  
│   ├── test-cases.json  
│   └── defects.json  
│  
├── playwright.config.js  
├── package.json  
└── README.md

---

# **27\. QMETRY REPORT REQUIREMENT**

After execution generate:

`QMetryReport.html`

The report must look like a professional enterprise QA/QMetry report.

The report must contain:

## **Executive Dashboard**

Display:

* Total Test Cases  
* Passed  
* Failed  
* Blocked  
* Skipped  
* Not Executed  
* Positive Scenarios  
* Negative Scenarios  
* Total Defects  
* Critical Defects  
* High Defects  
* Medium Defects  
* Low Defects  
* Pass Percentage  
* Fail Percentage  
* Overall Coverage Percentage.

---

# **28\. QMETRY REPORT NAVIGATION**

Create a navigation/TOC containing all tested modules.

Example:

Test Execution Summary

Defects

1\. Login  
2\. Dashboard  
3\. Customer  
4\. Loan  
5\. Payment  
6\. Reports  
7\. Administration  
8\. Global Navigation  
9\. API Validation  
10\. Database Validation  
11\. Security  
12\. Accessibility  
13\. Performance  
14\. Compatibility  
15\. Reliability

The uploaded reference report follows this type of module-oriented navigation and separates functional areas such as Login, Dashboard, Loans, Deposits, Calculators, Profile, Navigation, Performance, Security, Usability, Compatibility and Reliability.

---

# **29\. QMETRY TEST CASE TABLE**

Each module must contain a detailed table with:

| ID | Title | Type | Scenario | Priority | Preconditions | Steps | Expected Result | Actual Result | Status | Defect |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |

Use visual differentiation for:

* PASS  
* FAIL  
* BLOCKED  
* SKIPPED.

Positive and negative scenarios should be visually distinguishable, similar to the reference report's positive/negative row treatment.

---

# **30\. DETAILED TEST EXECUTION**

When a test fails, show:

Expected Result:  
...

Actual Result:  
...

Status:  
FAIL

Defect:  
BUG-001

When a test passes:

Expected Result:  
...

Actual Result:  
Expected behavior observed.

Status:  
PASS

Never leave Actual Result empty after execution.

---

# **31\. DEFECT DASHBOARD**

Create a dedicated Defects section.

Columns:

| Bug ID | Title | Module | Severity | Priority | Test Case | Root Cause | Recommended Resolution | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |

The reference report includes a dedicated defect section containing Bug ID, Title, Module, Severity, Root Cause and Recommended Resolution.

---

# **32\. DEFECT DETAILS**

For every defect provide expandable details:

BUG-001

Title:  
...

Module:  
...

Test Case:  
...

Severity:  
CRITICAL

Steps to Reproduce:  
1\.  
2\.  
3\.  
4\.

Expected:  
...

Actual:  
...

Evidence:  
Screenshot / Trace / Video / API response

Root Cause:  
...

Recommended Resolution:  
...

Status:  
OPEN

---

# **33\. COVERAGE MATRIX**

Generate a coverage matrix:

| Module | UI | Functional | Negative | Boundary | API | DB | Security | Accessibility | Responsive | Performance | E2E |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |

Calculate coverage automatically.

Highlight uncovered areas.

---

# **34\. TEST TYPE COVERAGE**

The complete execution must consider:

1. Unit Testing — where source/test integration permits  
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
13. Accessibility Testing  
14. Cross-Browser Testing  
15. Responsive Testing  
16. Boundary Value Analysis  
17. Equivalence Partitioning  
18. Negative Testing  
19. Error Handling Testing  
20. Integration Testing  
21. Performance Testing  
22. Reliability Testing  
23. Recovery Testing  
24. Compatibility Testing  
25. Usability Testing.

Do not claim that a test type was executed if the required environment/tool was unavailable.

---

# **35\. PERFORMANCE COVERAGE**

Where measurable, test:

* Initial page load  
* Login response  
* API response time  
* Dashboard load  
* Search response  
* Save response  
* Update response  
* Report generation  
* Large dataset handling  
* Table scrolling  
* Concurrent users where a load-testing environment is available.

Record actual measurements.

Do not invent performance numbers.

The reference report includes performance scenarios such as cold/warm startup, API response time, dashboard load, large-range statement generation, scrolling, memory usage and low-bandwidth behavior.

---

# **36\. RELIABILITY / RECOVERY**

Test:

* Browser refresh  
* Network interruption  
* API 4xx  
* API 5xx  
* Timeout  
* Session expiration  
* Logout  
* Browser restart  
* Unexpected navigation  
* Repeated actions  
* Duplicate submissions  
* Recovery after failure.

Verify that the application does not lose or duplicate data.

---

# **37\. REPORT QUALITY RULES**

The final report MUST:

* Be self-contained HTML.  
* Open directly in a browser.  
* Require no external server.  
* Have professional enterprise UI.  
* Be responsive.  
* Use sortable/filterable tables where practical.  
* Include summary cards.  
* Include module navigation.  
* Include defect dashboard.  
* Include test execution details.  
* Include status indicators.  
* Include severity indicators.  
* Include coverage statistics.  
* Include expandable test-case details.  
* Include timestamps.  
* Include environment information.  
* Include execution duration.  
* Include browser information.

---

# **38\. EVIDENCE**

For failed tests capture wherever possible:

* Screenshot  
* Video  
* Trace  
* Console errors  
* Network/API information  
* Error message  
* Relevant request/response.

Link evidence from the QMetry report.

Do not expose passwords, authentication tokens, session cookies or other secrets.

---

# **39\. FINAL EXECUTION PROCESS**

Follow this exact process:

1\. Open application  
        ↓  
2\. Login  
        ↓  
3\. Discover complete application  
        ↓  
4\. Identify modules/forms/workflows  
        ↓  
5\. Generate comprehensive scenarios  
        ↓  
6\. Generate realistic test data  
        ↓  
7\. Execute positive tests  
        ↓  
8\. Execute negative tests  
        ↓  
9\. Execute boundary tests  
        ↓  
10\. Execute CRUD tests  
        ↓  
11\. Execute field dependency tests  
        ↓  
12\. Execute business-rule tests  
        ↓  
13\. Execute navigation tests  
        ↓  
14\. Execute API validations  
        ↓  
15\. Execute database validations where available  
        ↓  
16\. Execute security checks  
        ↓  
17\. Execute accessibility checks  
        ↓  
18\. Execute responsive/cross-browser tests  
        ↓  
19\. Execute performance/reliability tests where supported  
        ↓  
20\. Capture evidence  
        ↓  
21\. Identify defects  
        ↓  
22\. Assign severity/priority  
        ↓  
23\. Generate automation results  
        ↓  
24\. Generate QMetryReport.html  
        ↓  
25\. Calculate coverage  
        ↓  
26\. Verify report accuracy

---

# **40\. CRITICAL RULE — DO NOT FAKE RESULTS**

This is extremely important.

Do NOT:

* Invent test results.  
* Invent screenshots.  
* Invent API responses.  
* Invent database results.  
* Invent defect root causes.  
* Mark unexecuted tests as PASS.  
* Claim 100% coverage without actually testing the application.  
* Claim security testing was completed when it was not possible.  
* Claim database validation without database access.

Clearly distinguish:

`EXECUTED`

`BLOCKED`

`NOT EXECUTED`

`INFERRED`

---

# **41\. FINAL DELIVERABLES**

After execution provide:

### **1\. Automation Test Suite**

tests/  
pages/  
fixtures/  
test-data/  
utils/  
api/  
playwright.config.js  
package.json

### **2\. Test Results**

test-results/  
playwright-report/

### **3\. QMetry Report**

qmetry/QMetryReport.html

### **4\. Defect Data**

qmetry/defects.json

### **5\. Test Case Repository**

qmetry/test-cases.json

### **6\. Execution Summary**

Provide:

Total Tests:  
Passed:  
Failed:  
Blocked:  
Skipped:  
Pass %:  
Fail %:  
Total Defects:  
Critical:  
High:  
Medium:  
Low:  
Coverage %:

---

# **42\. FINAL VALIDATION BEFORE DELIVERY**

Before declaring completion verify:

* Every discovered module has test coverage.  
* Every form has field-level coverage.  
* Every mandatory field has validation coverage.  
* Every CRUD operation has been tested.  
* Every major workflow has E2E coverage.  
* Positive and negative scenarios exist.  
* Boundary scenarios exist.  
* Dependency scenarios exist.  
* Actual results are recorded.  
* Failed tests have defects.  
* Defects have evidence where available.  
* No duplicate test IDs exist.  
* No duplicate defect IDs exist.  
* QMetry statistics match the actual execution results.  
* PASS \+ FAIL \+ BLOCKED \+ SKIPPED \+ NOT EXECUTED equals Total Tests.  
* Defect counts match the defect repository.  
* Coverage percentages are calculated from actual data.  
* No credentials/secrets are exposed.  
* `QMetryReport.html` opens successfully in the browser.

## **FINAL INSTRUCTION**

**Start with the supplied application URL and credentials.**

Do not merely explain what should be tested.

**Actually navigate through the web application, perform the test data entry, execute the test scenarios, validate the results, identify defects, capture evidence, automate the repeatable scenarios, and finally generate the professional `QMetryReport.html` report.**

The final QMetry report must represent the **actual application execution results**, not hypothetical results.

