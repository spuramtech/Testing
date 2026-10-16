# Entry-flow analysis – Gold Scheme Matrix

Source flow: `Gold Flow Entry/tests/gold-scheme.spec.js` (`npm run scheme`, admin creates `AUTOTEST SCHEME …`). Analysed live on
**host214** on 15/10/2026 (`utils/discover-scheme-matrix.js`, screenshots in `evidence/discovery/`). Discovery ran with all writes
blocked, plus two real round-trips on throwaway schemes (AT-P3265, AT-P3689) that were deleted straight after.

## 1. Access

Loans → Gold → Gold Loan Configuration → card **Gold Scheme Matrix** ("Gold schemes: type (Bullet/Monthly), tenure, interest rate
and internal LTV"). URL `#/Loans/GoldLoanConfiguration?open=GoldSchemeMatrix`. Admin (CHECKER_BH) has access; tryfinsta / priya see
"🔒 No view permission in User Rights for GoldSchemeMatrix".

## 2. Grid

Company selector (BIJAY FINANCE AND INVESTMENT PVT LTD-HEAD OFFICE) · "Unified scheme matrix for this company – On" · **New Scheme**.
Kendo grid, 10 per page, sortable: **Scheme** (code + name) · **Tenure** ("9 mo") · **Type** (Bullet / Regular Monthly Repayment) ·
**Interest %** · **Paise/mo** · **Internal LTV by slab** (one value per included slab) · **Scheme on** (switch) · **Action** (✏ Edit, 🗑 Delete).
23 schemes on 15/10/2026 (5 GL-*, GLP, GL-MAX and 16 `AUTOTEST SCHEME` from the flow automation).

## 3. New / Edit panel (`#add-gold-scheme`)

| Field | Control | Observed rules |
|---|---|---|
| Loan (Loans Configuration) * | select `pLoanId` | "Select the loan…", Extra (PLE), New Gold (GLNG) – from `getloanlist` |
| Scheme Code | text `pSchemeCode` | no maxlength, any characters; **editable in Edit** |
| Scheme Name | text `pSchemeName` | no maxlength; Unicode accepted |
| Tenure (months) | text `pTenureMonths` | default 3; digits only; "-3"→"3"; **"1.5"→"15"**; 0 and 999 accepted in the field |
| Scheme Type | select `pSchemeType` | BULLET (default) / MONTHLY |
| Default Interest Rate % p.a. | text `pRateOfInterest` | default 0; 2 integer digits + 2 decimals; **"150"→"15"** |
| Apply to all slabs below | button | copies the default rate to every slab |
| Effective From | calendar (read-only input) | default today; past and future dates allowed |
| Status | radio Active / Inactive | default Active |
| Slab table | per LTV Slab Master range | Amount slab · RBI LTV (text) · Interest % (input) · Paise/mo (input) · Internal LTV · exclude/include button; **Add Slab** button |
| Clear / Save Scheme (New) · Update Scheme (Edit) | buttons | |

**Internal LTV** (verified on every existing scheme and in the form): Bullet = RBI LTV ÷ (1 + rate × tenure/12); Monthly = RBI LTV ÷ (1 + rate/12).
Paise/mo = rate ÷ 12 (3 decimals). Excluded slab → "Not offered" and not shown in the grid.

### Messages

| Trigger | Message |
|---|---|
| Missing loan / code / name | Warning – "Please fill all mandatory fields, including the aligned Loan" |
| Included slab rate 0 | Warning – "Every included slab needs an interest rate greater than 0" |
| Save OK | Success – "Scheme added successfully" |
| Update OK | Success – "Scheme updated successfully" |
| Switch off | Success – "Scheme disabled" |
| Save failed (network) | Error – "Unable to save scheme. Please contact support." |
| Delete | native confirm "Permanently delete scheme <code> (<name>) and its slab rates? This cannot be undone – use the "Scheme on" toggle instead…" → "Scheme <code> deleted." |

## 4. API (`api/loans/masters/goldschememaster/…`)

| Action | Call |
|---|---|
| Load | GET `getcompanylist`, `getloanlist`, `loanmaster/getltvslabmaster`, `getgoldschemeconfigurationlist?companyid`, `getresolvedgoldschemeltv?companyid` |
| Save / Update / Switch | POST `savegoldschemeconfiguration` `{ precordid (0 = new), pCompanyId, pLoanId, pSchemeCode, pSchemeName, pTenureMonths, pRateOfInterest, pPaisePerMonth, pEffectiveFrom, pStatus, pSchemeType }` → new id |
| Slab rates | POST `savegoldschemeslabrates` `{ pSchemeId, pRates:[{ pMinimumAmount, pMaximumAmount, pRateOfInterest, pPaisePerMonth, pStatus }] }` → `true` (excluded slab = INACTIVE) |
| Delete | POST `deletegoldschemeconfiguration` `{ pSchemeId, pCompanyId }` → `{ pIsDeleted, pMessage }` |

## 5. Observed during discovery (to be confirmed by tests)

* After **Update** (only tenure/name changed) the slab overrides were lost – the grid showed the default rate on every slab and the excluded slab came back.
* Existing data: **GL-FLEXI** stores Paise/mo 1.830 for 22 % (22/12 = 1.833); Paise/mo is shown with 2 or 3 decimals on different rows.
