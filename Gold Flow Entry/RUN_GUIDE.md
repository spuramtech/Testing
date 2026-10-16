# Gold Flow Entry – How to Run Each Form

Run all commands in **PowerShell** from either folder:

```
D:\Testing\Gold Module Automation Test  Cases\                   ← main folder
D:\Testing\Gold Module Automation Test  Cases\Gold Flow Entry\   ← automation folder
```

---

## 0. ONE contact → ONE loan → whole flow (recommended)

Every step now works **only on the data of the current flow** – stored in `test-data/current-flow.json`:

```
contact ──► GE number ──► token ──► LOAN NUMBER ──► BH barcode ──► inventory ──► Audit barcode ──► stock audit ──► disbursal ──► disbursal approval ──► scheduled jobs ──► loan receipt
```

* `npm run contact` **starts a new flow** (the previous one is archived to `test-data/flows/<flowId>.json`). The contact now also gets a **bank account** (needed by Loan Disbursal).
* Each later step reads the flow and **never uses another contact / estimate / loan**. If the flow's own record can't be used
  (e.g. not in the queue yet, sanctioned amount 0, already submitted), the step **fails or skips with a clear message** – it does not switch to other data.

| Command | What it does |
|---|---|
| `npm run flow` | Runs the whole chain for a **new contact** in order and stops at the first failure (10.5 g estimate, internal appraisers only) |
| `npm run flow:external` | Same, with a 120.5 g estimate so **External Appraiser 1** is included |
| `npm run flow -- --from=token` | **Resumes the same flow** from a step after you fix a problem (steps: contact, scheme, estimate, estimate-approval, estimate-external, estimate-checker, token, barcode (BH), vault, safe, inventory, barcode (Audit), stock-audit, disbursal, disbursal-approval, scheduled-jobs, loan-receipt) |

Single steps still work (`npm run token`, `npm run disbursal`, …) – they use the current flow too.

**Example – flow FLOW-1791959499152 on host214 (all PASSED):**

| Item | Value |
|---|---|
| Contact | AUTOTEST EIIJDJ QA – 9959488939 – UCIC 261000007 |
| Estimate | GE2610000018 → Approved |
| Token → Loan | UID00021 → **GLNG0126100000015**, sanctioned ₹93,000 |
| BH barcode → Inventory | BH2610000018 → AUTOTEST Strong Room 13764 / S5234 / locker 1 |
| Audit barcode → Stock audit | AUD2610000008 → Gold Audit Done |
| Disbursal | ₹93,000 Bank/Online/NEFT → **Approved & Disbursed** |

---

## 0b. Back-dated flow – dues in Loan Receipt

Use when Loan Receipt must show **instalment dues** (a loan disbursed today has nothing due until next month).

```powershell
$env:BACK_DATE="14/07/2026"; npm run flow          # dd/mm/yyyy, a working day (not Sunday)
Remove-Item Env:BACK_DATE
```

**How the app enables back dates** (found on host214): every date picker is limited to *today*, **except** the first forms of the chain.
A back date has to start at the gold rate and be carried through each form:

| # | Form | Date set to BACK_DATE | Why |
|---|---|---|---|
| 1 | Daily Gold Rate | Trans Date | rate for that day (re-used if it already exists) – the estimate is priced with it |
| 2 | Gold Scheme Matrix | **Effective From** | a scheme effective *today* is not offered on an estimate dated in the past |
| 3 | Gold Estimates | Date | estimate priced with the back-date gold rate |
| 4 | Gold Token | Date | enabled because the estimate carries the back date → loan number gets that month's series (e.g. **GLNG0126*07*0000001**) |
| 5 | Loan Disbursal | Disburse Date = BACK_DATE, **Installment Start = BACK_DATE + 1 month** | |
| 6 | **Scheduled Jobs** (admin) | Accrued Interest Job on every **month-end** (Type Non EMI) + Instalment Receivables on every **instalment date**, from disbursal to today | posts the dues per date |
| 7 | Loan Receipt | today | dues per **due date** (Receivables Detailed); the user **selects a due date** and pays everything up to it |

