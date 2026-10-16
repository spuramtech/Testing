# Gold Disbursal Approval Queue - defect candidates

These tests FAILED on `http://host214.kapilits.com:8411/`. They are **candidates**, not confirmed defects: each needs a human to confirm the expected behaviour.

## DC-DISBAPP-001 - a loan's page shows the same values again after a page reload
- Test case: TC_DISBAPP_READ_06 (Read / Persistence)
- Requirement: REQ-DISBAPP-001
- Steps to reproduce:
  1. Choose the status view "Approved & Disbursed"
  2. Open the first loan
  3. Reload the page
  4. Read the loan page again
- Expected: The same values are shown.
- Actual: Error: loan page after reload expect(received).toBe(expected) // Object.is equality Expected: "GLNG0126060000007" Received: undefined Call Log: - Timeout 30000ms exceeded while waiting on the predicate
- Evidence: test-results-disb-c/GoldDisbursalApproval-test-a9f44-s-again-after-a-page-reload-chromium/test-failed-1.png

## DC-DISBAPP-002 - Back returns to the same status view the user was looking at (HYPOTHESIS)
- Test case: TC_DISBAPP_CANCEL_02 (Delete & Cancel)
- Requirement: REQ-DISBAPP-017
- Steps to reproduce:
  1. Choose the status view "Reverted"
  2. Open a loan
  3. Click Back
- Expected: The queue still shows the "Reverted" view (HYPOTHESIS).
- Actual: Error: status view after Back (it was "Reverted" before opening the loan) expect(received).toBe(expected) // Object.is equality Expected: "Reverted" Received: "Waiting for Approval"
- Evidence: test-results-disb/GoldDisbursalApproval-test-cf0af--was-looking-at-HYPOTHESIS--chromium/test-failed-1.png

## DC-DISBAPP-003 - a search of only spaces is treated as empty (the full list stays)
- Test case: TC_DISBAPP_INPUT_02 (Input validation)
- Requirement: REQ-DISBAPP-010
- Steps to reproduce:
  1. Choose the status view "All"
  2. Search five spaces
- Expected: The full list stays.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: 24 Received: 0
- Evidence: test-results-disb/GoldDisbursalApproval-test-0dd7d--empty-the-full-list-stays--chromium/test-failed-1.png

## DC-DISBAPP-004 - spaces around a loan number are ignored
- Test case: TC_DISBAPP_INPUT_03 (Input validation)
- Requirement: REQ-DISBAPP-010
- Steps to reproduce:
  1. Choose the status view "Approved & Disbursed"
  2. Search a loan number with spaces around it
- Expected: The loan is found.
- Actual: Error: expect(received).toContain(expected) // indexOf Expected value: "GLNG0126060000007" Received array: []
- Evidence: test-results-disb/GoldDisbursalApproval-test-2d2ee-d-a-loan-number-are-ignored-chromium/test-failed-1.png

## DC-DISBAPP-005 - the pager total equals the number of rows read over all pages, for every status
- Test case: TC_DISBAPP_CONSISTENCY_02 (Data consistency)
- Requirement: REQ-DISBAPP-002
- Steps to reproduce:
  1. For each status view read the pager total and all pages
- Expected: Rows over all pages = pager total.
- Actual: Error: rows over all pages in "Reverted" expect(received).toBe(expected) // Object.is equality Expected: 1 Received: 0
- Evidence: test-results-disb-c/GoldDisbursalApproval-test-3fe4b--all-pages-for-every-status-chromium/test-failed-1.png

## DC-DISBAPP-006 - the search box, both filters and the action buttons have accessible names
- Test case: TC_DISBAPP_A11Y_02 (Accessibility & responsive)
- Requirement: REQ-DISBAPP-021
- Steps to reproduce:
  1. Check the search box, filters and action buttons
- Expected: Each has an accessible name.
- Actual: Error: controls without an accessible name expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 5 - Array [] + Array [ + "input", + "select", + "select", + ]
- Evidence: test-results-disb/GoldDisbursalApproval-test-a8642-ttons-have-accessible-names-chromium/test-failed-1.png

## DC-DISBAPP-007 - the search box has a maximum length
- Test case: TC_DISBAPP_LENGTH_01 (Field length & autocomplete)
- Requirement: REQ-DISBAPP-021
- Steps to reproduce:
  1. Read maxlength of the search box
- Expected: A maximum length is set.
- Actual: Error: search maxlength expect(received).not.toBeNull() Received: null
- Evidence: test-results-disb/GoldDisbursalApproval-test-b58bd-ch-box-has-a-maximum-length-chromium/test-failed-1.png

## DC-DISBAPP-008 - the search box keeps at most a sensible number of characters (a 5,000-character paste is cut)
- Test case: TC_DISBAPP_LENGTH_02 (Field length & autocomplete)
- Requirement: REQ-DISBAPP-021
- Steps to reproduce:
  1. Paste 5,000 characters into the search box
- Expected: At most 500 are kept.
- Actual: Error: expect(received).toBeLessThanOrEqual(expected) Expected: <= 500 Received: 5000
- Evidence: test-results-disb/GoldDisbursalApproval-test-71af6-000-character-paste-is-cut--chromium/test-failed-1.png

