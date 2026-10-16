# Entry-flow analysis – Loan Disbursal

Source: Gold Flow Entry `npm run disbursal` (single-entry script) and live exploration on host214 on 16 Oct 2026 as the maker
(`INT_APPRAISER1` / tryfinsta), with every write blocked (`utils/discover-disbursal.js`, screenshots in `evidence/discovery/`).

## Where it is

Loans → Loan Management → **Loan Disbursal** (`#/Loans/DisbursementView`). Branch (ALL / HEAD OFFICE) + **Show Loans** lists the
**Approved** loans (17 on 16 Oct): Application No (link), Branch, Loan Type, Loan Name, Applicant Name, Contact No., Sanctioned
Amount, Actions. `GET Disbursement/GetDisbursementViewData`. Search box "Search in all columns", 10 per page.
The **Actions** icon is *Revert to Approval* – never clicked by the tests.

Access: maker and Branch Head can open it; the external appraiser has no menu entry and is sent to the Dashboard by URL.

## Disbursement form (`#/Loans/DisbursementNew;id=…`)

| Part | Content |
|---|---|
| History | Date / Disbursed by / Voucher No. / Mode of Payment ("No records available" for a new loan) |
| Borrower Bank Details | Primary account radio, bank, account type, name, account no., IFSC, branch (`getDisbursementbankDetails`); **Sync Bank Details**, **Add Bank Details** |
| Disburse Date | Today, read-only |
| Mode of Payment | **Cash – <book balance> Dr** / **Bank : <book balance> Cr** (`getbankbalances`); Cash pre-selected |
| Bank | Cheque (bank + cheque no. list) · Online (bank + Type of Payment RTGS / NEFT / IMPS / UPI / INTRA BANK TRANSFER + Reference No max 30) · Debit Card (card list) |
| Amounts | EMI Type, Sanctioned Loan Amount, Previous Disbursed Amount, Amount Available to Disburse, **Current Loan Payout Amount** (max 18), Installment Start Date (+1 month, read-only), Less Adjustments, Broken Interest Amount (26 %), Advance EMI Amount, Amount Disbursed |
| Options | Top Up checkbox, broken-interest checkbox |
| Buttons | Clear, **Submit For Approval** |

Gold loans are **SINGLE PAYMENT**: any other payout is put back to the full amount, with "In Single Payment mode, full sanctioned
amount must be disbursed." for 0, smaller, negative or 3-decimal values (silently for letters, empty or larger values).

## Submit

`POST loans/transactions/golddisbursal/SubmitDisbursal {pDisbursement:{pmodofpayment, ptranstype, ptypeofpayment, pChequenumber,
pbankname, pbankid, pvchapplicationid, ploandisbusableamount, ploandisbusalamount, ppaymentdate, pinstallmentstartdate,
pselectedBankaccountno, ptypeofoperation:"CREATE", …}}`. Success: "Disbursal submitted for Branch Head approval." and back to the
list. `RequiresApproval` = true; the loan then waits in the Gold Disbursal Approval Queue and its Submit button is disabled
(`GetLatestForApplication` returns the pending request).

Validation seen: Bank without Cheque/Online/Debit Card → "Please Select Bank". Online with no bank, no payment type or no reference
→ nothing happens, no message. Submitting without touching Mode of Payment submits **Cash**.
