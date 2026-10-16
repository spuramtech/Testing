# Entry-flow analysis – Gold Token

Source: Gold Flow Entry `tests/gold-token.spec.js` (`npm run token`). Analysed on **host214** on 15/10/2026 as INT_APPRAISER1 with
**every write blocked** (`utils/discover-token.js`). The only available token (UID00035) belonged to another user's real estimate – it was
only selected on screen, never saved; its customer data is not kept in this folder.

## 1. Screen – `#/Loans/GoldLoanToken`

Tabs **New Tokens (n)** / **Used Tokens (n)**. "Available Gold Loan Tokens" grid: Generate (radio) · Token Number · Customer Name ·
Customer Mobile · Customer Type · Appraisal Value (`Firstinformation/GetGoldLoanCustomerDetails`, unused = `isTokenUsed:false`).
Used tokens: `GetUsedGoldLoanTokensDetails?pFromDate&pToDate`.

Selecting a token (`GetGoldEstimationDetailsbyToken?token=`) shows **Token Overview** – Date (read-only, the estimate date), Token Number,
Appraisal Value, Eligible Loan Amount (LTV), Article Qty – and tabs **Article Details**, **Member**, **Loan Details**.

## 2. Member tab

Member Information (code, name, contact number, address, PAN – from the contact) · **Nominee Details**: Full Name (max 100), Relationship
(Mother, Father, Brother In Law, Sister In Law, Sister, Brother, Mother In Law, Spouse, Son, Daughter), Contact No. (max 12, digits only when typed), Proportional % · **KYC Documents** (optional): ID Proof Type (PAN / FORM 60, Identification, Address, Financial, Bank Proof,
Other) → ID Proof (e.g. Form 60, PAN CARD) → Reference Number (max 30) → Upload (`MultiFileUploads`) · **Add** · nominee table · **Next**.

| Trigger | Message |
|---|---|
| Add without name / relationship | "Please fill Full Name and Relationship before adding a nominee" |
| Proportion > 100 | "Proportional should not be greater than 100" |
| Same nominee again | "Already existed" |
| Next with no nominee | "Please add at least one Nominee before proceeding." |
| Next when total ≠ 100 % | "Nominee Proportional must add up to 100% across all nominees (currently 60%)." |

## 3. Loan Details tab

Loan Name (New Gold, disabled) · Eligible Loan Amount (LTV) · Interest Type (Diminishing) · **Amount Requested** · Tenure (months) and
Interest Rate % p.a. – from the estimate's scheme, disabled · Charges & Fees table (charge, amount, waiver, after waiver, GST amount,
GST type, GST %, adjust in loan disbursement, collect from borrower) · Back · Save.

Amount rules: digits only (minus stripped), Indian separators; **must be less than** the eligible loan – equal or higher is cleared with
"Amount Should be Less than Eligible Loan Amount (LTV)"; a decimal point is dropped ("1000.50" → "1,00,050").

Save → POST `Transactions/Disbursement/SaveCustomerandGoldLoanAllDetails` `{ pCustomerType, pContactid, pContactreferenceid, Ptokennumber,
PersonalNomineeList[], Contact{…}, pAmountrequested, … }`. A blank amount is sent as **0**. Failure message: "Unknown Error".
