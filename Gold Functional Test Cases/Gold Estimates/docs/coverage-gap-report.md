# Coverage-gap report – Gold Estimates

Run: host214, Chromium, 15/10/2026 – full run + reruns of script-fixed tests (TC_GE_005, 007, 031, 033, 040, 058) and TC_GE_052.
Numbers: `reports/execution-results.json`. **No estimate was saved** (real save is opt-in).

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 64 | 58 | 58 | 57 | 53 | 4 | 0 | 1 | 4 | 2 |

## Defect candidates (need confirmation)

| ID | Test | Finding | Severity guess |
|---|---|---|---|
| DC-01 | TC_GE_018 | Quantity "1.5" silently becomes **15** | Medium |
| DC-02 | TC_GE_033 | Remarks are re-capitalised before saving: "checked by qa team" is sent as "Checked By Qa Team" | Low |
| DC-03 | TC_GE_024 | Quantity 0 message reads "Please Start Number cannot be Zero" (wrong wording – should mention quantity) | Low |
| DC-04 | TC_GE_057 | Date, Loan Name, Scheme, Remarks, Quantity, Gross weight have no accessible names | Low |

## Confirmed behaviour (passed)

Gold rate = latest approved internal rate (₹13,839.39 "as of 13/10/2026"); net weight wastage bands 0/1/2/5/8 %; purity deduction (20K
9.1 %, 22K-tier rate); row totals and totals; LTV from the chosen scheme slab (GL-quick 80.57 % / 75.83 %), rate/gram and eligible
loan; no-scheme warning and **save refused without LTV**; prohibited article types hidden; per-person quantity limit refused;
mandatory article / image / gross weight; stone > gross refused; review dialog content, Back to Edit, save payload; save failure
messages; one request on double-click; scheme list = active effective schemes; View and My Saved Estimates lists; approval slabs
cover every amount; no-token API refusal.

## Skipped (1)

| Test | Reason |
|---|---|
| TC_GE_052 real save | `ALLOW_DATA_CREATION=1` not set – a saved estimate gets a GE number and cannot be deleted |

## Not executed (4) / N/A (2)

| Test | Reason |
|---|---|
| TC_GE_059 back-dated estimate | covered by the Gold Flow Entry back-dated flow; needs a saved estimate |
| TC_GE_060 Take Photo | needs a camera – manual |
| TC_GE_061 routing per slab | each check creates a permanent estimate (slab data checked by TC_GE_055) |
| TC_GE_062 session / browser / concurrency | idle time unknown; Chromium only; one maker account |
| TC_GE_NA1 edit/delete estimate | the app has no edit/cancel/delete for saved estimates |
| TC_GE_NA2 database | no DB access |

## Notes

* Save-success screens were not exercised (real save off). Routing text ("Routed to … for …") is covered by the Gold Flow Entry flow.
* Tests that reach the review dialog upload `gold-article.png` – each run adds small image files to the server's Documents folder.
