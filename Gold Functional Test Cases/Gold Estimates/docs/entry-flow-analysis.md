# Entry-flow analysis – Gold Estimates

Source flow: `Gold Flow Entry/tests/gold-estimate.spec.js` (`npm run estimate`). Analysed live on **host214** on 15/10/2026 as
INT_APPRAISER1 (`utils/discover-estimates.js`, screenshots in `evidence/discovery/`). The estimate save (`SaveMakerEntry`) was
**always blocked** – no estimate was created during discovery. The image upload was allowed once to reach the review dialog
(it only stores a file).

## 1. Screen – Loans → Gold → Gold Estimates (`#/Loans/GoldEstimates`)

| Section | Controls / behaviour |
|---|---|
| Header | **View** (`#/Loans/GoldEstimatesView`: Token Number, Customer Name, Mobile, Customer Type, Appraisal Value) · **My Saved Estimates** (`#/Loans/MyGoldEstimates`: GE number, image, customer, mobile, appraisal value, appraisals done/required, status, dates; actions View images / Open entry / Approval summary – **no cancel or delete**) |
| Customer Details | Contact Name – ng-select search by name / mobile / e-mail (`GetContactsList`) |
| Gold Details | Date (calendar only, default today, future disabled) · Loan Name (New Gold) · Scheme ("Not applied (use Loan Configuration)" + every ACTIVE effective scheme "<name> — <n> mo") |
| Gold Article Details | grid, 5 rows initially, a new row added automatically when the last is used, **Add Row**. Columns: Gold Purity (24K…18K, shows "₹ rate / g as of <date>"), Article Type (22 types; prohibited ones not offered), Quantity (2 digits), Gross Weight, Stone/Wastage, Stone Count (all max 10 chars), Net Weight, Purity Ded %, Pure Net Weight, Gold Rate, Total, Defects (Nil, Cut, Missing Stone, …), Images |
| Totals | Total Pure Net Weight · Total Quantity · Appraisal Value · Rate / Gram · LTV % Scheme · Eligible Loan Amount (LTV) (tooltip "Appraisal Value x Internal LTV % – what can actually be lent") |
| Attachments & Remarks | Upload Gold Articles Images (file → `contact/MultiFileUploads`) · Take Photo · Remarks (max 90) · Clear · Save |

## 2. Rules

* **Gold rate** = latest APPROVED internal rate (`getgoldrate`): on 15/10/2026 22K ₹13,839.39 "as of 13/10/2026" (the 14/10 rate was still pending).
* **Net weight** = (gross − stone) × (1 − wastage %); wastage by stone share of gross from the Stone Deduction master: <5 % → 0, 5–10 % → 1 %, 10–25 % → 2 %, 25–40 % → 5 %, ≥40 % → 8 %. Example: BANGLE 20 g, 1 g stone → 18.81 g.
* **Pure net** = net × (1 − purity deduction %) (Purity Deduction master, e.g. 20ct 9.1 %, 19ct 13.6 %).
* **Row total** = pure net × rate; **Appraisal value** = sum of rows.
* **LTV**: without a scheme "Not Configured" + warning "No LTV Slab configured for this appraisal amount on the selected loan … or apply a Scheme instead". With a scheme: LTV = the scheme's Internal LTV for the slab of the appraisal value; **Rate/Gram** = rate × LTV; **Eligible loan** = value × LTV (GL-quick, ₹1,38,393.90 → 80.57 % → ₹1,11,503.97).
* **Article limits**: per-person maximum quantity (e.g. Ankle Wear 5), prohibited types (Clips, Clocks, Cufflinks, Footwear, Garuda figures …).
* **Approval slabs** (`GetSlabConfigList`): 0–99,999 → 1 internal; 1L–5L → 2 internal; 5L–10L → 2 internal; 10L–15L → 2 internal + 1 external; …

## 3. Messages

| Trigger | Message |
|---|---|
| Save with no article | "Add Gold Article" |
| Save without image | "Please Upload Gold Articles Images" |
| Gross missing / 0 | "Gross weight is required." / "Gross weight Can Not Be Zero" |
| Stone > gross | "Stone/Wastage weight can not be greater than Gross weight" |
| Quantity 0 | "Please Start Number cannot be Zero" |
| Save failed | "Failed to save the gold estimate." |

## 4. Save

Save → dialog **Review Gold Estimate** ("Review your appraisal below before saving. Confirming submits it immediately and routes it to the
next step in the approval chain – nothing is saved until you confirm.") with customer, total gross/net, appraisal value, eligible loan,
rate/gram, article table, remarks · **Back to Edit** · **Confirm & Save** → POST `goldestimate/SaveMakerEntry`
`{ pMakeruserid, pLoantypeid, customer fields, image name/path, pInterestrate, pTenure, pSchemeid, pRemarks, pGrossweight, pNetweight,
pRategram, pEstimatedvalue (= eligible), pAppraisaldate, pArticles:[{ type, carat, weights, quantity, rate, value, stone, deductions, pGoldltv }] }`.
A saved estimate gets a GE number and is routed to the next approver (see Gold Estimate Approval Queue).

## 5. Observed oddities (tested)

Quantity "1.5" becomes "15"; quantity-0 message wording; remarks are auto-capitalised before sending
("automation probe" → "Automation Probe").
