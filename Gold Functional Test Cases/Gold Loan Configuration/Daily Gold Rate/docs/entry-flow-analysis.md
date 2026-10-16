# Entry-flow analysis – Daily Gold Rate (Gold Rate Configuration)

Source of the flow: `Gold Flow Entry/tests/gold-rate.spec.js` (single-entry automation) and `gold-rate-approval.spec.js`.
Analysed on **host214** (`BASE_URL` in `.env`) on 14/10/2026 with live discovery (`utils/discover-gold-rate.js`, screenshots in `evidence/discovery/`).
No frontend/backend source code or written business rules were available; rules marked **HYPOTHESIS** come from observed behaviour or on-screen text only.

## 1. Navigation and access

| Item | Observed |
|---|---|
| Menu path | Loans → Gold → Gold Loan Configuration → card **Daily Gold Rate** (Gold Rate & Purity) |
| URL | `#/…GoldLoanConfiguration?open=GoldRateConfiguration` |
| Maker | `INT_APPRAISER1` (tryfinsta) – New, Edit, Delete; `IsGoldRateChecker` → `false` |
| Checker | `CHECKER_BH` (admin) – sees New, **no** Edit/Delete on rows; approves in **Gold Rate Approval** |
| Screen text | "Enter the 24K gold rate – every other carat is calculated automatically. Saved immediately, no Checker approval required." |

## 2. Screen: Online Rate tab (default)

| Control | Type | Behaviour |
|---|---|---|
| Search in all columns… | text | Kendo grid filter. Searching a date or a rate shown in the grid returned **0 rows** during discovery (defect candidate, TC_GR_009/063) |
| Date Range | ng-select | All, Today, YesterDay, Last 7 Days, **Last 30 Days** (default), This Month, Custom, Current Financial Year |
| PDF / Excel icons | img | Export of the grid |
| New | link | Opens the side panel |
| Grid | Kendo | Trans Date · 24K (99.9 %) · 22K (91.6 %) · 18K (75 %) · actions; **Average Rate** footer; pager "x – y of n items" |
| Row actions | icons | ✏ edit + 🗑 delete while the derived Internal Rate is not approved, else 🔒 with tooltip *"An Internal Rate derived from this closing is already Approved"* |

## 3. Side panel: Online Gold Rate Submission (New / Edit)

| Field | formcontrolname | Required | Rules observed |
|---|---|---|---|
| Loan Type | pLoantype | – | Read-only, "Gold Loan" |
| Trans Date | ptransdate | yes | **Read-only input**, ngx-bootstrap calendar only; default = previous working day (13/10 on 14/10 – HYPOTHESIS); today, future dates and Sundays disabled; past weekdays enabled even if a rate already exists |
| 24K Gold Rate (per gram) | pgoldrate[0] | yes | Input mask: digits only (letters, symbols, minus removed), max 5 integer digits, max 2 decimals, Indian thousand separators, leading 0 refused |
| 22K Gold Rate | pgoldrate[1] | auto | Read-only = round(24K × 0.916, 2) |
| 18K Gold Rate | pgoldrate[2] | auto | Read-only = round(24K × 0.75, 2) |
| Clear | button | – | Empties 24K/22K/18K, keeps date |
| Save / Update | button | – | Save in New, Update in Edit |

Info text: *"22K, 18K and 14K are calculated automatically from it, and every other carat takes the same rate as the nearest higher tier (21K/20K/19K = 22K's rate). Saves immediately (no Checker approval), and also submits the next working day's Internal Rate (this date's closing is its previous closing) for Checker approval."*

### Messages

| Trigger | Message |
|---|---|
| Save/Update with 24K empty or 0 | Warning – "Please enter the 24K Gold Rate – every other carat is derived from it." |
| Save OK | Success – "Online gold rate saved successfully." + Success – "Internal Rate for <next working day> (previous closing <date>) submitted for Checker approval." |
| Delete | Native confirm: "Permanently delete the Online Gold Rate entry for <date>? This cannot be undone." |
| Inactivity | "Session Timeout – You will be logged out in 30 seconds due to inactivity." (Stay Logged In / Logout / Login Again) |

## 4. API calls (host from `sessionStorage.apiURL`, Bearer token + `schema-name` header)

| Action | Endpoint |
|---|---|
| Load online grid | GET `api/loans/masters/loanmaster/getonlinegoldrateView?userid&branchid` |
| Load internal grid | GET `api/loans/masters/loanmaster/getgoldrateView?userid&branchid` |
| Role check | GET `api/loans/masters/loanmaster/IsGoldRateChecker?userid` |
| Manual-entry switch | GET `api/loans/masters/loanmaster/getcompanyfeatureconfig?companyid` (GOLD_RATE_MANUAL_ENTRY) |
| Save | POST `…/saveonlinegoldrate` `{ onlinegoldrates: [ one item per carat ] }` → `true` |
| Internal rate submission | POST `…/savegoldrateltv` `{ goldrateltvs: [...] }` dated next working day → `true` (sent together with Save) |

Payload carats observed: 24K, 22K, 21K, 20K, 19K (= 22K), 18K, … 14K (= 24K × 58.3 %).

## 5. Internal Rate tab

Columns: Date + status pill (PENDING / APPROVED) · 30 Days Average (A) · Previous Closing (B) · **Rate for Today (A)&(B), whichever is lower** (bold).
Observed 14-10-2026: A 15,098.22, B 15,175.60, rate **15,175.60** – the higher value, not the lower (defect candidate, TC_GR_033).

## 6. Workflow

```
Maker: New → Trans Date (past working day) → 24K → Save
   ├─ Online rate stored immediately (used by Gold Estimates)
   └─ Internal Rate for next working day → PENDING → Checker approves in Gold Rate Approval
          └─ once APPROVED the online row is locked (no edit / delete)
```

## 7. Data side-effects found during discovery

* 01/06/2026 – an online rate of **₹14,555.50** was created by the discovery round-trip. Its next-day Internal Rate (02/06/2026) was already approved, so the row locked immediately and **cannot be deleted from the UI**. The automated create test therefore only uses dates whose next-day Internal Rate is not approved, and deletes its own record at the end.
