# Requirements and business-rule inventory – Gold Scheme Matrix

VERIFIED = observed on host214; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Admin opens Gold Scheme Matrix from Gold Loan Configuration | VERIFIED | TC_GS_001 |
| REQ-02 | Grid lists every scheme of the company (10 per page, sortable) consistent with the API | VERIFIED | 002–005, 009, 010 |
| REQ-03 | New Scheme defaults; Loan and Type lists | VERIFIED | 011–013 |
| REQ-04 | Effective From from calendar, past allowed (back-dated flows need it) | VERIFIED | 015 |
| REQ-05 | Loan, code and name mandatory; Clear resets | VERIFIED | 016, 028–031 |
| REQ-06 | Numeric masks for tenure and rate; sensible limits | VERIFIED masks / HYPOTHESIS limits | 017–027 |
| REQ-07 | Paise/mo = rate ÷ 12; "Apply to all slabs" copies the default rate | VERIFIED | 006, 007, 033, 041 |
| REQ-08 | Internal LTV = RBI ÷ (1 + rate × months/12), months = tenure (Bullet) or 1 (Monthly); per-slab rate overrides | VERIFIED | 008, 014, 034–039 |
| REQ-09 | A slab can be excluded ("Not offered") and included back | VERIFIED | 040 |
| REQ-10 | Save stores header then slab rates (excluded = INACTIVE) | VERIFIED | 042, 043, 048 |
| REQ-11 | Save failures are reported; header without slabs is not left silently | VERIFIED (network) / HYPOTHESIS (partial) | 044–046 |
| REQ-12 | One save per click | HYPOTHESIS | 047 |
| REQ-13 | Edit shows saved values; Update changes them and keeps slab overrides; code fixed | VERIFIED / HYPOTHESIS (code lock) | 049–051, 059 |
| REQ-14 | Scheme Code is unique | HYPOTHESIS | 052, 069 |
| REQ-15 | "Scheme on" switch and Status control whether a scheme is offered (effective) | VERIFIED | 053, 056, 068 |
| REQ-16 | Delete is confirmed and permanent | VERIFIED | 054, 055 |
| REQ-17 | Only users with User Rights for GoldSchemeMatrix can open it | VERIFIED | 057, 058 |
| REQ-18 | Scheme APIs require a token and rights | HYPOTHESIS | 060–064 |
| REQ-19 | Responsive and accessible | HYPOTHESIS | 065–067, 070 |

## Open questions

1. Valid range for tenure (0? 999?) and interest rate (> 99.99 %?).
2. Should the Scheme Code be unique and locked after creation?
3. Should Update keep per-slab rates and exclusions? (Observed: they are reset.)
4. What should happen if the header saves but the slab rates fail?
