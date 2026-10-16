# Gold Flow Entry – Automation

Playwright automation for Finsta QC (`https://qc.finsta.co.in/`).
Phase 1: **create a single Individual contact** (Manual entry) as Internal Appraiser 1 (`tryfinsta`).

## Setup (one time)

1. Install Node.js 18+.
2. Make sure `../.env` (in the parent folder) contains:
   ```
   BASE_URL=https://qc.finsta.co.in/
   INT_APPRAISER1_USER=tryfinsta
   INT_APPRAISER1_PASSWORD=<password>
   ```
3. In this folder run:
   ```
   npm install
   npx playwright install chromium
   ```

## Run

| Command | What it does |
|---|---|
| `npm run contact` | Creates one new contact (headless) and verifies it in the list |
| `npm run contact:headed` | Same, but you can watch the browser |
| `npm run report` | Opens the HTML report (screenshots, video/trace on failure) |

Every run creates a **new** contact with unique data (name `AUTOTEST <letters> QA`, mobile `9xxxxxxxxx`, dummy PAN).
The console prints the created contact, e.g.
`Created contact: AUTOTEST GDBHCJ QA | Mobile 9888631729 | PAN AQGPD1729B | UCIC 261000003`.
To change the data (address, DOB, gender…), edit [test-data/contact.js](test-data/contact.js).

## Structure

```
pages/LoginPage.js        login with any role from .env
pages/ContactPage.js      Contact form: navigation, Contact Info, Address, Documents, list search
test-data/contact.js      unique dummy data per run
tests/create-contact.spec.js   TC_CONTACT_001
playwright.config.js      Chromium, screenshots always, video/trace on failure
```

---

## Manual Test Case

**TC_CONTACT_001 – Create a single Individual contact (Manual)**

| Item | Detail |
|---|---|
| Module / Screen | Contact → Contact Configuration → Contact → New → Manual |
| Type / Scenario | Functional, E2E / Positive |
| Priority | High |
| Precondition | User `tryfinsta` (Internal Appraiser 1) is active; QC is reachable |
| Last automated result | **PASS** – 13-Oct-2026, contact UCIC 261000003 created and found in list |

**Test data (example – use new mobile/PAN each time)**

| Field | Value |
|---|---|
| Title / First / Last Name | Mr / AUTOTEST GDBHCJ / QA |
| Father First Name | RAMESH |
| Date of Birth | 15/06/1990 (Age auto = 36) |
| Gender | Male |
| Primary Contact Number | 9888631729 (unique) |
| Primary Email | autotest.631729@example.com |
| Address Type / Residence | Permanent Address / Owned |
| Address / Area / City | 12, Gandhi Street / Block 10 / Neyveli |
| Country / State / District / Pincode | India / Tamil Nadu / Cuddalore / 607801 |
| Document | PAN / FORM 60 → PAN CARD → AQGPD1729B (unique, valid format) |

**Steps**

1. Open `https://qc.finsta.co.in/`, enter User Name `tryfinsta` and password, click **Sign In** → Dashboard opens.
2. Left menu: click **Contact** → **Contact Configuration** → **Contact** → contact list opens.
3. Click **New ▾** → **Manual** → Contact Configuration form opens on the *Contact Info* tab.
4. Select Title **Mr**, enter First Name and Last Name.
5. Enter Father First Name.
6. Click Date of Birth → in calendar click the year header → select **1990** → **June** → **15**. Verify Age shows 36.
7. Gender: keep **Male**.
8. Enter Primary Contact Number and Primary Email ID. (KYC Date defaults to today.)
9. Click tab **Address Details**: select Address Type, Residence, enter Address, Area, City, select State and District, enter Pincode.
10. Click **Add** → address row appears in grid; select its radio (communication address).
11. Click tab **Documents**: Document Type **PAN / FORM 60**, Document Name **PAN CARD**, Reference Number = PAN → click **Add** → row appears.
12. Click **Save & Continue**.
13. Click **Contact** in the left menu → list page. Set search dropdown to **Phone Number**, type the mobile, press Enter.

**Expected results**

* Step 12: toast **"Saved Successfully"**.
* Step 13: one card shows the new name, mobile, PAN, address and a UCIC number.

**Validations observed while building (useful for negative tests)**

* Save without an address → *"Please complete ADDRESS section"* / *"Please add Address Details"*.
* Save without a KYC document → *"Please complete KYC section"*.

---

## TC_GOLDRATE_001 – Create one Daily Gold Rate entry

Run: `npm run goldrate` (or `npm run goldrate:headed`).

* **24K is generated automatically**: median of recent 24K rates in the grid ± up to ₹150. 22K / 18K are calculated by the app.
* **Trans Date**: uses the default date; if it already has a rate (app warns *"already exists … edit the existing entry"*),
  the test picks the most recent earlier date with no rate, skipping Sundays (disabled in the calendar).
* **Login**: tryfinsta (Internal Appraiser 1) by default.

Optional overrides (PowerShell): `$env:GOLD_RATE_24K=15300`, `$env:GOLD_RATE_DATE="09/10/2026"`, `$env:GOLD_RATE_ROLE="CHECKER_BH"`.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → Gold Loan Configuration → **Daily Gold Rate** → Online Rate |
| Role | Internal Appraiser 1 (`tryfinsta`) |
| Type / Scenario | Functional / Positive |
| Last automated result | **PASS** – 13-Oct-2026 as tryfinsta: 12/10/2026 taken → used 10/10/2026, 24K ₹15,143.90 → 22K ₹13,871.81, 18K ₹11,357.92 |

**Steps**

1. Log in as `tryfinsta`.
2. Left menu: **Loans** → **Gold** → **Gold Loan Configuration** → card **Daily Gold Rate**.
3. Note the dates already in the grid. On the **Online Rate** tab click **+ New** → side panel *Online Gold Rate Submission* opens.
4. Loan Type = *Gold Loan* (read-only). Trans Date defaults to the last working day; if that date is already in the grid,
   click Trans Date and pick an earlier date that is not in the grid (Sundays are disabled).
5. Enter 24K Gold Rate (Per Gram) close to recent rates, e.g. `15143.9`, press Tab.
6. Verify 22K = 24K × 0.916 and 18K = 24K × 0.75 (read-only, auto-calculated).
7. Click **Save**.

**Expected**

