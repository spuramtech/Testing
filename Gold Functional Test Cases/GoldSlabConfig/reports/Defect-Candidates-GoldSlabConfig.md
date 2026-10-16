# Gold Slab Config - defect candidates

These tests FAILED on `http://host214.kapilits.com:8411/`. They are **candidates**, not confirmed defects: each needs a human to confirm the expected behaviour.

## DC-SLAB-001 - non-Latin digits typed in From Amount are not kept
- Test case: TC_SLAB_INPUT_05 (Input validation)
- Requirement: REQ-SLAB-005
- Steps to reproduce:
  1. Click Add Slab
  2. Type non-Latin digits into From
- Expected: Only Latin digits are kept.
- Actual: Error: expect(received).toMatch(expected) Expected pattern: /^[0-9]*$/ Received string: "١٢٣"
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--62dde-in-From-Amount-are-not-kept-chromium/test-failed-1.png

## DC-SLAB-002 - a slab that leaves a gap after slab A (From = A.To + 2) is rejected
- Test case: TC_SLAB_BOUNDARY_05 (Boundary values)
- Requirement: REQ-SLAB-002, REQ-SLAB-007
- Steps to reproduce:
  1. Click Add Slab
  2. Enter From = To of slab A + 2 (a gap of one amount)
  3. Click Save
- Expected: The slab is not saved (no "Slab saved." message) and no extra row appears in the list. (the help text says to start at To + 1).
- Actual: Error: a gap of one amount was accepted: Slab saved. expect(received).toBe(expected) // Object.is equality Expected: false Received: true
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--166f6-b-A-From-A-To-2-is-rejected-chromium/test-failed-1.png

## DC-SLAB-003 - the screen fits a phone (390 x 844) without sideways scrolling
- Test case: TC_SLAB_A11Y_01 (Accessibility & responsive)
- Requirement: REQ-SLAB-020
- Steps to reproduce:
  1. Open the screen at 390 x 844
- Expected: No horizontal scroll.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: true Received: false
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--a5068--without-sideways-scrolling-chromium/test-failed-1.png

## DC-SLAB-004 - every field and button of the Add Slab form has an accessible name
- Test case: TC_SLAB_A11Y_02 (Accessibility & responsive)
- Requirement: REQ-SLAB-020
- Steps to reproduce:
  1. Click Add Slab
  2. Check each control for an accessible name
- Expected: Every field and button has a label, title, placeholder or text.
- Actual: Error: controls without an accessible name expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 5 - Array [] + Array [ + "input", + "select", + "select", + ]
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--74b36-form-has-an-accessible-name-chromium/test-finished-1.png

## DC-SLAB-005 - the screen fits a tablet (768 x 1024) without sideways scrolling
- Test case: TC_SLAB_A11Y_03 (Accessibility & responsive)
- Requirement: REQ-SLAB-020
- Steps to reproduce:
  1. Open the screen at 768 x 1024
- Expected: No horizontal scroll.
- Actual: Error: expect(received).toBe(expected) // Object.is equality Expected: true Received: false
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--55d72--without-sideways-scrolling-chromium/test-finished-1.png

## DC-SLAB-006 - From / To Amount have a maximum length
- Test case: TC_SLAB_LENGTH_01 (Field length & autocomplete)
- Requirement: REQ-SLAB-018
- Steps to reproduce:
  1. Click Add Slab
  2. Read maxlength of From and To
- Expected: Both fields have a maximum length.
- Actual: Error: From Amount maxlength expect(received).not.toBeNull() Received: null
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--895e1-mount-have-a-maximum-length-chromium/test-failed-1.png

## DC-SLAB-007 - a 25-digit number typed in From Amount is cut to a safe length (16 digits at most)
- Test case: TC_SLAB_LENGTH_02 (Field length & autocomplete)
- Requirement: REQ-SLAB-018
- Steps to reproduce:
  1. Click Add Slab
  2. Type 25 digits into From
- Expected: At most 16 digits are kept.
- Actual: Error: expect(received).toBeLessThanOrEqual(expected) Expected: <= 16 Received: 25
- Evidence: test-results-slab/GoldSlabConfig-tests-gold--0f1d7-e-length-16-digits-at-most--chromium/test-finished-1.png

