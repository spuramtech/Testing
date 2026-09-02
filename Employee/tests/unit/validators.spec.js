const { test, expect } = require('@playwright/test');
const { isNonNegativeNumber, isFutureDate, calculateCtc, isValidDateFormat } = require('../../helpers/validators');

// Pure logic unit tests — no browser, no live app. Closes the "Unit
// Testing" coverage gap flagged as not-covered in the report.
test.describe('@unit Employee validators', () => {
  test('isNonNegativeNumber accepts 0 and positive numbers', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(50000)).toBe(true);
  });

  test('isNonNegativeNumber rejects negative numbers and non-numbers', () => {
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber('abc')).toBe(false);
  });

  test('isFutureDate correctly flags a future date', () => {
    expect(isFutureDate('2099-01-01')).toBe(true);
  });

  test('isFutureDate correctly flags a past date as not future', () => {
    expect(isFutureDate('2000-01-01')).toBe(false);
  });

  test('calculateCtc sums Basic Salary and Allowance', () => {
    expect(calculateCtc(50000, 2000)).toBe(52000);
    expect(calculateCtc(20000, 1)).toBe(20001);
  });

  test('calculateCtc handles zero allowance', () => {
    expect(calculateCtc(60000, 0)).toBe(60000);
  });

  test('isValidDateFormat accepts ISO yyyy-mm-dd', () => {
    expect(isValidDateFormat('2026-09-01')).toBe(true);
  });

  test('isValidDateFormat rejects malformed strings', () => {
    expect(isValidDateFormat('01/09/2026')).toBe(false);
    expect(isValidDateFormat('not-a-date')).toBe(false);
  });
});
