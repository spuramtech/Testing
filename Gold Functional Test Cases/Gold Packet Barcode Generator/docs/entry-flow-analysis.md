# Entry-flow analysis – Gold Packet Barcode Generator

Source: Gold Flow Entry `npm run barcode` (single-entry script) and live exploration on host214 on 16 Oct 2026 as Branch Head
(`CHECKER_BH`), with every write blocked (`utils/discover-barcode.js`, screenshots in `evidence/discovery/`).

## Where it is

Loans → Gold → **Gold Packet Barcode Generator** (`#/Loans/GoldPacketBarcodeGenerate`). **View Register** opens
`#/Loans/GoldPacketBarcodeRegister`. Only Branch Head users see it: the appraisers (INT_APPRAISER1, EXT_APPRAISER1) have no menu entry.

## Generator screen

| Field | Control | Rules seen |
|---|---|---|
| Type * | radio BH (value `New`) / Audit | Default BH. BH = "Loans approved / disbursed and not yet packeted". Audit = "Loans that already have a packet in inventory. Several Audit barcodes can be generated per loan (up to its number of gold articles)." |
| Loan Number * | ng-select with type-ahead, `GLNG… - applicant` | List from `GET getloansforbarcode?Type=New|Audit`. Hint "Select a loan number to generate a barcode." |
| Employee Name | text, read-only | Logged-in user (Finsta Admin) |

Steps:

1. **Generate barcode** → checks `GET getactivebarcodeforloan?Loanid=…`.
   - No active barcode → preview "Preview - not yet recorded" (branch, type, date "-", loan, employee, signature) with the note
     *Barcode number is assigned only when you click "Print sticker"*. Nothing is written.
   - Loan already has an unused barcode → "This loan already has an unused barcode … It must be used at inventory as-is - it cannot
     be reused or regenerated …", a reason box and **Cancel old barcode & generate new**. That sends `POST cancelbarcode`
     `{pBarcodeno, pCancelreason: "Superseded before use: <reason>", pModifiedby}` and then generates a new one.
2. **Print sticker** → `POST generatebarcode {pType, pLoanid, pEmployeeid, pEmployeename, pBranchid, pBranchname, pCreatedby}`.
   - Success: "Recorded sticker BH…", **Print again**, toast "Success! Barcode BH… recorded for loan GLNG…. It can only be used once."
     The browser print dialog opens (2 cm × 4 cm label, CODE128).
   - Failure: "Could not record the barcode - nothing was printed. Detail: …".

## Register screen

Columns: Barcode no., Type, Loan no., Applicant Name, Created by, Created date (dd-mm-yyyy hh:mm), Status, Remarks, Action.
Status filter: All statuses / Not Used / Used / Cancelled (`GET getbarcoderegister?Status=`). Search "barcode no. / loan no. /
applicant". 10 rows per page (74 records on 16 Oct). Barcode numbers BH + 10 digits (BH) and AUD + 10 digits (Audit).

**Cancel** appears only on Not Used rows. The dialog says "This barcode has not been used on a packet. Cancelling will mark it
permanently unusable", shows barcode, type and loan, needs **Reason for cancellation \***, and has Back / Confirm cancellation.

## Lifecycle

Not Used (printed) → Used (scanned at Inventory, once) or → Cancelled (permanent). No edit or delete exists. A printed barcode
cannot be removed, so real prints are opt-in only (`ALLOW_DATA_CREATION=1`).
