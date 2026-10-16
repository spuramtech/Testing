# Coverage-gap report – Gold Token

Run: host214, Chromium, 15/10/2026 – one clean full run (`npm run goldtoken`). Numbers: `reports/execution-results.json`.
**No loan was created** – tests used the simulated token UID99999 with every write blocked.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 46 | 41 | 41 | 40 | 34 | 6 | 0 | 1 | 3 | 2 |

## Defect candidates (need confirmation)

| ID | Test | Finding | Severity guess |
|---|---|---|---|
| DC-01 | TC_GT_030 | **Save with no amount is sent with `pAmountrequested: 0`** – a loan request for ₹0 reaches the server (also noted in the Gold Flow Entry script) | High |
| DC-02 | TC_GT_026 | **Amount "1000.50" becomes ₹1,00,050** – the decimal point is dropped, the amount is 100× larger | High |
| DC-03 | TC_GT_032 | Both nominees are sent as primary (`pisprimarynominee: true` for each) | Medium |
| DC-04 | TC_GT_033 | A failed save only says "Unknown Error" | Medium |
| DC-05 | TC_GT_020 | A nominee added by mistake cannot be removed (no delete/edit on the row) | Medium |
| DC-06 | TC_GT_040 | Nominee name, contact and proportion fields have no accessible names | Low |

## Confirmed behaviour (passed)

Token list = unused tokens from the API and the "New Tokens" count; appraisal values match estimates; Used Tokens tab; token overview,
member information and article pop-up come from the estimate; date read-only; nominee required, name + relationship required, proportion
≤ 100 and total = 100 %, duplicate nominee refused, nominee contact keeps digits only (letters typed are dropped), 60 % + 40 % accepted, KYC options and reference length; loan name / tenure / interest
from the scheme and locked; eligible amount; amount: letters and zero refused, separators shown, eligible − 1 accepted, equal to and above
eligible refused with the LTV message; save payload (token, contact, nominee, amount, tenure, rate, loan); one request on double-click;
Back keeps nominees; charges table; no-token API refusal; used token status.

## Skipped (1)

| Test | Reason |
|---|---|
| TC_GT_041 real loan | `ALLOW_DATA_CREATION=1` not set – creates a permanent loan (also needs an available AUTOTEST token) |

## Not executed (3) / N/A (2)

| Test | Reason |
|---|---|
| TC_GT_042 KYC upload | upload goes straight to the server; upload itself covered on Gold Estimates |
| TC_GT_043 back-dated token | covered by the Gold Flow Entry back-dated flow |
| TC_GT_044 concurrency / session / browser | would consume a real token; idle time unknown; Chromium only |
| TC_GT_NA1 / NA2 | tokens cannot be deleted; no DB access |
