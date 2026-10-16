# Coverage reconciliation – Gold Rate Approval Queue

Generated 2026-10-15T11:55:55.015Z from test-results/results.json (last run) and reports/discovered.json.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 56 | 48 | 48 | 46 | 38 | 8 | 0 | 2 | 4 | 4 |

Passed + Failed + Blocked + Skipped + Not Executed + N/A = 56 (reconciles with Generated = 56).
Executed = Passed + Failed (a skipped test is not counted as executed).

## Per test case

| ID | Script | Discovered | Executed | Status | Expected verified | Reason / note |
|---|---|---|---|---|---|---|
| TC_GQ_001 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_002 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_003 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_004 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_005 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_006 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_007 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_008 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_009 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_010 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_011 | tests/functional/queue-view.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_012 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_013 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_014 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_015 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_016 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_017 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_018 | tests/validation/reject-remarks.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_019 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_020 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_021 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_022 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_023 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_024 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_025 | tests/business-rules/approve-reject-rules.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_026 | tests/negative/failures.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_027 | tests/negative/failures.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_028 | tests/negative/failures.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_029 | tests/negative/failures.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_030 | tests/negative/failures.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_031 | tests/functional/roles.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_032 | tests/functional/roles.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_033 | tests/functional/roles.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_034 | tests/functional/roles.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_035 | tests/functional/roles.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_036 | tests/api/approval-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_037 | tests/api/approval-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_038 | tests/api/approval-api.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_039 | tests/api/approval-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_040 | tests/api/approval-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_041 | tests/api/approval-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_042 | tests/api/approval-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_043 | tests/api/approval-api.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_044 | tests/positive/real-approve-reject.spec.js | yes | no | SKIPPED | no | ALLOW_APPROVAL=1 not set – approving/rejecting changes the live Internal Rate for every user |
| TC_GQ_045 | tests/positive/real-approve-reject.spec.js | yes | no | SKIPPED | no | ALLOW_APPROVAL=1 not set – approving/rejecting changes the live Internal Rate for every user |
| TC_GQ_046 | tests/regression/ui.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_047 | tests/regression/ui.spec.js | yes | yes | FAILED | no |  |
| TC_GQ_048 | tests/regression/ui.spec.js | yes | yes | PASSED | yes |  |
| TC_GQ_049 | – | no | no | NOT EXECUTED | no | Needs the checker to create a gold rate (permanent data on host214) – run manually with approval |
| TC_GQ_050 | – | no | no | NOT EXECUTED | no | Only one checker account in .env; server behaviour covered by TC_GQ_041 and UI by TC_GQ_026 |
| TC_GQ_051 | – | no | no | NOT EXECUTED | no | Idle time before timeout unknown – manual test |
| TC_GQ_052 | – | no | no | NOT EXECUTED | no | Supported by config; only Chromium run |
| TC_GQ_NA1 | – | no | no | N/A | no | Queue has no pager or sortable columns (order covered by TC_GQ_005) |
| TC_GQ_NA2 | – | no | no | N/A | no | Approval screen only – records are created on Daily Gold Rate |
| TC_GQ_NA3 | – | no | no | N/A | no | Screen has none of these controls |
| TC_GQ_NA4 | – | no | no | N/A | no | No DB access; persistence checked through the API and Daily Gold Rate (TC_GQ_004, 025, 044) |