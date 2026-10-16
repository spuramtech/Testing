# Coverage-gap report – Inventory Form

Run: 16 Oct 2026, host214, Chromium, Branch Head (CHECKER_BH). Full run 49 passed / 8 failed / 3 skipped. Script faults fixed and
rerun: TC_IF_010 and 012 read the safe list before the response arrived; TC_IF_032 skipped once without a ready loan (passed on
rerun); TC_IF_058 waited for a session warning that never became visible – moved to NOT EXECUTED. No inventory was saved and no
barcode was used up.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 67 | 59 | 59 | 58 | 52 | 5 | 0 | 2 | 5 | 3 |

## Defect candidates (need confirmation)

| # | Test | Finding | Steps | Severity |
|---|---|---|---|---|
| D1 | TC_IF_051 | An appraiser (INT_APPRAISER1) opening `#/Loans/InventoryForm` directly gets the form and all 7 loans waiting for inventory – only the menu entry is hidden | Log in as tryfinsta → open the URL → Gold Loan → loan list | High |
| D2 | TC_IF_055 | The inventory loan-list API returns all 7 loans (200) to an appraiser's token | Appraiser token → `GET Receipts/GetApplicantionid?…formname=INVENTORY` | High |
| D3 | TC_IF_034 | Save with empty Remarks does nothing – no request and no message | Bind, photo, storage, Add → Save | Medium |
| D4 | TC_IF_020 | Bind To Packet No with an empty box does nothing – no message | Select loan → Bind To Packet No | Low |
| D5 | TC_IF_057 | No form field has an accessible label (Loan Type, Loan, scan box, Vault, Safe, Locker, Remarks) | Inspect | Low |

D1/D2 match the same gap found on Gold Packet Barcode Generator. Writes were blocked, so it is not known whether the server would
accept a save from an appraiser.

## Skipped (2)

TC_IF_059, 060 – real save; permanent and uses up the barcode. Run with `ALLOW_DATA_CREATION=1` (see RUN_GUIDE).

## Not executed (5)

| ID | Why |
|---|---|
| TC_IF_058 | Session warning `#idleWarningModal` exists in the page but did not appear in 6 idle minutes; idle time unknown – check by hand |
| TC_IF_061 | Binding only some articles / several packets per loan – rule unknown, needs a real save; ready AUTOTEST loans have 1 article |
| TC_IF_062 | Two users choosing the same locker – one Branch Head login, needs real saves |
| TC_IF_063 | Camera capture – manual |
| TC_IF_064 | Firefox / WebKit – Chromium only |

## N/A (3)

Edit/delete (View has none), View search (none), database (no access).

## What was simulated

The packet photo upload and the Save replies (success, network failure, 500) were simulated. They prove what the **screen** sends
and shows, not the server's own checks. Server-side rules checked on real data: barcode scan lookups (TC_IF_013–019, 054), loan
list excludes inventoried loans (005), inventory ↔ barcode register consistency (044), View data (042, 043, 047), APIs (052–055).

Note: other users were saving inventories during the run (INV2610000028 appeared), so list-based results reflect live data at
the moment each test ran.
