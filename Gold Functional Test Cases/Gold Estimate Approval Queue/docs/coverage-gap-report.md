# Coverage-gap report – Gold Estimate Approval Queue

Run: host214, Chromium, 15/10/2026 – full run + rerun of TC_EQ_008, 012, 014, 042 after script fixes (row-load wait, own-estimate case).
Numbers: `reports/execution-results.json`. **No estimate was approved or reverted** – action tests used simulated estimates.

| Generated | Automated | Discovered | Executed | Passed | Failed | Blocked | Skipped | Not Executed | N/A |
|---|---|---|---|---|---|---|---|---|---|
| 57 | 51 | 51 | 50 | 47 | 3 | 0 | 1 | 4 | 2 |

## Defect candidates (need confirmation)

| ID | Test | Finding | Severity guess |
|---|---|---|---|
| DC-01 | TC_EQ_028 | Internal Appraiser 2's **Approve sends immediately with no confirmation** (Revert and the Branch Head approval both have a prompt) | Medium (business to confirm) |
| DC-02 | TC_EQ_019 | Status filter reads "All statuses **(as Branch Head)**" for users who are not Branch Head | Low |
| DC-03 | TC_EQ_050 | Search box and status filter have no accessible names | Low |

## Confirmed behaviour (passed)

Queue columns, 7-status filter, search by GE / customer / mobile, totals = API, pledge token only on Approved estimates, appraisal counts
and final values consistent, detail view (eligible = value × LTV = final approved value), status history order, role inboxes (IA2,
External 1, maker see only their own work), IA2 verify page, revert remarks required (UI) and cancel, revert / approve request formats
and messages, server refusal shown, one request per double-click, Branch Head entry choice (none pre-selected with 2 entries, auto with 1),
"Select which entry…" warning, approval request format and message, failure reported, checker revert warning and remarks, no Approve
on approved estimates, a Branch Head does not get Approve on an estimate they made (not listed), maker cannot verify own entry,
queue API refuses no token and an IA2 token, approve/revert APIs refuse a non-Branch-Head, unknown GE and empty remarks.

## Skipped (1)

| Test | Reason |
|---|---|
| TC_EQ_051 real chain | `ALLOW_DATA_CREATION=1` not set – creates a permanent estimate and pledge token |

## Not executed (4) / N/A (2)

| Test | Reason |
|---|---|
| TC_EQ_052 External Appraiser appraisal | entry form covered by Gold Estimates; real run needs a > ₹10 lakh estimate (Gold Flow Entry `estimate-external`) |
| TC_EQ_053 ED/MD sign-off | no estimate needs ED/MD |
| TC_EQ_054 token print tab | appears only after a real approval |
| TC_EQ_055 concurrency / session / browser | one checker account; idle time unknown; Chromium only |
| TC_EQ_NA1 / NA2 | queue has no create/edit/delete; no DB access |

## Notes

* Simulated estimates prove how the screens react and what they send; they do not prove the server's success behaviour – TC_EQ_051 covers that when switched on.
* Other users were working on host214 during discovery (GE2610000032 verified and approved at 17:44). The automation sent no write
  requests then – all approve/revert calls are POSTs (app source) and every POST was blocked and logged.