* Toast: *"Online gold rate saved successfully."* plus *"Internal Rate for <next working day> (previous closing <date>) submitted for Checker approval."*
* Grid shows a row for the chosen Trans Date with the 24K / 22K / 18K rates.

**Negative (observed)**: saving for a date that already has a rate → *"Gold Purity 24K (99.9% pure gold) already exists for <date>. Please edit the existing entry instead."*

---

## TC_GRAPPROVAL_001 / 002 – Gold Rate Approval (Checker Approval Queue)

Run: `npm run approval` (or `npm run approval:headed`). Approve a specific day: `$env:APPROVE_DATE="12 Oct 2026"; npm run approval`.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → Gold Loan Configuration → **Gold Rate Approval** |
| Access | Checker only – `admin@kapilit.com`. Makers (e.g. tryfinsta) cannot approve. |
| Rule | A user cannot approve/reject a submission they submitted or edited (*"You cannot approve a gold rate entry you submitted or edited yourself."*) |
| Last automated result | **PASS** – 13-Oct-2026: admin approved **10 Oct 2026** (submitted by tryfinsta). TC_002 PASS – tryfinsta has no approval action |

**TC_GRAPPROVAL_001 – Checker/BH approves one pending submission (Positive)**

1. Log in as `admin@kapilit.com`.
2. **Loans** → **Gold** → **Gold Loan Configuration** → card **Gold Rate Approval** → *Checker Approval Queue* (shows "N submissions pending").
3. Each card = one day's submission (date, *Submitted by*, 7 gold types 24K…14K with per-gram rates).
4. Pick a card submitted by **someone else** (its **Approve All (7)** is enabled), check the rates.
5. Click **Approve All (7)**.
6. Expected: toast *"Approved 7 gold rate entries for this date."*; the card disappears from the queue.

**TC_GRAPPROVAL_002 – Maker cannot approve (Negative / role)**

1. Log in as `tryfinsta` → Loans → Gold → Gold Loan Configuration.
2. Expected: Gold Rate Approval card says *"Only users set as Gold Rate checkers can open it"*; no Approve/Reject action is available.

**Negative (observed)**: on a card submitted by admin, Approve All / Reject All are disabled with the self-approval tooltip.

**Flow:** `npm run goldrate` (tryfinsta submits) → `npm run approval` (admin approves).

---

## TC_GOLDSCHEME_001 – Create one Gold Scheme (Gold Scheme Matrix)

Run: `npm run scheme` (or `npm run scheme:headed`). Data per run is unique – edit [test-data/scheme.js](test-data/scheme.js) to change it.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → Gold Loan Configuration → **Gold Scheme Matrix** → New Scheme |
| Role | admin (`admin@kapilit.com`) |
| Type / Scenario | Functional / Positive |
| Last automated result | **PASS** – 13-Oct-2026: *AT-33375 / AUTOTEST SCHEME 33375*, 9 mo, Bullet, 18% → 1.50 paise/mo, LTV 74.89% / 70.48% / 66.08% |

**Test data (example)**

| Field | Value |
|---|---|
| Loan (Loans Configuration) * | New Gold (GLNG) |
| Scheme Code / Name | AT-<5 digits> / AUTOTEST SCHEME <5 digits> (unique) |
| Tenure (months) | 9 |
| Scheme Type | Bullet |
| Default Interest Rate % p.a. | 18 → *Apply to all slabs below* |
| Effective From / Status | default (today) / Active |

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Gold Loan Configuration** → card **Gold Scheme Matrix**.
2. Click **+ New Scheme** → side panel *Gold Scheme Configuration* opens.
3. Select Loan, enter Scheme Code, Scheme Name, Tenure, select Scheme Type.
4. Enter Default Interest Rate, click **Apply to all slabs below**.
5. Verify every slab (0–2.5L, 2.5L–5L, 5L–Unlimited) shows the same Interest %, Paise/mo = rate ÷ 12, and Internal LTV recalculated (RBI LTV 85/80/75% read-only).
6. Keep Status **Active**, click **Save Scheme**.

**Expected**

* Toast *"Scheme added successfully"*.
* New row in the matrix: code, name, tenure, type, interest %, paise/mo, internal LTV by slab, *Scheme on* toggle on.

---

## TC_GOLDEST_001 – Create one Gold Estimate (tryfinsta)

Run: `npm run estimate` (or `npm run estimate:headed`).
Overrides (PowerShell): `$env:ESTIMATE_CONTACT="AUTOTEST GDBHCJ"`, `$env:ESTIMATE_SCHEME="GL-quick"`.

**Pre-requisites (created by the other tests):** an AUTOTEST contact (`npm run contact`), an approved gold rate (`npm run goldrate` → `npm run approval`),
and an AUTOTEST scheme (`npm run scheme`). The newest *AUTOTEST SCHEME* is selected automatically.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Estimates** (New Estimate) |
| Role | Internal Appraiser 1 (`tryfinsta`) |
| Type / Scenario | Functional, E2E / Positive |
| Last automated result | **PASS** – 13-Oct-2026: **GE2610000015** for *Autotest Cjbjge Qa*, scheme *AUTOTEST SCHEME 73819 — 9 mo*, RING 10.5 g (stone 0.5 g) → 10 g pure, appraisal ₹1,38,718.10; routed to Internal Appraiser 2 |

**Test data**

| Field | Value |
|---|---|
| Contact Name | first match for "AUTOTEST" |
| Loan Name / Scheme | New Gold (default) / newest AUTOTEST SCHEME |
| Gold Purity | 22K (default, rate shown "₹ / g as of <date>") |
| Article Type / Qty / Gross Wt / Stone-Wastage / Stone Count | RING / 1 / 10.5 / 0.5 / 0 |
| Image | test-data/gold-article.png |
| Remarks | "Automation estimate <timestamp>" |

**Steps**

1. Log in as `tryfinsta` → **Loans** → **Gold** → **Gold Estimates**.
2. Contact Name: type *AUTOTEST*, pick a contact → article grid appears.
3. Loan Name = New Gold; Scheme = AUTOTEST SCHEME … (a scheme is **required** – without it Save says *"No LTV Slab configured for this appraisal amount…"*).
4. Row 1: Article Type RING, Quantity 1, Gross Weight 10.5, Stone/Wastage 0.5, Stone Count 0.
5. Verify Net Weight 10.00, Totals: Pure Net Weight 10.00 g, Quantity 1, Appraisal Value = 10 × 22K rate.
6. Click the cloud icon next to *Upload Gold Articles Images*, choose an image (mandatory – otherwise *"Please Upload Gold Articles Images"*). Enter Remarks.
7. Click **Save** → **Review Gold Estimate** dialog (customer, weights, appraisal value, estimate value, rate/gram, image, article table).
8. Click **Confirm & Save**.

