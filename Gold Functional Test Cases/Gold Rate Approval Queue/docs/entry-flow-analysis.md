# Entry-flow analysis – Gold Rate Approval Queue

Source flow: `Gold Flow Entry/tests/gold-rate-approval.spec.js` (`npm run approval`). Analysed live on **host214** on 15/10/2026
(`utils/discover-approval-queue.js`, screenshots in `evidence/discovery/`). Every Approve / Reject during discovery was **blocked or
sent for a non-existent record** – no real submission was approved or rejected. No source code or written rules were available.

## 1. Access

| Item | Observed |
|---|---|
| Entry | Card **Gold Rate Approval** on Loans → Gold → Gold Loan Configuration ("Checker approval of the day's internal gold rates. Only users set as Gold Rate checkers can open it.") |
| URL | `#/Loans/GoldLoanConfiguration?open=GoldRateApprovalQueue` |
| Who | Users configured as Gold Rate checker (Form-wise Approvals > Gold Rate). `IsGoldRateChecker?userid` → `true` for admin (CHECKER_BH) |
| Non-checkers | tryfinsta, priya: card locked – "🔒 Only Gold Rate checkers (Form-wise Approvals > Gold Rate)"; click does nothing; direct URL shows no queue |

## 2. Screen

Header "DAILY GOLD RATE – Checker Approval Queue – Review rates submitted by makers before they go live. Each card is one day's
submission – approve or reject it as a whole." + "**N** submissions pending" + search box **"Search by maker or gold type..."**.

One card (`.grq-batch-card`) per day:

| Element | Observed |
|---|---|
| Date | `06 Jul 2026` (the Internal Rate date = next working day after the Online closing) |
| Maker | "Submitted by tryfinsta" |
| Approve All (n) | n = gold types (7); tooltip "Approves every gold type in this submission in one action"; **no confirmation** – one click sends the approval |
| Reject All | tooltip "Rejects every gold type in this submission in one action"; opens the Reject modal |
| Table | GOLD TYPE / RATE (PER GRAM): 24K, 22K, 21K, 20K, 19K, 18K, 14K |

Order: newest submission first (by `pVersionstamp`), not by rate date. Search matches maker and gold type (case-insensitive); not dates or rates.
Empty search result: "No gold rate submissions are waiting for you…".

### Reject modal (`#rejectGoldRateModal`)

"REJECT SUBMISSION – Reject Gold Rate – This rejects all 7 gold type(s) submitted for 06 Jul 2026, not just one." ·
**Remarks (required)** textarea (placeholder "Reason for rejection", no maxlength) · **Cancel** · **Confirm Reject**.
Empty or blank remarks → warning toast "Remarks are required to reject." Cancel closes it and clears the remarks.

## 3. API (host from `sessionStorage.apiURL`)

| Action | Call | Observed |
|---|---|---|
| Load | GET `loanmaster/GetPendingGoldRateApprovals` | 35 records (5 days × 7 types), each with `precordid`, `ptransdate`, `pgoldtype`, `pgoldrate`, `pstatus` PENDING, `pVersionstamp`, `pCreatedbyname` |
| Role | GET `loanmaster/IsGoldRateChecker?userid=` | `true` / `false` |
| Approve | POST `loanmaster/ApproveGoldRate` `{ precordid, pApprovedby, pItems:[{precordid,pVersionstamp}×7] }` | – |
| Reject | POST `loanmaster/RejectGoldRate` `{ precordid, pApprovedby, pRemarks, pItems:[…] }` | – |

Server answers seen (all **HTTP 200** with `success:false`):
* non-checker → "You are not configured as a Checker for Gold Rate on the Form-wise Approvals screen."
* unknown / outdated version → "This entry was already processed by someone else." (optimistic locking via `pVersionstamp`)
* reject without remarks → "A remark is required to reject a gold rate entry."
* **GET queue with a maker token → 200 with every pending record** (UI hides it, server does not).

## 4. Workflow

```
Maker saves Online rate (Daily Gold Rate) ─► Internal Rate for next working day = PENDING ─► this queue
   Checker: Approve All ─► APPROVED (rate goes live; Online row locks)
            Reject All + remarks ─► REJECTED
```

## 5. Pending data on host214 (15/10/2026)

06 Jul 2026, 02 Jun 2026, 09 Oct 2026, 10 Oct 2026, 14 Oct 2026 – all by tryfinsta. **02 Jun and 06 Jul are automation test data** from the
Daily Gold Rate build (online rates 01/06 and 04/07). `TC_GQ_044` can reject exactly these when you run it with `ALLOW_APPROVAL=1`.
