# Coverage-gap report – Gold Packet Barcode Generator

Run: 16 Oct 2026, host214, Chromium, Branch Head (CHECKER_BH). Full run 51 passed / 8 failed / 2 skipped; two script faults fixed
(TC_PB_009 read the preview before it rendered; TC_PB_056 opened its second login in a window the fixture closes) and the
failing tests rerun. No barcode was printed or cancelled on the server.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 69 | 61 | 61 | 59 | 52 | 7 | 0 | 2 | 4 | 4 |

## Defect candidates (need confirmation)

| # | Test | Finding | Steps | Severity |
|---|---|---|---|---|
| D1 | TC_PB_052 | An appraiser (INT_APPRAISER1) opening `#/Loans/GoldPacketBarcodeGenerate` directly gets the full generator with **Generate barcode** – only the menu entry is hidden | Log in as tryfinsta → open the URL | High |
| D2 | TC_PB_056 | The barcode API returns the BH loan list (200, 7 loans) to an appraiser's token | Appraiser token → `GET getloansforbarcode?Type=New` | High |
| D3 | TC_PB_041 | GLNG0126090000002 already has a **Used** BH barcode (BH2609000020) but is still offered in the BH list ("not yet packeted") | BH → open Loan Number list; compare with register | Medium |
| D4 | TC_PB_011 | After Generate (BH), switching Type to Audit keeps the BH preview and its Print sticker button | Select loan → Generate → click Audit | Medium (HYPOTHESIS) |
| D5 | TC_PB_038 | 5 records have the old number format `GLD-20260904-0001…0005` (type New) instead of BH + 10 digits; no duplicates | Register / API | Low – probably legacy test data |
| D6 | TC_PB_058 | Loan Number select has no accessible name (Type radios are fine) | Inspect | Low |
| D7 | TC_PB_059 | Register search box has a placeholder only, no label | Inspect | Low |

D1 is not exploited by the tests: writes were blocked, so it is unknown whether the server would accept an appraiser's print.
Confirm with D2 – if the API also accepts `generatebarcode` from an appraiser, it is a real authorisation gap.

## Skipped (2)

TC_PB_060, 061 – real print + cancel; permanent records. Run with `ALLOW_DATA_CREATION=1` (see RUN_GUIDE).

## Not executed (4)

| ID | Why |
|---|---|
| TC_PB_062 | Audit limit per loan – needs several permanent Audit barcodes; limit message unknown |
| TC_PB_063 | Barcode becomes Used at Inventory – belongs to the Inventory form |
| TC_PB_064 | Physical sticker size / CODE128 scan – needs label printer and scanner (manual) |
| TC_PB_065 | Two Branch Heads at once, session timeout, Firefox/WebKit – one BH login, Chromium only |

## N/A (4)

Edit/delete (only Cancel exists), field length (no limited typed field), database (no access), upload (none on screen).

## What was simulated

Success, failure, server 500 and "loan already has an unused barcode" replies were simulated (`mockWrite`) so nothing was written.
They prove what the **screen** sends and shows; they do not prove the server's own checks. The server-side rules verified on
real data are TC_PB_025 (real loan with an unused barcode refused), 037–041 (register data) and 053–055 (API).
