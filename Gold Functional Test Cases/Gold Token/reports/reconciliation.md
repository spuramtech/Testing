# Coverage reconciliation – Gold Token

Generated 2026-10-15T13:23:20.010Z from test-results/results.json (last run) and reports/discovered.json.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 46 | 41 | 41 | 40 | 34 | 6 | 0 | 1 | 3 | 2 |

Passed + Failed + Blocked + Skipped + Not Executed + N/A = 46 (reconciles with Generated = 46).
Executed = Passed + Failed (a skipped test is not counted as executed).

## Per test case

| ID | Script | Discovered | Executed | Status | Expected verified | Reason / note |
|---|---|---|---|---|---|---|
| TC_GT_001 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_002 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_003 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_004 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_005 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_006 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_007 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_008 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_009 | tests/functional/tokens.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_010 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_011 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_012 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_013 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_014 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_015 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_016 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_017 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_018 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_019 | tests/validation/nominee.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_020 | tests/validation/nominee.spec.js | yes | yes | FAILED | no |  |
| TC_GT_021 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_022 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_023 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_024 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_025 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_026 | tests/business-rules/loan-details.spec.js | yes | yes | FAILED | no |  |
| TC_GT_027 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_028 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_029 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_030 | tests/business-rules/loan-details.spec.js | yes | yes | FAILED | no |  |
| TC_GT_031 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_032 | tests/business-rules/loan-details.spec.js | yes | yes | FAILED | no |  |
| TC_GT_033 | tests/business-rules/loan-details.spec.js | yes | yes | FAILED | no |  |
| TC_GT_034 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_035 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_036 | tests/business-rules/loan-details.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_037 | tests/api/token-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_038 | tests/api/token-api.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_039 | tests/regression/ui.spec.js | yes | yes | PASSED | yes |  |
| TC_GT_040 | tests/regression/ui.spec.js | yes | yes | FAILED | no |  |
| TC_GT_041 | tests/positive/real-loan.spec.js | yes | no | SKIPPED | no | ALLOW_DATA_CREATION=1 not set – creates a permanent gold loan |
| TC_GT_042 | – | no | no | NOT EXECUTED | no | Upload goes straight to the server (MultiFileUploads); not needed for the rules above – covered by Gold Estimates upload |
| TC_GT_043 | – | no | no | NOT EXECUTED | no | Covered by the Gold Flow Entry back-dated flow |
| TC_GT_044 | – | no | no | NOT EXECUTED | no | Would consume a real token; idle time unknown; Chromium only |
| TC_GT_NA1 | – | no | no | N/A | no | Tokens come from approved estimates; the screen has no delete |
| TC_GT_NA2 | – | no | no | N/A | no | No DB access |