The back date is stored in `current-flow.json` (`backDate`), so `npm run flow -- --from=…` keeps using it.
Approval routing follows the app: an estimate under ₹1 lakh goes **straight to the Checker** (priya's step is then skipped automatically).

### Scheme → estimate → jobs → receipt (one scheme for the whole flow)

```powershell
$env:SCHEME_TYPE="Monthly"; $env:BACK_DATE="13/07/2026"; npm run flow
```

1. **Gold Scheme Matrix** creates the scheme (Effective From = back date) and stores code / name / type / tenure / rate in the flow.
2. **Gold Estimate** selects **exactly that scheme** (fails if it is not offered). **Gold Token** checks tenure and interest = the scheme.
3. **Scheduled Jobs** post accrued interest every month-end (gold schemes accrue month-end).
4. **Loan Receipt** checks every posted receivable against the scheme: *loan amount × rate × days / 365* (±₹2), then pays up to the selected due date.

| Scheme type | Posted dues (example, 18 %, back date 13/07/2026) |
|---|---|
| Bullet – ₹88,000 | 31/07 ₹781 · 31/08 ₹1,344 · 30/09 ₹1,301 + interest till date |
| Regular Monthly Repayment – ₹98,000 | 31/07 ₹869 · 31/08 ₹1,497 · 30/09 ₹1,449 + interest till date ₹676 + **Delayed Payment Charges ₹149** |

Receipt allocation (app): **interest till date → delayed payment charges → oldest instalment** – the test adds the charges when paying up to a due date.

### Back-dated Loan Receipt – date rules

| Rule | Detail |
|---|---|
| Calendar range | from the loan's **last receipt date** (or its disbursal date if none) up to today |
| Server rule | *"Receipt date cannot be before <date>: interest on this loan is already accrued / collected up to that date"* → a receipt must be dated **on/after the last Accrued Interest job date** |
| Dues | calculated **as of the Receipt Date** – Receivables Detailed shows the due dates up to it |

So the test dates the receipt on the **last accrued due date** (e.g. 30/09/2026) and pays everything due up to it.
To receipt an earlier due date, enter that receipt **before** running the later jobs.

**Verified:** loan GLNG0126070000004 (13/07/2026) → jobs to 30/09 → receipt **dated 30/09/2026** ₹3,426 (31/07 ₹781 + 31/08 ₹1,344 + 30/09 ₹1,301) → *Saved Successfully* → no dues left.

**Verified (host214, flow FLOW-1791961246398, BACK_DATE 14/07/2026):**

| Item | Value |
|---|---|
| Contact | AUTOTEST CCJHDD QA – 9961229733 |
| Gold rate 14/07/2026 | already existed → re-used (₹9,753.99 / g for 22K) |
| Estimate | GE2610000020 dated 14/07/2026 → appraisal ₹1,30,244.20 → routed to Checker → Approved |
| Token → Loan | UID00023 → **GLNG0126070000001**, Loan Application Date 14/07/2026, ₹87,000 |
| Packet | BH2610000020 → AUTOTEST Strong Room 86130 / S6224 / locker 1; Audit AUD2610000009 → audited |
| Disbursal | ₹86,876 net → Approved & Disbursed |
| Loan Receipt (14/10/2026) | **INSTALMENT DUE** shown (≈ 3 months interest) → final run paid the remaining **₹1,944** → balance **0** |

---

## 1. One-time setup

```powershell
cd "D:\Testing\Gold Module Automation Test  Cases\Gold Flow Entry"
npm install
npx playwright install chromium
```

## 2. URL and logins (`..\.env`)

All settings live in `D:\Testing\Gold Module Automation Test  Cases\.env`:

```
BASE_URL=https://qc.finsta.co.in/
INT_APPRAISER1_USER=tryfinsta      INT_APPRAISER1_PASSWORD=...
INT_APPRAISER2_USER=priya          INT_APPRAISER2_PASSWORD=...
EXT_APPRAISER1_USER=thangavel      EXT_APPRAISER1_PASSWORD=...
EXT_APPRAISER2_USER=chandrapriya   EXT_APPRAISER2_PASSWORD=...
CHECKER_BH_USER=admin@kapilit.com  CHECKER_BH_PASSWORD=...
```

* Change the URL permanently: edit `BASE_URL` in `.env` (keep the trailing `/`).
* Change it for one run only: `$env:BASE_URL="http://host214.kapilits.com:8411/"; npm run contact`

## 3. Command options

Every form has two commands:

| Command | What it does |
|---|---|
| `npm run <form>` | Runs in the background (headless) |
| `npm run <form>:headed` | Opens the browser so you can watch |
| `npm run report` | Opens the HTML report (screenshots, video and trace on failure) |

---

## 4. All forms – in run order

| # | Form (screen) | Command | Login | Needs first | Creates / output |
|---|---|---|---|---|---|
| 1 | Contact → Contact (New → Manual) | `npm run contact` | tryfinsta | – | New AUTOTEST contact (unique name, mobile, PAN) |
| 2 | Gold Loan Configuration → **Daily Gold Rate** | `npm run goldrate` | tryfinsta | – | Gold rate for a free date (24K auto) + Internal Rate sent for approval |
| 3 | Gold Loan Configuration → **Gold Rate Approval** | `npm run approval` | admin | #2 | Approves one pending gold-rate submission |
| 4 | Gold Loan Configuration → **Gold Scheme Matrix** | `npm run scheme` | admin | – | New active scheme `AUTOTEST SCHEME …` |
| 5 | Gold → **Gold Estimates** | `npm run estimate` | tryfinsta | #1, #4 | New GE number → routed to Internal Appraiser 2 |
| 6 | Gold → **Gold Estimate Approval Queue** (Verify) | `npm run estimate-approval` | priya | #5 | Internal Appraiser 2 verifies one estimate |
| 7 | Gold → **Gold Estimate Approval Queue** (Appraise) | `npm run estimate-external` | thangavel | #5 (≥ 120 g), #6 | External Appraiser 1 appraises one estimate |
| 8 | Gold → **Gold Estimate Approval Queue** (Review) | `npm run estimate-checker` | admin | #6 (or #7) | Final approval → estimate **Approved** |
| 9 | Gold → **Gold Token** | `npm run token` | tryfinsta | #8 | Gold loan created from one token (nominee + amount) |
| 10 | Gold → **Gold Packet Barcode Generator** | `npm run barcode` | admin | #9 / #13 | **2 barcodes per run**: BH (default selection) + Audit (clicks Audit) |
| 11 | Gold Loan Configuration → **Vault** | `npm run vault` | admin | – | New vault `AUTOTEST Strong Room …` |
| 12 | Gold Loan Configuration → **Safe & Lockers** | `npm run safe` | admin | #11 | New safe with 10 lockers in that vault |
| 13 | Gold → **Inventory Form** | `npm run inventory` | admin | BH barcode (#10), #12 | Loan packet bound to the barcode, stored in vault/safe/locker |
| 14 | Gold → **Gold Stock Audit** | `npm run stock-audit` | admin | Audit barcode (#10) | Articles audited → "Gold Audit Done" |
| 15 | Loan Management → **Loan Disbursal** | `npm run disbursal` | tryfinsta | #9 (approved loan), #13 | Disbursal submitted for Branch Head approval |
| 16 | Gold → **Gold Disbursal Approval Queue** | `npm run disbursal-approval` | admin | #15 | Disbursal approved & posted → status Approved & Disbursed |
| 16b | Jobs → **Scheduled Jobs** | `npm run jobs` | admin | #16 (disbursed) | Accrued Interest (month-ends) + Instalment Receivables (instalment dates) for the flow loan |
| 17 | Loan Management → **Loan Receipt** | `npm run receipt` | tryfinsta | #16 (loan disbursed) | Receipt saved (advance if nothing due yet) |

---

## 5. Full flows (copy and paste)

### A. Gold rate

```powershell
npm run goldrate      # tryfinsta submits today's rate
npm run approval      # admin approves it
```

### B. Estimate to loan – small estimate (Internal appraisers only)

```powershell
npm run contact
npm run scheme
npm run estimate              # 10.5 g RING → about ₹1 lakh
npm run estimate-approval     # priya
npm run estimate-checker      # admin
npm run token                 # tryfinsta creates the gold loan
```

### C. Estimate to loan – large estimate (with External Appraiser)

An estimate only goes to External Appraiser 1 when its **Estimated Value is above ₹10 lakh** (about 120 g):

```powershell
$env:ESTIMATE_GROSS_WT=120.5; npm run estimate
npm run estimate-approval     # priya
npm run estimate-external     # thangavel
npm run estimate-checker      # admin
npm run token
Remove-Item Env:ESTIMATE_GROSS_WT
```

### D. Packet into the strong room (BH barcode → Inventory)

```powershell
npm run token
$env:BARCODE_TYPE="BH"; npm run barcode     # writes test-data\last-barcode.json
Remove-Item Env:BARCODE_TYPE
npm run vault                               # writes test-data\last-vault.json
npm run safe                                # writes test-data\last-safe.json
npm run inventory                           # reads both files
npm run disbursal                           # tryfinsta submits the disbursal for Branch Head approval
npm run disbursal-approval                  # admin: Approve & Disburse → Confirm Approve
```

### E. Stock audit (Audit barcode → Gold Stock Audit)

```powershell
npm run barcode          # Audit type (default) → writes test-data\last-audit-barcode.json
npm run stock-audit      # reads it
```

---

## 6. Options per form (set before the command)

Clear an option afterwards with `Remove-Item Env:NAME` (or open a new terminal).

| Form | Option | Example |
|---|---|---|
| goldrate | Fixed 24K rate | `$env:GOLD_RATE_24K=15300` |
| goldrate | Fixed date | `$env:GOLD_RATE_DATE="09/10/2026"` |
| goldrate | Login | `$env:GOLD_RATE_ROLE="CHECKER_BH"` |
| approval | Specific day | `$env:APPROVE_DATE="12 Oct 2026"` |
| estimate | Contact / scheme | `$env:ESTIMATE_CONTACT="AUTOTEST GDBHCJ"`, `$env:ESTIMATE_SCHEME="GL-quick"` |
| estimate | Weight / article | `$env:ESTIMATE_GROSS_WT=120.5`, `$env:ESTIMATE_ARTICLE="NECKLACE"` |
| estimate-approval / external / checker | Specific GE | `$env:GE_NUMBER="GE2610000018"` |
| estimate-external | Appraiser's weight | `$env:EXT_GROSS_WT=120.3` |
| estimate-checker | Record to select in the *Approve Gold Estimate* popup | `$env:FINAL_ENTRY="lowest"` (default) · `"highest"` · `"random"` · `"1"` / `"2"` (position) · `"thangavel"` / `"External Appraiser"` (text) |
| token | Token / amount | `$env:TOKEN="UID00041"`, `$env:LOAN_AMOUNT=90000` |
| barcode | Only one type / loan | `$env:BARCODE_TYPE="BH"` or `"Audit"` (default: **both** – BH then Audit), `$env:LOAN_NUMBER="GLNG0126100000003"` |
| vault | Branch | `$env:VAULT_BRANCH="Kavuri Hub"` |
| safe | Vault | `$env:SAFE_VAULT="HO Strong Room 1"` |
| inventory | Locker | `$env:LOCKER_NO=3` |
| disbursal | Loan / mode / bank | `$env:LOAN_NUMBER="GLNG…"`, `$env:PAY_MODE="CASH"`, `$env:BANK_VIA="Cheque"`, `$env:PAYMENT_TYPE="IMPS"`, `$env:PAYOUT=50000` |
| disbursal-approval | Loan | `$env:LOAN_NUMBER="GLNG0126100000009"` |
| receipt | Receipt date / amount / mode | `$env:RECEIPT_DATE="30/09/2026"` or `"TODAY"` (default: the **last accrued due date** for a back-dated loan), `$env:RECEIPT_AMOUNT=1000`, `$env:RECEIPT_MODE="BANK"`, `$env:LOAN_NUMBER="GLNG…"` |
| jobs | Dates / type | `$env:JOB_TYPE="EMI"`, `$env:JOB_RUN_MODE="Instalment Date"`, `$env:ACCRUAL_DATES="31/07/2026,31/08/2026"`, `$env:RECEIVABLE_DATES="14/08/2026"` |
| stock-audit | Loan / status | `$env:LOAN_NUMBER="GLNG…"`, `$env:AUDIT_STATUS="Damaged"` |

---

## 7. Hand-off files (one form's output → the next form's input)

Stored in `Gold Flow Entry\test-data\`:

| File | Written by | Read by |
|---|---|---|
| `last-barcode.json` | `barcode` (BH) | `inventory` (marks it **Used**) · `barcode` (Audit, to choose the packed loan) |
| `last-audit-barcode.json` | `barcode` (Audit) | `stock-audit` |
| `last-vault.json` | `vault` | `safe` |
| `last-safe.json` | `safe` | `inventory` |
| `last-disbursal.json` | `disbursal` | `disbursal` (skips loans already submitted, per URL) |

These files belong to the server in `BASE_URL`. After switching URL, run the flow again on the new server.

---

## 8. "Why was it skipped?"

A **skipped** test is not a failure. There was nothing suitable to work on, and the tests never touch real customers' data – only AUTOTEST data. Run the step before it, then try again:

| Skipped form | Reason | Fix |
|---|---|---|
| estimate-approval | No AUTOTEST estimate waiting for priya | `npm run estimate` |
| estimate-external | No AUTOTEST estimate waiting for thangavel | Flow C (120 g estimate) |
| estimate-checker | No AUTOTEST estimate "Ready for Approval" | `npm run estimate-approval` |
| approval | No gold-rate submission admin may approve (admin can't approve their own) | `npm run goldrate` (as tryfinsta) |
| token | No AUTOTEST token | `npm run estimate-checker` |
| barcode (BH) | No AUTOTEST loan waiting for a packet barcode | `npm run token` |
| barcode (Audit) | Every packed AUTOTEST loan reached its Audit limit (1 per article) | Flow D, then `npm run barcode` |
| inventory | Barcode already **Used** / no safe | `npm run token` → BH barcode; `npm run vault` → `npm run safe` |
| disbursal | Every AUTOTEST approved loan is already submitted for Branch Head approval (it stays in the *Approved* list, but **Submit For Approval** is disabled) or has sanctioned amount 0 | `npm run token` (new loan) |
| disbursal-approval | No AUTOTEST disbursal *Waiting for Approval* | `npm run disbursal` |
| stock-audit | No Audit barcode file | `npm run barcode` |
| stock-audit | **New build (host214, 14-Oct-2026):** menu *Gold Stock Audit* was replaced by **Gold Audit** – a workflow dashboard (auditor → custodian → Branch Head → Head Audit). The old single form is gone; the step is skipped until auditor / custodian / Head Audit logins are available | – |

---

## 9. Run several forms at once

```powershell
cd "D:\Testing\Gold Module Automation Test  Cases\Gold Flow Entry"
npx playwright test                                   # every test, one after another
npx playwright test tests/vault.spec.js tests/safe.spec.js
npx playwright test -g "TC_GOLDSCHEME_001"            # by test ID
```

Results: printed in the terminal, plus `npm run report` for screenshots, videos and traces.
Detailed manual test cases (steps, test data, expected results) are in [README.md](README.md).
