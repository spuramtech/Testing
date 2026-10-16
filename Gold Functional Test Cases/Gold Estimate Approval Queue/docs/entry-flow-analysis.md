# Entry-flow analysis – Gold Estimate Approval Queue

Sources: Gold Flow Entry `gold-estimate-approval.spec.js`, `gold-estimate-external.spec.js`, `gold-estimate-checker.spec.js`;
live discovery on **host214** on 15/10/2026 as CHECKER_BH, INT_APPRAISER1, INT_APPRAISER2, EXT_APPRAISER1 with every write
blocked (`utils/discover-queue.js`); the application's own (readable) Angular source for statuses, messages and request formats.

## 1. Queue – `#/Loans/GoldEstimateApprovalQueue`

Columns: GE NUMBER · CUSTOMER · MOBILE · ESTIMATE DATE · APPRAISAL VALUE · IMAGES · YOUR ROLE · STATUS · PLEDGE TOKEN · AGING · ACTION.
Search "Search GE number, customer, mobile or role..." · status filter (first option "All statuses (as Branch Head)" for every user).

| Who | Sees | Action |
|---|---|---|
| Branch Head (CHECKER_BH, `IsEligibleBranchHead` true) | every estimate of the branch (`GetGoldEstimateQueue`, 35 on 15/10) | **Review** when Ready for Approval, else **View** |
| Internal Appraiser 2 (priya) | `GetPendingInternalApprovalForUser` | **Verify** |
| External Appraiser 1 / 2 | `GetPendingExternal1/2ForUser` | **Appraise** (Gold Estimates entry form) |
| Maker (tryfinsta) | `GetPendingIaEntryForUser`, `GetPendingForMaker` | **Appraise** (re-entry after revert) |

Statuses: PENDING_IA_ENTRY "Awaiting Internal Appraiser" · PENDING_IA_APPROVAL "Awaiting Internal Appraiser 2 verification" ·
PENDING_IA_EDIT "Sent back to Internal Appraiser to edit" · PENDING_EXTERNAL_1/2 "Awaiting External Appraiser 1/2" ·
PENDING_CHECKER "Ready for Approval" · APPROVED "Approved" (pledge token `UID000nn`).

## 2. Internal Appraiser 2 – `#/Loans/GoldEstimateInternalApproval;id=<base64 GE>`

Shows the maker's entry (entered by, gross / net weight, rate/g, appraisal value, eligible loan, remarks, article table).
**Approve** → POST `ApproveInternalAppraisal {pGenumber, pInternalAppraiser2UserId, pAction:'APPROVE'}` immediately (no confirmation) →
"Entry verified. Routed to the next stage." · **Revert** → prompt "Remarks (required)" ("Explain why this entry is being sent back"),
Confirm Revert / Cancel; empty → "A remark is required to revert this entry."; sends `pAction:'REVERT', pRemarks` →
"Sent back to the Internal Appraiser to edit." · errors "Could not verify / revert this entry."

## 3. Branch Head – `#/Loans/GoldEstimateApprovalDetail;id=<base64 GE>`

Header: GE number, estimate date, customer, scheme, tenure, ROI, repayment type, appraisal value, appraisal stages required/completed,
LTV applied, eligible loan, status, main image; Appraisal Entries table; Status History (date, actor, by, action, remarks).
Actions only when `PENDING_CHECKER` **and** the user is not the maker **and** is Branch Head of the branch:
**Approve** → "Select the entry to approve as the final value" (radio per entry: role – appraiser, appraisal value / eligible loan;
single entry pre-selected) → Confirm Approve; none chosen → "Select which entry to approve as the final value." →
POST `ApproveGoldEstimate {pGenumber, pSelectedEntryId, pCheckeruserid}` → "Gold Estimate approved." + print tab `GoldPreviewreport` with the
token · **Revert** → note "This voids every entry … and restarts the whole estimate from Internal Appraisal", remarks required
("A remark is required to revert this Gold Estimate.") → POST `RevertGoldEstimate {pGenumber, pRemarks, pCheckeruserid}` →
"Gold Estimate reverted – every entry is voided and it restarts from Internal Appraisal." · ED/MD sign-off gate for restricted articles.

## 4. Live activity

Other users work on host214 at the same time: on 15/10 GE2610000032 was submitted 17:31, verified by priya 17:44:28 and approved by
Finsta Admin 17:44:45 (status history). The automation's sessions sent **no** write request at that time – every approve/revert call is a
POST (confirmed in the app source) and all POSTs were blocked and logged.
