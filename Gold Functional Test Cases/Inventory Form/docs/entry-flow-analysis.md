# Entry-flow analysis – Inventory Form

Source: Gold Flow Entry `npm run inventory` (single-entry script) and live exploration on host214 on 16 Oct 2026 as Branch Head
(`CHECKER_BH`), with every write blocked (`utils/discover-inventory.js`, screenshots in `evidence/discovery/`). One real packet
photo was uploaded during exploration to learn the upload reply (a loose image file in the server's Documents folder, not linked
to any loan); the tests simulate it.

## Where it is

Loans → Gold → **Inventory Form** (`#/Loans/InventoryForm`). **View** opens the saved inventories (`#/Loans/InventoryFormView`),
**New** returns to the form. The appraisers have no menu entry.

## Form

| Field | Control | Rules seen |
|---|---|---|
| Trans Date | text, read-only | Today (dd/mm/yyyy) |
| Select Loan Type | select | Gold Loan |
| Loan Application / Account No. | ng-select | `GET Receipts/GetApplicantionid?loanname=Gold Loan&formname=INVENTORY` – disbursed loans not yet in inventory. Shows Customer Name, Mobile No., Loan No. (`GetGLDetailsById`) |
| Collateral table | grid with tick boxes | Article, details, gross weight, pure net weight, Packetno, Packet Photo |
| Barcode/Packet No * | text + "Scan barcode here" + **Bind To Packet No** (or Enter) | `getcheckpacketnumber` + `goldpacketbarcode/getbarcodedetails` |
| Packet Photo (with barcode) * | file, `image/png,image/jpeg` | Uploaded at once (`contact/MultiFileUploads`), reply `[server path, file name]`; failure: "Could not upload the packet photo. Please try again." |
| Vault/Strong Room | ng-select | Active vaults (`InventoryMasters/getvaultconfiguration`); fills **Vault Code** (read-only) |
| Safe Number | select | Cabinets of that vault (`getcabinetconfiguration`) |
| Locker Number | select | Free lockers of the safe (`getavailablelockerdetails?cabinetid=`) |
| Remarks | textarea, maxlength 300 | Save does nothing while empty (no message) |

### Scan messages

| Barcode | Message |
|---|---|
| Unknown / not generated | This is not a recognised barcode. Generate one from the Gold Packet Barcode menu first. |
| Another loan's barcode | This barcode was generated for loan GLNG… and cannot be used on a different loan. |
| Cancelled | This barcode is already "Cancelled" and cannot be used again. |
| Already used on a packet | Already Exist Packet Number |
| The loan's own unused BH barcode | Barcode valid - matches loan GLNG…. → Packet No filled |

### Add / Save

Add needs: packet number ("Enter Packet Number"), photo ("Capture the packet photo with the barcode before adding"), vault ("Enter
Vault Name"), safe and locker. Add writes the packet number into every collateral row and shows **Clear** and **Save**.

Save → `POST loans/Transactions/saveloaninventory`
`{pInventoryid:0, pTypeofoperation:"CREATE", pContactid, pTransdate, pLoanid, pRemarks, inventorydetails:[{article…, pGrossweight,
pPureNetWeight, pPacketno, pVaultid, pVaultloanname, pVaultloancode, pCabinetid, pCabinetno, pLockerno, pArticlefilepath}]}`.
No confirmation dialog. A failed save showed "Unknown Error".

## View

Columns Applicant Name, Loan Number, Inventory Number (INV + 10 digits), Trans Date, G.WT, Pure N.WT, Remarks, No of Items, Actions;
totals row; 10 per page (27–28 records on 16 Oct). `GET loans/Transactions/getloaninventory`.

## Lifecycle

Barcode printed (Not Used) → scanned here and saved → barcode **Used**, loan leaves the list, inventory appears in View. Saving is
permanent (no edit/delete), so the real save is opt-in only (`ALLOW_DATA_CREATION=1`).

The page contains a hidden **Session Timeout** warning (`#idleWarningModal`: "You will be logged out in 30 seconds due to
inactivity", Stay Logged In / Logout). It did not appear within 6 idle minutes, so the idle time is unknown.
