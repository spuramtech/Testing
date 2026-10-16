# Gold Estimate - defect candidates

These are tests that FAILED on `http://host214.kapilits.com:8411/`. They are **candidates**, not confirmed defects: each needs a human to confirm the expected behaviour.

## DC-EST-001 - the remarks typed at save time are stored exactly (no case change)
- Test case: TC_ESTIMATE_READ_03 (Read / Persistence)
- Requirement: REQ-EST-017
- Steps to reproduce:
  1. Open the Summary page of the saved estimate
  2. Read the SUBMIT entry in the Status History
- Expected: The remarks typed at save time are shown exactly as typed (case unchanged).
- Actual: Error: expect(received).toMatch(expected) Expected pattern: /SUBMIT Functional test \d{4}-\d{2}-\d{2}T\d{2}:\d{2}/ Received string: "× Dashboard Contact Contact Contact Configuration Loans Loans Loan Configuration Loan Origination Credit Evaluation Loan Management Reports & Letters Nach Npa Suit Vehicle Loan Gold Gold Estimates Gold Estimate Approv
- Evidence: test-results-estimate-h214c/GoldEstimate-tests-gold-es-35536-red-exactly-no-case-change--chromium/test-failed-1.png

## DC-EST-002 - the uploaded gold article image is stored under a proper file name
- Test case: TC_ESTIMATE_READ_04 (Read / Persistence)
- Requirement: REQ-EST-022
- Steps to reproduce:
  1. Open the Summary page
  2. Read the source of the uploaded gold article image
- Expected: An uploaded image is shown and its stored file name is meaningful (not "undefined").
- Actual: Error: stored image file name expect(received).not.toMatch(expected) Expected pattern: not /undefined/i Received string: "http://host214.kapilits.com:8412/Upload/HEAD%20OFFICE/Documents/1510202660317-undefined.png"
- Evidence: test-results-estimate-h214c/GoldEstimate-tests-gold-es-72af6-ed-under-a-proper-file-name-chromium/test-failed-1.png

## DC-EST-003 - Save without a Loan Name does not reach the review dialog
- Test case: TC_ESTIMATE_REQUIRED_04 (Negative / Required field)
- Requirement: REQ-EST-004
- Steps to reproduce:
  1. Select a contact
  2. Leave Loan Name as "Select"
  3. Enter an article and upload the image
  4. Click Save
- Expected: The "Review Gold Estimate" dialog does not open and nothing is saved.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: false Received: true
- Evidence: test-results-estimate-h214e/GoldEstimate-tests-gold-es-16b7a-not-reach-the-review-dialog-chromium/test-failed-1.png

## DC-EST-004 - Remarks keeps special characters exactly as typed
- Test case: TC_ESTIMATE_INPUT_02 (Input validation)
- Requirement: REQ-EST-017
- Steps to reproduce:
  1. Type special characters (<b>&"' 100% #1) into Remarks
- Expected: The text is kept exactly as typed.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: "Test <b>&\"' 100% ok #1" Received: "Test <B>&\"' 100% Ok #1"
- Evidence: test-results-estimate-h214/GoldEstimate-tests-gold-es-1880a-characters-exactly-as-typed-chromium/test-failed-1.png

## DC-EST-005 - Gross Weight rejects number formats such as 1e3, +5, --5, 1,5 and non-Latin digits
- Test case: TC_ESTIMATE_INPUT_04 (Input validation)
- Requirement: REQ-EST-012
- Steps to reproduce:
  1. Type 1e3, +5, --5, 1,5 and non-Latin digits into Gross Weight
- Expected: Only digits and one decimal point remain in the field.
- Actual: Error: after typing "١٢" expect(received).toMatch(expected) Expected pattern: /^\d*\.?\d*$/ Received string: "١٢"
- Evidence: test-results-estimate-h214c/GoldEstimate-tests-gold-es-33f1b--5-1-5-and-non-Latin-digits-chromium/test-failed-1.png

## DC-EST-006 - future years cannot be chosen as Estimate Date
- Test case: TC_ESTIMATE_DATE_02 (Date / calendar validation)
- Requirement: REQ-EST-007
- Steps to reproduce:
  1. Open the Estimate Date calendar
  2. Switch to the year view
  3. Look at next year
- Expected: Future years are disabled.
- Actual: Error: Timed out 15000ms waiting for expect(locator).toHaveClass(expected) Locator: locator('bs-datepicker-container').locator('td span').filter({ hasText: /^2027$/ }).first() Expected pattern: /disabled/ Received string: "" Call log: - expect.toHaveClass with timeout 15000ms - waiting for locator('bs-datepicker-container').locator('td span').filte
- Evidence: test-results-estimate-h214/GoldEstimate-tests-gold-es-0c515--be-chosen-as-Estimate-Date-chromium/test-failed-1.png

## DC-EST-007 - a 6 MB image is rejected (limit 5 MB)
- Test case: TC_ESTIMATE_FILE_03 (File download / upload)
- Requirement: REQ-EST-015
- Steps to reproduce:
  1. Select the test contact (by mobile)
  2. Select Loan Name New Gold and an AUTOTEST scheme
  3. Try to upload a 6 MB image
- Expected: The file is rejected (limit 5 MB); its name is not shown in the upload box.
- Actual: Error: expect(received).not.toMatch(expected) Expected pattern: not /big-image-6mb/i Received string: "big-image-6mb.png"
- Evidence: test-results-estimate-h214c/GoldEstimate-tests-gold-es-03777-age-is-rejected-limit-5-MB--chromium/test-failed-1.png

## DC-EST-008 - form fits a phone screen and fields are keyboard-reachable
- Test case: TC_ESTIMATE_A11Y_01 (Accessibility & responsive)
- Requirement: REQ-EST-028
- Steps to reproduce:
  1. Open the form at 390x844 (phone)
  2. Press Tab from Remarks
- Expected: No horizontal scroll; focus moves to the next control.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: true Received: false
- Evidence: test-results-estimate-h214/GoldEstimate-tests-gold-es-4bf0a-elds-are-keyboard-reachable-chromium/test-failed-1.png

## DC-EST-009 - every visible field and button on the form has an accessible name
- Test case: TC_ESTIMATE_A11Y_02 (Accessibility & responsive)
- Requirement: REQ-EST-028
- Steps to reproduce:
  1. Select the test contact (by mobile)
  2. Select Loan Name New Gold and an AUTOTEST scheme
  3. Check every visible field and button for an accessible name
- Expected: Each control has a label, aria-label, title, placeholder or button text.
- Actual: Error: controls without an accessible name expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 14 - Array [] + Array [ + "input", + "input", + "input[ptodayDate]", + "select[pLoantypeid]", + "select", + "input", + "select", + "input", + "input", + "input", + "input", + "input", + ]
- Evidence: test-results-estimate-h214c/GoldEstimate-tests-gold-es-d73a8-form-has-an-accessible-name-chromium/test-failed-1.png

