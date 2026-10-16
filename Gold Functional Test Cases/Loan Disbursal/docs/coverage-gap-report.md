# Coverage-gap report – Loan Disbursal

Run: 16 Oct 2026, host214, Chromium, maker INT_APPRAISER1 (tryfinsta). Full run 39 passed / 14 failed / 3 skipped. Script faults
fixed and rerun: the menu click to Loan Disbursal sometimes did not navigate (9 tests – now retried, then the page address is
opened); TC_LD_013 read the bank reply before it arrived; TC_LD_003 compared names without collapsing a double space in the API
name. Nothing was submitted and the *Revert to Approval* icon was never clicked.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 65 | 56 | 56 | 54 | 46 | 8 | 0 | 2 | 6 | 3 |

## Defect candidates (need confirmation)

| # | Test | Finding | Steps | Severity |
|---|---|---|---|---|
| D1 | TC_LD_053 | An external appraiser's token reads the whole disbursal list (200, 18 loans) although the screen is closed to that user | EXT_APPRAISER1 token → `GET Disbursement/GetDisbursementViewData` | High |
| D2 | TC_LD_037 | Mode of Payment defaults to Cash: pressing Submit straight away submits a **cash** disbursal of the full amount | Open loan → Submit For Approval | High (HYPOTHESIS – confirm intended) |
| D3 | TC_LD_009 | 5 loans with sanctioned amount 0 are in the Approved list (GLNG0126100000007, 010, 011, 012, 013) | Show Loans | Medium |
| D4 | TC_LD_033–035 | Online with no bank name, no type of payment or no reference: Submit does nothing and shows no message | Bank → Online → leave a field empty → Submit | Medium |
| D5 | TC_LD_054 | The form scrolls sideways at tablet width (825 px wide at 768 px) | Resize to 768 px | Low |
| D6 | TC_LD_055 | Payout, dates, bank, payment type and reference fields have no accessible labels | Inspect | Low |

## Skipped (2)

| ID | Why |
|---|---|
| TC_LD_046 | No loan was waiting for Branch Head approval during the run |
| TC_LD_056 | Real submit – off by default (`ALLOW_DATA_CREATION=1`) |

## Not executed (6)

057 part / stage-wise (all loans are SINGLE PAYMENT) · 058 Top Up / broken interest (rules unknown) · 059 Add / Sync bank details
(writes the customer record) · 060 Revert to Approval (destructive) · 061 back-dated disbursal (date read-only; covered by the flow)
· 062 session / concurrency / Firefox-WebKit.

## N/A (3)

Delete (none – rejection is in the approval queue), upload (none), database (no access).

## What was simulated

Submit replies (success, network failure, 500) were simulated. They prove what the **screen** sends and shows. Server-side checks
on real data: list and loan data (002, 003, 012, 013), approval requirement (052), APIs without token (050, 051).