**Expected**: toast *"GE Number GE26xxxxxxxx - Estimate saved. Routed to Internal Appraiser 2 for verification."*

---

## TC_GEAPPROVAL_001 – Internal Appraiser 2 (priya) verifies one Gold Estimate

Run: `npm run estimate-approval` (or `:headed`). Specific estimate: `$env:GE_NUMBER="GE2610000017"; npm run estimate-approval`.
By default it verifies the **oldest AUTOTEST** estimate awaiting Internal Appraiser 2; if none, the test is **skipped** (run `npm run estimate` first).

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Estimate Approval Queue** → Verify → *Internal Appraiser Verification* |
| Role | Internal Appraiser 2 (`priya`) |
| Type / Scenario | Functional, workflow / Positive |
| Last automated result | **PASS** – 13-Oct-2026: GE2610000015 and GE2610000016 (Autotest Cjbjge Qa, entered by tryfinsta) verified → *"Entry verified. Routed to the next stage."* |

**Steps**

1. Log in as `priya` → **Loans** → **Gold** → **Gold Estimate Approval Queue**.
2. Grid: GE Number, Customer, Mobile, Highest value so far, Images, Your role, Status, Pledge token, Aging, Action.
   Find an estimate with status *Awaiting Internal Appraiser 2 verification*; click **Verify**.
3. *Internal Appraiser Verification* page: check Main image, GE number, Customer, **Entered by** (tryfinsta),
   Internal Appraiser's entry (gross 10.5 g, net 10 g, rate/g, estimated value), remarks and the article table.
4. Click **Approve**.

**Expected**: toast *"Entry verified. Routed to the next stage."*; app returns to the queue and the estimate is no longer awaiting Internal Appraiser 2
(next stage: External Appraiser 1).

**Other action:** **Revert** sends the estimate back to the Internal Appraiser (status *Sent back to Internal Appraiser*) – not automated yet.

---

## TC_GEEXT_001 – External Appraiser 1 (thangavel) appraises one Gold Estimate

Run: `npm run estimate-external` (or `:headed`). Specific estimate: `$env:GE_NUMBER="GE2610000018"`.

**Routing rule (Gold Loan Configuration → Estimate Approval Slabs)** – based on the **Estimated Value** (appraisal × scheme LTV), not the appraisal value:

| Estimated value | Internal appraisers | External appraisers |
|---|---|---|
| 0 – 99,999 | 1 | 0 |
| 1,00,000 – 10,00,000 | 2 | 0 → goes straight to Checker |
| 10,00,001 – 15,00,000 | 2 | 1 (External Appraiser 1) |
| 15,00,001 + | 2 | 2 |

So the estimate must be large enough. Full chain:
```
$env:ESTIMATE_GROSS_WT=120.5; npm run estimate   # tryfinsta – 120 g → estimated ≈ ₹11 lakh
npm run estimate-approval                         # priya (Internal Appraiser 2)
npm run estimate-external                         # thangavel (External Appraiser 1)
```

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Estimate Approval Queue** → Appraise → *Appraise GE Number: …* |
| Role | External Appraiser 1 (`thangavel`) |
| Last automated result | **PASS** – 13-Oct-2026: GE2610000018 (appraisal ₹16,64,617.20, estimated ₹10,99,979.05) appraised: NECKLACE 120.3 g, stone 0.6 g → 119.70 g pure, ₹16,60,455.66 → *"Estimate saved. Routed to Checker for approval."* |

**Steps**

1. Log in as `thangavel` → **Gold Estimate Approval Queue** (sidebar shows Gold Estimates / Approval Queue / My Gold Estimates).
2. Row with status *Awaiting External Appraiser 1* → click **Appraise**.
3. *Appraise GE Number* page: Contact, Loan Name, Scheme and the uploaded image are pre-filled; the article grid is **empty** (independent appraisal).
4. Enter own measurement: Article Type, Quantity, Gross Weight, Stone/Wastage, Stone Count → check Totals. Enter Remarks.
5. **Save** → *Review Gold Estimate* → **Confirm & Save**.

**Expected**: *"GE Number GE… - Estimate saved. Routed to Checker for approval."* (next: Checker / Branch Head → Ready for Approval).

---

## TC_GECHECKER_001 – Checker / Branch Head (admin) approves one Gold Estimate

Run: `npm run estimate-checker` (or `:headed`). Specific estimate: `$env:GE_NUMBER="GE2610000016"`.
Final value choice: default **lowest** appraisal entry; override `$env:FINAL_ENTRY="highest"` or `"External Appraiser"`.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Estimate Approval Queue** → Review → *Approval Detail* |
| Role | Checker / Branch Head (`admin@kapilit.com`) – sees *All statuses (as Branch Head)* |
| Last automated result | **PASS** – 13-Oct-2026: **GE2610000015** (1 entry, ₹1,03,885.99) and **GE2610000018** (tryfinsta ₹10,99,979.05 / thangavel ₹10,97,229.10 → lowest chosen) → *"Gold Estimate approved."*, status **Approved** |

**Steps**

1. Log in as admin → **Gold Estimate Approval Queue**; find a row with status **Ready for Approval** → click **Review**.
2. *Approval Detail*: check GE number, customer, scheme, tenure, ROI, repayment type, current highest value, LTV applied,
   **Eligible Loan Amount**, *Appraisal stages required/completed*, status, main image, the **Appraisal Entries** table
   (appraiser, role, gross/net wt, rate/g, estimated value, verification e.g. *Verified by priya*) and **Status History**.
3. Click **Approve** → popup *Approve Gold Estimate – Select the entry to approve as the final value* (one radio per appraiser entry).
4. Select the entry, click **Confirm Approve**.

**Expected**: toast *"Gold Estimate approved."*; in the queue the estimate's status is **Approved** (action *View*).

**Full chain**
```
$env:ESTIMATE_GROSS_WT=120.5; npm run estimate   # tryfinsta (Internal Appraiser)
npm run estimate-approval                         # priya (Internal Appraiser 2)
npm run estimate-external                         # thangavel (External Appraiser 1)
npm run estimate-checker                          # admin (Checker / BH) – final approval
```

