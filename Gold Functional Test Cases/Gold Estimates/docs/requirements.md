# Requirements and business-rule inventory – Gold Estimates

VERIFIED = observed on host214; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Maker opens Gold Estimates with all sections | VERIFIED | TC_GE_001 |
| REQ-02 | Date defaults to today; no future date; back date only with a rate | VERIFIED / back date not run | 002, 003, 059 |
| REQ-03 | Scheme list = ACTIVE effective schemes from Gold Scheme Matrix | VERIFIED | 005 |
| REQ-04 | Contact found by name or mobile | VERIFIED | 006, 007 |
| REQ-05 | Grid rows, purity list, defects, approved gold rate | VERIFIED | 008, 009, 011, 012, 054 |
| REQ-06 | Article limits: prohibited types hidden; per-person quantity limit | VERIFIED (data) / HYPOTHESIS (enforcement) | 010, 032 |
| REQ-07 | Numeric masks and weight rules (gross > 0, stone ≤ gross) | VERIFIED | 016–027 |
| REQ-08 | Article, image mandatory; remarks ≤ 90; Clear | VERIFIED | 013, 028–031, 033 |
| REQ-09 | Net weight = (gross − stone) × (1 − wastage % by stone band) | VERIFIED | 034–038 |
| REQ-10 | Pure net, row total, totals | VERIFIED | 039–041 |
| REQ-11 | LTV from the selected scheme's slab; rate/gram and eligible loan follow it; no scheme → warning | VERIFIED / HYPOTHESIS (refuse without LTV) | 042–044, 051, 058 |
| REQ-12 | Review before save; Back to Edit; payload; failure handling; one request per click | VERIFIED / HYPOTHESIS | 045–050 |
| REQ-13 | View and My Saved Estimates lists | VERIFIED | 014, 015 |
| REQ-14 | Saved estimate gets a GE number and is routed per approval slab | VERIFIED (flow automation) | 052, 055, 061 |
| REQ-15 | APIs require a token | HYPOTHESIS | 053 |
| REQ-16 | Responsive, accessible | HYPOTHESIS | 056, 057, 062 |

## Open questions

1. Should an estimate be allowed when no LTV applies (no scheme and no loan LTV slab)?
2. Is the per-person article quantity limit enforced on the estimate?
3. Should remarks keep the user's capitalisation?
4. Should saved estimates be cancellable by the maker before the first approval?
