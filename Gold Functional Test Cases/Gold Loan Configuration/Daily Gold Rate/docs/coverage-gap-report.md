# Coverage-gap report – Daily Gold Rate

Final run: host214, Chromium, 14/10/2026, `ALLOW_DATA_CREATION` off. Numbers come from `reports/execution-results.json`.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 68 | 61 | 61 | 55 | 47 | 8 | 0 | 6 | 3 | 4 |

47 + 8 + 0 + 6 + 3 + 4 = 68 ✔. "Executed" counts only passed and failed tests.

## Defect candidates (need confirmation – not logged as confirmed defects)

| ID | Test | Finding | Evidence |
|---|---|---|---|
| DC-001 | TC_GR_004 | "Last 30 Days" lists 30 rows back to 09/09/2026 (35 days) – looks like "last 30 entries", not 30 days | report screenshot |
| DC-002 | TC_GR_009 | Search "13/10/2026" (a date shown in the grid) → "No records available." | screenshot |
| DC-003 | TC_GR_063 | Search "15175.60" (a rate shown in the grid) → no rows | screenshot |
| DC-004 | TC_GR_027 | Typing 0.01 in 24K gives **1** (leading 0 dropped, then decimal point lost) | screenshot |
| DC-005 | TC_GR_062 | Devanagari digits "१५०००" are accepted and shown as "१५,०००", but 22K/18K stay empty | screenshot |
| DC-006 | TC_GR_033 | Internal Rate "whichever is lower" shows the previous closing (B) even when the 30-day average (A) is lower; 10 of 30 rows differ (e.g. 14/10: A 15,098.22, B 15,175.60, rate 15,175.60) | screenshot – **confirm the rule with business** |
| DC-007 | TC_GR_035 | 09/10 and 08/10 are locked with the tooltip "…already Approved" although their derived Internal Rates (10/10, 09/10) are PENDING | screenshot |
| DC-008 | TC_GR_055 | Trans Date, 24K, 22K, 18K inputs have no programmatic label (accessibility) | – |
| DC-009 | TC_GR_041 (run 1) | **Double-clicking Save sends two saves**: 1st saved; 2nd answered "A rate entry … already exists for 06-07-2026". Two success toasts plus a warning shown | `evidence/run1-create/` |

## Skipped (6)

| Test | Reason |
|---|---|
| TC_GR_041, 042, 043, 044, 046 | `ALLOW_DATA_CREATION=1` not set – creating a back-dated rate can leave a permanent locked record (happened twice). TC_GR_041 ran once in run 1 (FAILED → DC-009); 042–046 never ran against a created record |
| TC_GR_056 | `ALLOW_APPROVAL=1` not set – approving changes the live rate for other users |

## Not executed (3) / N/A (4)

| Test | Reason |
|---|---|
| TC_GR_057 Session timeout | idle period unknown – manual |
| TC_GR_058 Concurrent saves | needs 2nd maker; creates uncleanable data |
| TC_GR_059 Firefox / WebKit | supported via `BROWSER`, not run |
| TC_GR_NA1–NA4 | no upload control, no free-text fields, no autocomplete on the form, no DB access |

## Gaps to close

1. A **disposable test date** (or a delete/reset API) is needed so create/update/delete can run on every build.
2. Business confirmation of REQ-15 (duplicate rule – TC_GR_039 passed: duplicate is rejected), REQ-20 (DC-006) and the Trans Date default (REQ-06).
3. Data left on host214 by this work: online rates **01/06/2026 ₹14,555.50** and **04/07/2026 ₹14,268.22** (locked; plus their Internal Rate submissions). They need removing by an admin/DB if unwanted.
