# Coverage reconciliation – Gold Estimate Approval Queue

Generated 2026-10-15T12:47:04.065Z from test-results/results.json (last run) and reports/discovered.json.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 57 | 51 | 51 | 50 | 47 | 3 | 0 | 1 | 4 | 2 |

Passed + Failed + Blocked + Skipped + Not Executed + N/A = 57 (reconciles with Generated = 57).
Executed = Passed + Failed (a skipped test is not counted as executed).

## Per test case

| ID | Script | Discovered | Executed | Status | Expected verified | Reason / note |
|---|---|---|---|---|---|---|
| TC_EQ_001 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_002 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_003 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_004 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_005 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_006 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_007 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_008 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_009 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_010 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_011 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_012 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_013 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_014 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_015 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_016 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_017 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_018 | tests/functional/queue.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_019 | tests/functional/queue.spec.js | yes | yes | FAILED | no |  |
| TC_EQ_020 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_021 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_022 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_023 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_024 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_025 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_026 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_027 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_028 | tests/business-rules/ia2-verification.spec.js | yes | yes | FAILED | no |  |
| TC_EQ_029 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_030 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_031 | tests/business-rules/ia2-verification.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_032 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_033 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_034 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_035 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_036 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_037 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_038 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_039 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_040 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_041 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_042 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_043 | tests/business-rules/checker-approval.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_044 | tests/api/queue-api.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_045 | tests/api/queue-api.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_046 | tests/api/queue-api.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_047 | tests/api/queue-api.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_048 | tests/api/queue-api.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_049 | tests/regression/ui.spec.js | yes | yes | PASSED | yes |  |
| TC_EQ_050 | tests/regression/ui.spec.js | yes | yes | FAILED | no |  |
| TC_EQ_051 | tests/positive/real-chain.spec.js | yes | no | SKIPPED | no | ALLOW_DATA_CREATION=1 not set – creates a permanent estimate and pledge token |
| TC_EQ_052 | – | no | no | NOT EXECUTED | no | Appraise uses the Gold Estimates entry form (covered there); a real run needs a > ₹10 lakh estimate – Gold Flow Entry estimate-external covers it |
| TC_EQ_053 | – | no | no | NOT EXECUTED | no | No estimate needing ED/MD exists; needs article-limit configuration |
| TC_EQ_054 | – | no | no | NOT EXECUTED | no | Opens only after a real approval (TC_EQ_051 opt-in) |
| TC_EQ_055 | – | no | no | NOT EXECUTED | no | One checker account; idle time unknown; Chromium only |
| TC_EQ_NA1 | – | no | no | N/A | no | Queue only approves or reverts – estimates are created on Gold Estimates |
| TC_EQ_NA2 | – | no | no | N/A | no | No DB access; API and status history checked |