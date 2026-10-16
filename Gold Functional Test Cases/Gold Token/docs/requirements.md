# Requirements and business-rule inventory – Gold Token

VERIFIED = observed on host214; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Available tokens = approved estimates not yet used; used tokens listed separately | VERIFIED | TC_GT_001–004 |
| REQ-02 | Token overview / member / articles come from the estimate | VERIFIED | 005–009 |
| REQ-03 | At least one nominee; name + relationship required; proportions ≤ 100 each and = 100 in total; no duplicates; one primary | VERIFIED / HYPOTHESIS (primary, remove) | 010–018, 020, 032 |
| REQ-04 | KYC document types and reference length | VERIFIED | 019, 042 |
| REQ-05 | Loan name, tenure, interest from the estimate's scheme, locked; eligible = estimate eligible | VERIFIED | 021, 022, 036 |
| REQ-06 | Save sends the token, customer, nominees and amount; one request; clear errors; token becomes used | VERIFIED / HYPOTHESIS | 031, 033–035, 041 |
| REQ-07 | Amount numeric, > 0 and < eligible loan; never saved as 0 | VERIFIED / HYPOTHESIS (decimals, blank) | 023–030 |
| REQ-08 | APIs require a token; used status consistent | HYPOTHESIS | 037, 038 |
| REQ-09 | Responsive, accessible | HYPOTHESIS | 039, 040, 044 |

## Open questions

1. Should Amount Requested accept paise (decimals)? Today the decimal point is dropped and the amount becomes 100× larger.
2. May the amount equal the eligible loan exactly (message says "less than")?
3. Should only one nominee be primary? Can a nominee be removed before saving?
