# Requirements and business-rule inventory – Gold Packet Barcode Generator

VERIFIED = observed on host214; HYPOTHESIS = inferred – needs business confirmation.

| Req | Requirement / rule | Status | Test cases |
|---|---|---|---|
| REQ-01 | Generator shows Type (default BH), Loan Number, read-only Employee Name = logged-in user | VERIFIED | TC_PB_001–003 |
| REQ-02 | BH list = loans not yet packeted; Audit list = loans in inventory; type-ahead; only listed loans can be chosen | VERIFIED / HYPOTHESIS (BH list excludes packeted loans) | 004–007, 012–015, 041 |
| REQ-03 | Generate needs a loan and only previews – no number, nothing recorded | VERIFIED / HYPOTHESIS (preview follows the type) | 008–011 |
| REQ-04 | Print sticker records the barcode once, shows the number and "use once"; failures say nothing was printed | VERIFIED | 016–021, 060, 064 |
| REQ-05 | One unused BH barcode per loan; must be cancelled (with a reason) before a new one; numbers unique BH/AUD + 10 digits; Audit up to the loan's article count | VERIFIED / HYPOTHESIS (one Used BH per loan, Audit limit) | 022–025, 038–040, 062 |
| REQ-06 | Register lists all barcodes with filter, search, newest first, 10 per page | VERIFIED | 026–036, 042, 043 |
| REQ-07 | Only Not Used barcodes can be cancelled; reason required; cancel is permanent | VERIFIED | 037, 044–049, 061, 063 |
| REQ-08 | Only Branch Head users can use the screen and its API | VERIFIED (screen) / HYPOTHESIS (API) | 050–052, 056 |
| REQ-09 | APIs require a token; register filter consistent | HYPOTHESIS | 053–055 |
| REQ-10 | Responsive and accessible | HYPOTHESIS | 057–059, 065 |

## Open questions for the business owner

1. Should the BH preview be cleared when the user switches the Type to Audit (TC_PB_011)?
2. What is the exact Audit limit per loan and its message (TC_PB_062)?
3. Is a loan allowed more than one Used BH barcode (re-packeting) (TC_PB_040)?
4. Should appraisers be able to read the barcode APIs at all (TC_PB_056)?
