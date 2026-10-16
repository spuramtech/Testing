# Requirements and business-rule inventory – Inventory Form

VERIFIED = observed on host214; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Trans Date today, read-only; Loan Type Gold Loan | VERIFIED | TC_IF_001–003 |
| REQ-02 | Loan list = disbursed loans not yet in inventory; customer and collateral from the loan | VERIFIED | 004–007, 060 |
| REQ-03 | Only the loan's own unused BH barcode can be bound; unknown, other-loan, cancelled and used barcodes refused; barcode becomes Used after save | VERIFIED / HYPOTHESIS (typed packet, audit barcode, empty bind) | 013–022, 027, 028, 044, 054 |
| REQ-04 | Photo (PNG/JPEG), vault, safe and a free locker are required before Add; vault drives code, safes, lockers | VERIFIED | 009–012, 023–026, 029–031, 061–063 |
| REQ-05 | Save sends every article with packet and storage; remarks required (max 300); one request; clear success / error | VERIFIED / HYPOTHESIS (message for blank remarks) | 008, 032–040, 059 |
| REQ-06 | View lists saved inventories, unique INV numbers, one per loan, totals, newest first, paging | VERIFIED / HYPOTHESIS (one per loan) | 041–048 |
| REQ-07 | Only Branch Head users can use the form and its API | VERIFIED (menu) / HYPOTHESIS (URL, API) | 049–051, 055 |
| REQ-08 | APIs require a token | HYPOTHESIS | 052, 053 |
| REQ-09 | Responsive, accessible, idle-timeout warning | HYPOTHESIS | 056–058, 064 |

## Open questions for the business owner

1. Can a loan's articles go into more than one packet (bind only some articles)? (TC_IF_061)
2. Should Save with empty Remarks show a message? Today nothing happens. (TC_IF_034)
3. May an Audit barcode ever be used here? (TC_IF_022)
4. What is the intended idle time before the session warning? (TC_IF_058)