---

## TC_GOLDTOKEN_001 – Generate a gold loan from one token (tryfinsta)

Run: `npm run token` (or `:headed`). Specific token: `$env:TOKEN="UID00041"`; amount: `$env:LOAN_AMOUNT=90000` (default 90% of estimate, rounded down to ₹1,000).

Each **approved** Gold Estimate becomes a token under *New Tokens*. If none is available the test is **skipped** (approve one with `npm run estimate-checker`).

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Token** (New Tokens / Used Tokens) |
| Role | Internal Appraiser 1 (`tryfinsta`) |
| Last automated result | **PASS** – 13-Oct-2026: token **UID00040** (Autotest Cjbjge Qa, estimate ₹1,03,885.99) → nominee LAKSHMI QA (Mother, 100%) → Amount Requested ₹93,000, 9 months @ 18% → *"Gold Loan Saved SuccessFully"*; token removed from New Tokens |

**Steps**

1. Log in as `tryfinsta` → **Loans** → **Gold** → **Gold Token** → *Available Gold Loan Tokens* (Token Number, Customer, Mobile, Type, Estimate value).
2. Select the **Generate** radio of a token → *Token Overview* (Date, Token Number, Estimate Value, Appraisal Value, Article Qty) and the **Member** tab open.
3. Member tab: check Member Information (name, contact, address, PAN). Nominee Details: Full Name, Relationship, Contact No., Proportional %.
   KYC Documents: ID Proof Type *PAN / FORM 60*, ID Proof *PAN CARD*, Reference Number, upload proof. Click **Add** → nominee row appears.
4. Click **Next** (without a nominee: *"Please add at least one Nominee before proceeding."*).
5. **Loan Details** tab: Loan Name (New Gold, read-only), Estimate Value, Interest Type (Diminishing), Scheme details; Tenure 9 months and Interest 18% p.a. come from the scheme (read-only).
   Enter **Amount Requested** (≤ estimate value). Review Charges & Fees.
6. Click **Save**.

**Expected**: toast *"Gold Loan Saved SuccessFully"*; the token leaves *New Tokens* (counted under *Used Tokens*).

---

## TC_GOLDBARCODE_001 – Admin generates a Gold Packet Barcode (hand-off to next form)

Run: `npm run barcode` (or `:headed`). Specific loan: `$env:LOAN_NUMBER="GLNG0126100000003"`.

**Hand-off:** the recorded barcode is written to **`test-data/last-barcode.json`** – the next form's test (e.g. Inventory Form) reads it:
```json
{ "barcode": "BH2610000009", "loanNumber": "GLNG0126100000003", "customer": "Autotest Cjbjge Qa", "type": "BH", "status": "Not Used", "newlyGenerated": true }
```
In code: `const { GoldBarcodePage } = require('../pages/GoldBarcodePage'); const bc = GoldBarcodePage.readHandOff();`

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Packet Barcode Generator** |
| Role | admin (Checker / BH) – Employee Name auto-filled *Finsta Admin* |
| Last automated result | **PASS** – 13-Oct-2026: GLNG0126100000002 already had unused **BH2610000008** (left as is); generated **BH2610000009** for **GLNG0126100000003** → *"Barcode BH2610000009 recorded for loan GLNG0126100000003. It can only be used once."* |

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Gold Packet Barcode Generator**.
2. Type **BH**; Loan Number = a loan *approved / disbursed and not yet packeted* (gold loans created via Gold Token).
3. Click **Generate barcode** → sticker **preview** ("Preview – not yet recorded"; branch, type, date, loan no).
4. Click **Print sticker** → barcode number is **assigned and recorded** (CODE128, 2 cm × 4 cm label); print dialog opens.

**Expected**: toast *"Barcode BH26xxxxxxxx recorded for loan GLNG… It can only be used once."*; page shows *Recorded sticker BH…* with *Print again*.

**Rules observed**

* Generate alone does **not** record anything – only *Print sticker* does.
* A loan stays in the list until it is packeted. Generating again for a loan with an unused barcode shows
  *"This loan already has an unused barcode"* (existing no. + date) with **Back** or **Cancel old barcode & generate new** (needs a reason).
  The automation always presses **Back** – it never cancels a barcode.

---

## TC_VAULT_001 – Create one Vault (admin)

Run: `npm run vault` (or `:headed`). Branch override: `$env:VAULT_BRANCH="Kavuri Hub"`.
Hand-off: the created vault is written to **`test-data/last-vault.json`** for the next form (Safe & Lockers) – `VaultPage.readHandOff()`.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → Gold Loan Configuration → **Vault & Safe → Vault** |
| Role | admin (`admin@kapilit.com`) |
| Last automated result | **PASS** – 13-Oct-2026: *AUTOTEST Strong Room 70617* / HEAD OFFICE / **ATV70617** → *"Save Successfully"*, row in grid |

**Test data**: Vault Name `AUTOTEST Strong Room <5 digits>` (max 250), Vault Branch `HEAD OFFICE` (max 250), Vault Code `ATV<5 digits>` (max 30) – unique per run.

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Gold Loan Configuration** → card **Vault** (grid: Vault Name, Vault Branch, Vault Code, edit / delete).
2. Click **+ New** → side panel *Vault Configuration*.
3. Enter Vault Name, Vault Branch, Vault Code.
4. Click **Save**.

**Expected**: toast *"Save Successfully"*; new row in the Vault grid.

---

## TC_SAFE_001 – Create one Safe with lockers (admin)

Run: `npm run safe` (or `:headed`). Uses the vault from **`test-data/last-vault.json`** (created by `npm run vault`); override `$env:SAFE_VAULT="HO Strong Room 1"`.
Hand-off: the created safe is written to **`test-data/last-safe.json`** – `SafePage.readHandOff()`.

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → Gold Loan Configuration → **Vault & Safe → Safe & Lockers** (*Safe Configuration*) |
| Role | admin (`admin@kapilit.com`) |
| Last automated result | **PASS** – 13-Oct-2026: vault *AUTOTEST Strong Room 26960* (HEAD OFFICE / ATV26960) → Safe **S2129**, lockers 1–10 → *"Save Successfully"*, row in grid |

