# Coverage-gap report – Gold Rate Approval Queue

Run: host214, Chromium, 15/10/2026, real approve/reject OFF. Numbers: `reports/execution-results.json` (latest full run).

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 56 | 48 | 48 | 46 | 38 | 8 | 0 | 2 | 4 | 4 |

## Defect candidates (need confirmation)

| ID | Test | Finding | Severity guess |
|---|---|---|---|
| DC-01 | TC_GQ_038 | **Queue API returns all pending gold rates to a non-checker** (maker token → HTTP 200, 35 records). UI hides the screen, server does not | High (authorisation) |
| DC-02 | TC_GQ_029 | **Double-click on Approve All sends two approval requests** | Medium |
| DC-03 | TC_GQ_030 | **Double-click on Confirm Reject sends two reject requests** | Medium |
| DC-04 | TC_GQ_027 | Approve during a network failure: **no message at all** – user is not told it failed | Medium |
| DC-05 | TC_GQ_028 | Reject answered with HTTP 500: **no message**; modal stays open with remarks (retry possible) | Medium |
| DC-06 | TC_GQ_021 | Approve All approves a whole day **without any confirmation** (Reject has one) – HYPOTHESIS rule | Low–Medium (business to confirm) |
| DC-07 | TC_GQ_043 | Refused writes come back as **HTTP 200** with `success:false` (not 4xx) – HYPOTHESIS | Low |
| DC-08 | TC_GQ_047 | Remarks textarea and search box have **no accessible name** | Low |

Server-side protection that **works**: approve/reject by a non-checker is refused (TC_GQ_039/040), outdated versions are refused
("already processed by someone else", TC_GQ_041), reject without remarks is refused (TC_GQ_042), no token → 401 (TC_GQ_037).

## Skipped (2) – by design

| Test | Reason |
|---|---|
| TC_GQ_044 real reject | `ALLOW_APPROVAL=1` not set |
| TC_GQ_045 real approve | `ALLOW_APPROVAL=1` and `GQ_ALLOW_REAL_APPROVE=1` not set |

## Not executed (4) / N/A (4)

| Test | Reason |
|---|---|
| TC_GQ_049 self-approval | checker would have to create a gold rate (permanent data) |
| TC_GQ_050 two checkers at once | one checker account in `.env`; server rule covered by TC_GQ_041 |
| TC_GQ_051 session timeout | idle time unknown – manual |
| TC_GQ_052 Firefox / WebKit | supported, not run |
| TC_GQ_NA1–NA4 | no pager/sorting, no create/edit/delete, no date/dropdown/upload controls, no DB access |

## Notes

* Approve/Reject success and failure screens were tested with **simulated server responses** – they prove how the screen reacts,
  not what the real server returns on success. TC_GQ_044/045 cover the real path when switched on.
* The two automation test submissions (02 Jun 2026, 06 Jul 2026) are still pending. Running TC_GQ_044 with `ALLOW_APPROVAL=1`
  rejects exactly those.
