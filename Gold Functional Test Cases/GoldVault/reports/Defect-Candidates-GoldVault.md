# Vault - defect candidates

These tests FAILED on `http://host214.kapilits.com:8411/`. They are **candidates**, not confirmed defects: each needs a human to confirm the expected behaviour.

## DC-VAULT-001 - spaces only in all three fields count as empty (nothing is sent)
- Test case: TC_VAULT_INPUT_01 (Input validation)
- Requirement: REQ-VAULT-005
- Steps to reproduce:
  1. Click New
  2. Enter only spaces in all three fields
  3. Click Save
- Expected: Treated as empty: No save request leaves the browser.
- Actual: Error: a save request was sent for blank (space-only) values expect(received).toBe(expected) // Object.is equality Expected: 0 Received: 1
- Evidence: test-results-vault/GoldVault-tests-gold-vault-866d4-t-as-empty-nothing-is-sent--chromium/test-failed-1.png

## DC-VAULT-002 - spaces around the values are trimmed before they are sent
- Test case: TC_VAULT_INPUT_05 (Input validation)
- Requirement: REQ-VAULT-005
- Steps to reproduce:
  1. Click New
  2. Enter values with spaces around them
  3. Click Save (call aborted)
- Expected: The values in the save request have no leading / trailing spaces.
- Actual: Error: values sent with leading / trailing spaces expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 5 - Array [] + Array [ + " AUTOTEST TRIM ", + " HEAD OFFICE ", + " ATFTTRIM ", + ]
- Evidence: test-results-vault/GoldVault-tests-gold-vault-508c3-rimmed-before-they-are-sent-chromium/test-failed-1.png

## DC-VAULT-003 - the Excel export contains every vault code listed in the grid
- Test case: TC_VAULT_CONSISTENCY_01 (Data consistency)
- Requirement: REQ-VAULT-016
- Steps to reproduce:
  1. Read all vault codes from the grid
  2. Download the Excel export
- Expected: Every code of the grid is in the Excel file.
- Actual: Error: codes in the grid but not in the Excel file expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 11 - Array [] + Array [ + "ATV40675", + "ATV71407", + "ATV60122", + "ATV13764", + "ATV60531", + "ATV86130", + "ATV93697", + "ATV71145", + "ATV97906", + ]
- Evidence: test-results-vault/GoldVault-tests-gold-vault-abc44-ult-code-listed-in-the-grid-chromium/test-failed-1.png

## DC-VAULT-004 - the screen fits a phone (390 x 844) without sideways scrolling
- Test case: TC_VAULT_A11Y_01 (Accessibility & responsive)
- Requirement: REQ-VAULT-023
- Steps to reproduce:
  1. Open the screen at 390 x 844
- Expected: No horizontal scroll.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: true Received: false
- Evidence: test-results-vault/GoldVault-tests-gold-vault-81d2c--without-sideways-scrolling-chromium/test-failed-1.png

## DC-VAULT-005 - the screen fits a tablet (768 x 1024) without sideways scrolling
- Test case: TC_VAULT_A11Y_03 (Accessibility & responsive)
- Requirement: REQ-VAULT-023
- Steps to reproduce:
  1. Open the screen at 768 x 1024
- Expected: No horizontal scroll.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: true Received: false
- Evidence: test-results-vault/GoldVault-tests-gold-vault-f9651--without-sideways-scrolling-chromium/test-failed-1.png