**Test data**: Safe Number `S<4 digits>` (max 30, unique per run), Locker Start Number `1` (max 10), Number of Lockers `10` (max 2 digits).

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Gold Loan Configuration** → card **Safe & Lockers**
   (grid: Vault Name, Vault Branch, Vault Code, Safe Number, No of lockers).
2. Click **+ New** → side panel *Safe Configuration*.
3. Select **Vault Name** → Vault Branch and Vault Code fill automatically (read-only).
4. Enter Safe Number, Locker Start Number, Number of Lockers.
5. Click **Save**.

**Expected**: toast *"Save Successfully"*; new row with the vault, safe number and number of lockers.

**Order:** `npm run vault` → `npm run safe`

---

## TC_INVENTORY_001 – Inventory Form: pack the loan with the generated barcode (admin)

Run: `npm run inventory` (or `:headed`). Locker override: `$env:LOCKER_NO=3`.

**Uses hand-off data from earlier tests** – nothing to type:

| File | Written by | Used for |
|---|---|---|
| `test-data/last-barcode.json` | `npm run barcode` | Loan number + barcode to scan |
| `test-data/last-safe.json` | `npm run vault` → `npm run safe` | Vault / Safe to store the packet in |

After saving, `last-barcode.json` is marked `"status": "Used"` (a barcode is one-time). A rerun is then **skipped** until a new barcode exists
(`npm run token` → `npm run barcode`).

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Inventory Form** |
| Role | admin (`admin@kapilit.com`) |
| Last automated result | **PASS** – 13-Oct-2026: loan **GLNG0126100000002** (Mr. Autotest Cjbjge Qa, RING 10.5 g / 10 g) ← barcode **BH2610000008** ("Barcode valid – matches loan …"), stored in *AUTOTEST Strong Room 26960* (ATV26960) / safe **S8561** / locker **1** → *"Save Successfully"* |

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Inventory Form**.
2. Select Loan Type **Gold Loan**, Loan Application / Account No. = the loan from the barcode → Customer Name, Mobile, Loan No. and the
   collateral grid (Collateral, Gross Weight, Pure Net Weight, Packet No, Packet Photo) load.
3. Tick the collateral (header checkbox).
4. Type/scan the barcode into *Scan barcode here* and press **Enter** (or *Bind to Packet No*) → Barcode/Packet No is filled;
   toast *"Barcode valid – matches loan …"*.
5. Upload **Packet Photo (with barcode)**.
6. Select **Vault/Strong Room** → Vault Code fills; select **Safe Number** → **Locker Number** list (1…N) appears; pick a locker.
7. Click **Add** → the collateral row shows the Packet No and photo.
8. Enter Remarks, click **Save**.

**Expected**: toast *"Save Successfully"*.

**Full packet flow:** `npm run token` → `npm run barcode` → `npm run vault` → `npm run safe` → `npm run inventory`

---

## TC_GOLDBARCODE_001 – update: **Audit** type (now the default)

Run: `npm run barcode` → **Audit**.  BH (original packet barcode): `$env:BARCODE_TYPE="BH"; npm run barcode`.

| | BH | Audit |
|---|---|---|
| Loans listed | approved / disbursed, **not yet packeted** | **already have a packet in inventory** |
| Barcodes per loan | 1 unused at a time | several – up to the loan's **number of gold articles** |
| Barcode format | `BH26xxxxxxxx` | `AUD26xxxxxxxx` |
| Hand-off file | `test-data/last-barcode.json` (→ Inventory Form) | `test-data/last-audit-barcode.json` |

**Steps (Audit)**: Gold Packet Barcode Generator → Type **Audit** (hint *"Loans that already have a packet in inventory…"*) → Loan Number →
**Generate barcode** (preview shows *TYPE Audit*) → **Print sticker** → *"Barcode AUD… recorded for loan … It can only be used once."*

Prefers the loan packed by `npm run inventory`; when a loan's Audit limit is reached it moves on to the next AUTOTEST loan.

| Last automated result | **PASS** – 13-Oct-2026: GLNG0126100000002 → **AUD2610000002** (first run); limit then reached for that loan
(1 article) → next run recorded **AUD2610000003** for GLNG0126100000003 |
|---|---|

**Observations / possible defects**

* When the Audit limit is reached the API returns **409 CONFLICT** and the toast says only
  *"Could not record the barcode – nothing was printed. Detail: OK"* – the reason (limit reached) is not shown to the user. *(Low – usability)*
* GLNG0126100000003 is offered under **Audit** although the automation never packed it in the Inventory Form – verify whether it really has
  a packet in inventory. *(Needs check)*

---

## TC_GOLDSTOCKAUDIT_001 – Gold Stock Audit of one loan (admin)

Run: `npm run stock-audit` (or `:headed`). Uses the loan from the **Audit barcode** hand-off `test-data/last-audit-barcode.json`
(created by `npm run barcode`, type Audit). Overrides: `$env:LOAN_NUMBER="GLNG…"`, `$env:AUDIT_STATUS="Damaged"` (Verified / Not Verified / Damaged / Missing).

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Stock Audit** |
| Role | admin (`admin@kapilit.com`) |
| Last automated result | **PASS (saved)** – 13-Oct-2026: loan **GLNG0126100000003** (Audit barcode **AUD2610000003**), article #1 22K, G.WT 120.3 / N.WT 119.7 → *Verified* → *"Gold Audit Done"* |

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Gold Stock Audit**.
2. Audit Date = today (default). Select **Loan Application / Account No.** → article grid loads
   (S.No, Details of Article, Gold Purity, G.WT, N.WT, image, **Status**, **Comment**).
3. For each article choose Status (**Verified** / Not Verified / Damaged / Missing) and enter a comment (the Audit barcode no. for traceability).
4. Select **Investigation Executive**, enter **Over All Comments**.
5. Click **Save**.

**Expected**: toast *"Gold Audit Done"*.

**Observation (needs check):** the *Investigation Executive* list shows the **customer name** (*Autotest Cjbjge Qa*) instead of employees. *(Possible defect – Medium)*

**Audit chain:** `npm run inventory` → `npm run barcode` (Audit) → `npm run stock-audit`

---

## TC_GECHECKER_001 – update: popup record selection (works on qc and host214)

After **Approve**, the popup *Approve Gold Estimate – "Select the entry to approve as the final value"* lists one radio per appraisal record.
The test reads every record, **selects one** and clicks **Confirm Approve**.

