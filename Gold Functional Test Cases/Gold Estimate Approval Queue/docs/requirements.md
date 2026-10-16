# Requirements and business-rule inventory – Gold Estimate Approval Queue

VERIFIED = observed on host214 or in the application source; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Branch Head sees the queue columns | VERIFIED | TC_EQ_001 |
| REQ-02 | Status filter (7 statuses), totals, aging | VERIFIED | 002–004, 010 |
| REQ-03 | Search by GE, customer, mobile | VERIFIED | 005–007 |
| REQ-04 | Approved estimates carry a pledge token | VERIFIED | 008 |
| REQ-05 | Each role sees only its own work; maker cannot verify / approve own estimate | VERIFIED (source + UI) | 009, 016–019, 031, 042 |
| REQ-06 | Appraisal counts and final values consistent | VERIFIED | 011 |
| REQ-07 | Detail view: header, entries, LTV/eligible, history | VERIFIED | 012–015 |
| REQ-08 | IA2 Verify: approve / revert with mandatory remarks | VERIFIED | 020–028 |
| REQ-09 | Branch Head: choose final entry, approve; revert voids all entries with remarks | VERIFIED | 032–041, 043, 051 |
| REQ-10 | Failures reported; one request per click | HYPOTHESIS | 029, 030, 038, 039 |
| REQ-11 | Server enforces roles and remarks | HYPOTHESIS (read), VERIFIED in source comments (write) | 044–048 |
| REQ-12 | Responsive, accessible | HYPOTHESIS | 049, 050, 055 |

## Open questions

1. Should Internal Appraiser 2's Approve ask for confirmation (Checker approval and both Reverts do)?
2. Should non-Branch-Head users be able to read the full branch queue through the API?
3. Should the status filter say "(as Branch Head)" to users who are not Branch Head?
