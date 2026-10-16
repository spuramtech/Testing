# Requirements and business-rule inventory – Daily Gold Rate

Status: **VERIFIED** = observed on host214 (screen, message or API); **HYPOTHESIS** = inferred, needs confirmation by the business owner.
Test case details: `test-data/test-cases.js`; results: `reports/QMetryReport.html`.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Daily Gold Rate opens from Loans → Gold → Gold Loan Configuration | VERIFIED | TC_GR_001 |
| REQ-02 | Online grid: Trans Date, 24K, 22K, 18K, Average Rate footer, pager; newest first | VERIFIED (sort order HYPOTHESIS) | TC_GR_002, 006, 007, 008, 064 |
| REQ-03 | Date Range filter with 8 options, default Last 30 Days | VERIFIED | TC_GR_003, 004, 005 |
| REQ-04 | "Search in all columns" filters the grid | VERIFIED (control exists) | TC_GR_009, 010, 011, 063 |
| REQ-05 | Grid exports to PDF / Excel | VERIFIED (icons) | TC_GR_012 |
| REQ-06 | New panel: Loan Type fixed "Gold Loan"; Trans Date defaults to previous working day | VERIFIED / default rule HYPOTHESIS | TC_GR_013, 014 |
| REQ-07 | Trans Date only from calendar; today, future and Sundays disabled | VERIFIED | TC_GR_015, 016, 017, 018 |
| REQ-08 | 24K accepts positive numbers, ≤ 5 integer digits, ≤ 2 decimals | VERIFIED | TC_GR_019–029, 062 |
| REQ-09 | 22K = 24K × 91.6 %, 18K = 24K × 75 % (2 decimals), read-only | VERIFIED | TC_GR_028–032 |
| REQ-10 | Other carats take the nearest higher tier (21/20/19K = 22K; 14K = 24K × 58.3 %) | VERIFIED (info text + payload) | TC_GR_043 |
| REQ-11 | 24K is mandatory (empty or 0 → warning) | VERIFIED | TC_GR_037, 038, 040 |
| REQ-12 | Clear empties the rates and keeps the date | VERIFIED | TC_GR_052 |
| REQ-13 | Save stores the online rate immediately and submits the next working day's Internal Rate for Checker approval; failures are not reported as success | VERIFIED | TC_GR_041, 043, 060, 061 |
| REQ-14 | Saved rate is listed with the submitted values; API and grid agree | VERIFIED | TC_GR_032, 042, 051 |
| REQ-15 | Only one online rate per Trans Date | HYPOTHESIS ("already exists" seen by the back-dated flow) | TC_GR_039, 058 |
| REQ-16 | Edit/Delete allowed until the derived Internal Rate is approved, then locked with tooltip | VERIFIED | TC_GR_035 |
| REQ-17 | Edit keeps Trans Date fixed and updates rates | VERIFIED | TC_GR_040, 044, 053 |
| REQ-18 | Delete asks for confirmation; cancel keeps the row | VERIFIED | TC_GR_045, 046 |
| REQ-19 | Checker cannot edit/delete; maker cannot approve; checker approves | VERIFIED | TC_GR_047, 048, 049, 056 |
| REQ-20 | Internal Rate = lower of 30-day average (A) and previous closing (B); B = previous online 24K | Stated by the column header | TC_GR_033, 034 |
| REQ-21 | Manual Gold Rate Entry switch follows company setting GOLD_RATE_MANUAL_ENTRY | VERIFIED | TC_GR_036 |
| REQ-22 | Gold-rate APIs require a valid token | HYPOTHESIS | TC_GR_050 |
| REQ-23 | Inactivity warning before logout | VERIFIED (seen once) | TC_GR_057 (manual) |
| REQ-24 | Repeated Save click must not create two submissions | HYPOTHESIS | TC_GR_041 |
| REQ-25 | Usable at tablet width; fields have accessible names | HYPOTHESIS (general quality) | TC_GR_054, 055, 059 |

## Open questions for the business owner

1. Is the Trans Date default "previous working day" intended, and should a date that already has a rate stay selectable in the calendar?
2. Internal Rate: should "Rate for Today" really be the **lower** of A and B? Current data shows the previous closing (B) is used even when A is lower.
3. Should the maker be allowed to save a rate for a date whose next working day already has an **approved** Internal Rate? (The new row locks at once and cannot be corrected.)
4. Are public holidays non-working days for gold rates? `getholidaylist` returned no holidays for 2025/2026.