| App version | Record text |
|---|---|
| qc.finsta.co.in | `Internal Appraiser - tryfinsta ₹ 1,03,885.99` |
| host214 | `Internal Appraiser - tryfinsta ₹ 1,38,393.9 / ₹ 1,03,643.19` (appraisal / eligible amount) |

Which record: `$env:FINAL_ENTRY` = `lowest` (default, by the last amount) · `highest` · `random` · `1`, `2`… (position) · any text in the record (`thangavel`, `External Appraiser`).

**Last result (host214)**: GE2610000010 → popup record *#1 Internal Appraiser – tryfinsta ₹1,38,393.9 / ₹1,03,643.19* selected → *"Gold Estimate approved."* → status **Approved**.

---

## TC_GOLDBARCODE_001 – update: **BH is the default** (matches the application)

The Gold Packet Barcode Generator opens with **Type = BH already selected**. The test now verifies that default
(BH radio checked, hint *"Loans approved / disbursed and not yet packeted"*) and generates the **BH** barcode without clicking the radio.
Audit only when asked: `$env:BARCODE_TYPE="Audit"; npm run barcode`.

**Last result (host214)**: BH default confirmed → **BH2610000011** recorded for loan **GLNG0126100000007** → saved to `test-data/last-barcode.json`.

---

## TC_DISBURSAL_001 – Loan Disbursal of one approved gold loan (tryfinsta)

Run: `npm run disbursal` (or `:headed`).
Overrides: `$env:LOAN_NUMBER="GLNG0126100000009"`, `$env:PAY_MODE="CASH"` (default BANK), `$env:BANK_VIA="Cheque"` (default Online),
`$env:PAYMENT_TYPE="IMPS"` (default NEFT), `$env:PAYOUT=50000` (default: full amount available).

**Loan choice:** the loan packed in the Inventory Form (`test-data/last-barcode.json`) – if its sanctioned amount is 0 it cannot be disbursed,
so the oldest AUTOTEST approved loan with a sanctioned amount is used.

| Item | Detail |
|---|---|
| Module / Screen | Loans → **Loan Management** → **Loan Disbursal** → Manual Disbursement → Approved |
| Role | Internal Appraiser 1 (`tryfinsta`) |
| Last automated result | **PASS** – 13-Oct-2026 (host214): **GLNG0126100000008** (Autotest Gahjjf Qa, sanctioned ₹1,03,643) → Bank / Online / HDFC BANK - 1504546546 / NEFT / ref AUTOTXN00031178 → payout ₹1,03,643 → *"Disbursal submitted for Branch Head approval."* |

**Steps**

1. Log in as `tryfinsta` → **Loans** → **Loan Management** → **Loan Disbursal**.
2. Branch *ALL* → click **Show Loans** → tab **Approved** lists the loans (Application No, Branch, Loan Type, Loan Name, Applicant, Contact, Sanctioned Amount).
   ⚠ The only icon in *Actions* is **Revert to Approval** – do not click it.
3. Click the **Application No** link → *Loan Disbursement* page (sanctioned amount, tenure 9, Diminishing, 18% p.a., Monthly payin,
   Only Interest, Disburse Date = today, Disbursed Type SINGLE PAYMENT, status Approved).
4. Mode of Payment: click **Bank** → choose **Online** → Bank Name **HDFC BANK - 1504546546** → Type of Payment **NEFT** → enter **Reference No**.
5. Borrower Bank Details: primary account is pre-selected.
6. Current Loan Payout Amount is **pre-filled with the full sanctioned amount** – leave it (Single Payment needs the full amount).
   Installment Start Date = next month. Check Amount Disbursed.
7. Click **Submit For Approval**.

**Expected**: toast *"Disbursal submitted for Branch Head approval."*

**Validations observed**

* Cash mode with negative cash balance → *"Insufficient Cash Balance"*.
* Bank mode without a company bank → *"Please Select Bank"*.
* Online without Type of Payment / Reference No → Submit does nothing (no message).

**Possible defects (needs developer check)**

* **Re-typing the same full amount** (e.g. clear and type `103643`) → *"In Single Payment mode, full sanctioned amount must be disbursed."*
  although the field shows 1,03,643.00 – the formatted value (with commas) seems to be compared as a number. *(Medium)*
* Online mode with Type of Payment / Reference No empty: **Submit gives no validation message at all**. *(Low – usability)*
* Loan **GLNG0126100000007** appears under *Approved* with **Sanctioned Amount 0** (cannot be disbursed). *(Needs check)*

**Update (TC_DISBURSAL_001):** a loan already *submitted for Branch Head approval* stays in the **Approved** list, but its
**Submit For Approval** button is **disabled**. The test now detects that, records the loan in `test-data/last-disbursal.json`
(per URL) and moves on to the next AUTOTEST loan. Last result (host214): GLNG0126100000008 skipped (already submitted) →
**GLNG0126100000009** ₹10,94,664 → *"Disbursal submitted for Branch Head approval."*

---

## TC_GOLDDISBAPPROVAL_001 – Branch Head approves & disburses one gold loan (admin)

Run: `npm run disbursal-approval` (or `:headed`). Specific loan: `$env:LOAN_NUMBER="GLNG0126100000009"`.
Default: oldest AUTOTEST disbursal *Waiting for Approval*; skipped if none (run `npm run disbursal` first).

| Item | Detail |
|---|---|
| Module / Screen | Loans → Gold → **Gold Disbursal Approval Queue** → Review → *Gold Disbursal Approval* |
| Role | admin (Branch Head) |
| Last automated result | **PASS** – 13-Oct-2026 (host214): **GLNG0126100000008** (Autotest Gahjjf Qa, ₹1,03,643, BANK – ONLINE, HDFC, ref AUTOTXN00031178) → *"Disbursal approved and posted."* → status **Approved & Disbursed** |

**Steps**

1. Log in as admin → **Loans** → **Gold** → **Gold Disbursal Approval Queue**.
2. Filters: **Branch Head queue** (or *My submissions*) and **Waiting for Approval** (Approved & Disbursed / Reverted / All). Search box: loan no, customer, mobile, branch or maker.
   Grid: Loan No, Customer, Mobile, Branch, Disbursal Amount, Mode, Entered By, Entered On, Status, Aging, Action.
3. Click **Review** → *Gold Disbursal Approval*: Loan No, Customer, Loan Name, Branch, Sanctioned Amount, Disbursal Amount (Net Payout), Status,
   Entered By; *Disbursal Details (as entered)*: Disbursal Date, Type, Tenure/ROI, Repayment, Mode of Payment, Bank, Cheque/Ref No, Customer Bank A/C,
   Charges Adjusted; History.
4. Click **Approve & Disburse** → popup *"Disburse ₹X to <customer> for loan <no>? The voucher is posted now and cannot be undone from here."*
5. Click **Confirm Approve**.

**Expected**: toast *"Disbursal approved and posted."*; queue status **Approved & Disbursed**.

**Full loan flow:** `npm run token` → `npm run barcode` → `npm run inventory` → `npm run disbursal` (tryfinsta) → `npm run disbursal-approval` (admin)

---

## TC_GOLDBARCODE_001 / 002 – update: one run generates **BH and Audit**

`npm run barcode` now runs two test cases, one after the other:

| Test | Type | How | Saved to |
|---|---|---|---|
| TC_GOLDBARCODE_001 | **BH** | default selection (verified, not clicked) | `test-data/last-barcode.json` → Inventory Form |
| TC_GOLDBARCODE_002 | **Audit** | clicks the **Audit** option | `test-data/last-audit-barcode.json` → Gold Stock Audit |

Each runs independently (one skipping or failing does not stop the other). Only one type: `$env:BARCODE_TYPE="BH"` or `"Audit"`.

**Last result (host214)**: 001 BH **skipped** – no AUTOTEST loan waiting for a packet barcode (only real customers' loans listed);
002 Audit **PASS** – **AUD2610000001** recorded for **GLNG0126100000010**.

---

## Investigation – why gold loans were created with **Sanctioned Amount 0** (host214)

**Affected:** GLNG0126100000007, …0010, …0011, …0012, …0013 (all created by `npm run token` before the fix). After the fix: **GLNG0126100000014 = ₹93,000** ✔.

**Root cause (proved by intercepting the Save request – nothing saved):**

| Amount Requested typed | Eligible Loan Amount (LTV) | What the app did | Sent to server |
|---|---|---|---|
| ₹1,24,000 (90 % of the *appraisal value* 1,38,393.9) | ₹1,03,643.19 | **silently cleared the box** → *"Amount Requested Required"* | – |
| (box empty) → Save | – | **no block, no message** | `"pAmountrequested": 0` → loan saved with 0 |
| ₹93,000 (≤ eligible) | ₹1,03,643.19 | kept | `"pAmountrequested": 93000` ✔ |

* The automation was using the wrong limit: host214's token list shows the **Appraisal Value**; the real limit is **Eligible Loan Amount (LTV)**
  (qc calls it *Estimate Value*). Asking for more → the app wiped the field → Save stored 0.
* Manually a user normally re-types after the field clears, so it rarely shows up by hand – but the app does allow it.

**Application defects (report to developers)**

1. **High** – Gold Token *Save* is allowed while *Amount Requested* is empty / shows "Amount Requested Required"; the loan is created with
   sanctioned amount **0** and later appears under Loan Disbursal → Approved (cannot be disbursed).
2. **Medium** – An amount above the Eligible Loan Amount is **silently cleared** instead of showing "Amount exceeds eligible loan amount ₹…".
3. **Low** – Gold Token *Used Tokens* "Loan Disburse Amount" shows 0 for every token (disbursed value, not sanctioned) – easy to misread.

**Automation fix (TC_GOLDTOKEN_001)**

* Requested amount = 90 % of **Eligible Loan Amount (LTV)** / Estimate Value (rounded down to ₹1,000), never the appraisal value.
* Waits for the Loan Details tab to finish loading (tenure / interest), then checks the box **still holds the amount** before Save.
* Captures the Save request and **fails the test if `pAmountrequested` ≠ the amount** – a 0-amount loan can no longer be created silently.

---

## TC_LOANRECEIPT_001 – Loan Receipt on the flow gold loan (tryfinsta)

Run: `npm run receipt` (or `:headed`). Uses the **current flow's loan** (`test-data/current-flow.json`); last step of `npm run flow`.
Overrides: `$env:LOAN_NUMBER="GLNG0126100000015"`, `$env:RECEIPT_AMOUNT=1000`, `$env:RECEIPT_MODE="BANK"` (default CASH).

| Item | Detail |
|---|---|
| Module / Screen | Loans → **Loan Management** → **Loan Receipt** |
| Role | Internal Appraiser 1 (`tryfinsta`) |
| Last automated result | **PASS** – 14-Oct-2026 (host214): **GLNG0126100000015** (Autotest Eiijdj Qa, 93,000.00 Dr, disbursed) → Cash, Total Receipt ₹1,000 → no instalment due yet → booked as **Advance 1,000.00** → *"Saved Successfully"* |

**Steps**

1. Log in as `tryfinsta` → **Loans** → **Loan Management** → **Loan Receipt**.
2. Branch *ALL*, Loan Type **Gold Loan** → **Show** (shows "N records").
3. **Loan Application / Account No.** = the flow loan → outstanding badge (e.g. *93,000.00 Dr*), Branch, Receipt Date (today),
   buttons *Recent Transactions / Loan Details / Receivables Detailed*.
4. Mode of Receipt: **Cash** (or Bank).
5. **Total Receipt** = amount → distributed over the Dues grid (Particulars, Amount Due, Waiver/Deduction, Amount Received, Balance Due);
   any excess shows as **Advance** (EMI Amount / Penalty-Charges / Advance summary).
6. Narration → **Save**.

**Expected**: toast *"Saved Successfully"*.

**Note:** a loan disbursed today has no instalment due until next month, so the receipt is an advance. The loan is only listed after it is
**disbursed** (Gold Disbursal Approval).

---

## Back-dated flow (BACK_DATE) – Loan Receipt with dues

`$env:BACK_DATE="14/07/2026"; npm run flow` – see RUN_GUIDE section **0b**.

Back date carried through: Daily Gold Rate (Trans Date) → Gold Scheme (**Effective From**) → Gold Estimate (Date) → Gold Token (Date)
→ Loan Disbursal (Disburse Date; Installment Start = +1 month). Loan Receipt (today) then shows **INSTALMENT DUE**; TC_LOANRECEIPT_001 pays the
**Grand Total due** and asserts **Balance Due = 0**.

**Observations**

* All date pickers are restricted to *today* for a fresh record (Token, Disbursal, Receipt); a back date is only accepted once the earlier
  records (gold rate / scheme / estimate) carry it.
* A scheme created *today* is not offered for a back-dated estimate (only schemes effective on that date are listed) – set Effective From.
* Back-dated gold loans get the series of that month (GLNG0126**07**…).

---

## TC_SCHEDJOBS_001 – Scheduled Jobs for the flow loan (admin)

Run: `npm run jobs` (part of `npm run flow`, after disbursal-approval). Only useful for a **back-dated** flow (`$env:BACK_DATE`).

| Job (Loans → Jobs → Scheduled Jobs) | Date(s) | Settings |
|---|---|---|
| **Accrued Interest Job** | every **month-end** from the disbursal date up to today (e.g. 31/07, 31/08, 30/09) | Type **Non EMI** – app note: *"Month-end date only. Gold schemes (Bullet / Monthly) accrue every month-end"* (Job Run Mode only for EMI) |
| **Instalment Receivables** | every **instalment date** (disbursal + n months: 14/08, 14/09, 14/10) | – |

Jobs run in date order. **Result (host214, loan GLNG0126070000002 disbursed 13/07/2026):** *"Accrued interest posted for 1 loan(s) as on 31/07/2026"* (also 31/08, 30/09);
Instalment Receivables: *"No instalment falls due on … (or it was already raised)"* (gold Only-Interest scheme).

## TC_LOANRECEIPT_001 – update: receipt **up to a selected due date**

After the jobs, Loan Receipt → Dues shows **INSTALMENT DUE** (+ *INTEREST TILL DATE*). Clicking INSTALMENT DUE opens **Receivables Detailed**
(Date, Principal Receivable, Interest Receivable, Amount, Amount Adjusted, Balance) – one row per due date.

The test reads that list, selects a due date (`$env:RECEIPT_UPTO`, default the oldest; `ALL` = everything), pays the dues up to it, saves, re-opens
the loan and asserts those due dates are **fully paid**.

**Result (host214, GLNG0126070000002):** due dates 31/07 ₹781, 31/08 ₹1,344, 30/09 ₹1,301 (+ interest till date ₹607).
Run 1 paid ₹781 → app applied ₹607 to *INTEREST TILL DATE* first and only ₹174 to 31/07 (31/07 left ₹607 → test failed correctly).
Run 2 paid ₹607 → **31/07 cleared**; due ₹3,252 → ₹2,645.

**Observations (to confirm with developers)**

* Receipt appropriation order: **INTEREST TILL DATE first**, then the oldest instalment – interest not yet due is collected before overdue
  instalments. *(Needs check)* The test now adds it so the selected due date is fully paid.
* In the receipt summary, interest-till-date is shown as **"Penalty / Charges"** – misleading label. *(Low)*

---

## Scheme-driven flow – Gold Scheme Matrix → Estimate → Jobs → Receipt

`$env:SCHEME_TYPE="Monthly"; $env:BACK_DATE="13/07/2026"; npm run flow` (default type Bullet).

* TC_GOLDSCHEME_001 stores the new scheme in `current-flow.json` (schemeCode, schemeName, schemeType, schemeTenure, schemeRate).
* TC_GOLDEST_001 selects **that scheme only**; TC_GOLDTOKEN_001 asserts the loan's **tenure / interest = scheme**.
* TC_LOANRECEIPT_001 step **"Instalments posted per scheme"**: for every month-end the Accrued Interest job ran, the posted receivable must equal
  *loan × scheme rate × days / 365* (±₹2).

**Verified (host214):** scheme AT-32076 (Regular Monthly Repayment, 9 mo, 18 %) → GE2610000022 → loan **GLNG0126070000003** ₹98,000 (13/07/2026)
→ "Loan terms match scheme" → jobs → receivables 31/07 ₹869 (exp. 870), 31/08 ₹1,497 (exp. 1,498), 30/09 ₹1,449 (exp. 1,450) ✔
→ Delayed Payment Charges ₹149 (monthly scheme only) → receipt up to 31/07 → cleared.

**Observation:** receipt allocation order is *interest till date → delayed payment charges → oldest instalment* (confirm with developers).

---

## Loan Receipt with a back date – findings (host214, GLNG0126070000004)

* The Receipt Date calendar opens from the loan's **last receipt date** (no receipt → disbursal date) to today. Loans …0002 / …0003 already had a
  receipt dated today, which is why only today was selectable there.
* Dues are calculated **as of the Receipt Date** (server call `ViewParticularsDetails … duestype=ASON`); *Receivables Detailed* follows it.
* Server rule on Save: **"Receipt date cannot be before 30-09-2026: interest on this loan is already accrued / collected up to that date."**
* TC_LOANRECEIPT_001 now dates the receipt on the **last accrued due date** and pays the dues as of that date → *Saved Successfully*, no dues left.

**Possible defects**

1. **High** – the Save rejection above (HTTP 400) is **not shown to the user**; Save just does nothing (message only in the browser console).
2. **Medium** – the Receipt Date calendar offers dates **before** the last accrued date that the server then refuses.
3. **Medium** – the **Dues grid is not refreshed** when the Receipt Date is changed (still shows today's dues, e.g. ₹4,033 while ₹781 is due as of
   31/07); only *Receivables Detailed* follows the date.

---

## npm run flow – fixes after the host214 update (14-Oct-2026)

| Where it stopped | Cause | Fix |
|---|---|---|
| estimate-checker | queue row columns shifted → status read from the wrong column ("Branch Head") | status / role found by their text |
| vault / safe | grid now has 2 pages – new record on page 2 | search the grid ("Search in all columns") before checking |
| stock-audit | menu **Gold Stock Audit → renamed "Gold Audit"**, now a workflow dashboard (auditor / custodian / BH / Head Audit) | step detects it and **skips** with a message; flow continues |
| sidebar clicks | menu already expanded / Dashboard overlay / two "Loans" labels | shared helper `utils/nav.js` |
| loan-receipt shown as SKIPPED although saved | `test.skip` in the last check step | replaced by a plain return |

Result: `npm run flow` (contact AUTOTEST EIDEFJ QA → loan **GLNG0126100000018**) runs to the end – stock-audit skipped (new Gold Audit), disbursal +
approval passed, receipt saved.
