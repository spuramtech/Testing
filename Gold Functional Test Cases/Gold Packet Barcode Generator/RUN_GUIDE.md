# Gold Packet Barcode Generator – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. Logins from `Gold Module\.env`: **CHECKER_BH** (Branch Head,
main user), **INT_APPRAISER1** and **EXT_APPRAISER1** (access tests). Run **one test session at a time**.
Test IDs **TC_PB_001 – TC_PB_065** (69 cases, 61 automated).

## Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run barcode` | All automated tests + report | 15 min |
| `npm run barcode:smoke` | 6 quick checks | 3 min |
| `npm run barcode:regression` | All @regression tests | 15 min |
| `npm run barcode:api` | API tests (TC_PB_053–056) | 2 min |
| `npm run barcode:headed` | All tests, browser visible | 15 min |
| `npm run barcode:report` | Rebuild and open `reports\QMetryReport.html` | seconds |
| `npm run barcode:discover` | Read-only re-scan of the screen | 1 min |

From the `Gold Module` folder use `npm run barcodetests`, `npm run barcodetests:smoke`, `npm run barcodetests:report`
(`npm run barcode` there is the Gold Flow Entry single-entry script, which **does** create a real barcode).

```powershell
npm run form -- "Gold Packet Barcode Generator" --grep TC_PB_016                 # one test
npm run form -- "Gold Packet Barcode Generator" --grep "TC_PB_019|TC_PB_020"     # several
npm run form -- "Gold Packet Barcode Generator" tests/functional                 # one group
npm run form -- "Gold Packet Barcode Generator" --grep TC_PB_016 --rerun         # rerun, keep the rest of the last result
```

Groups: `functional` (generator, register) · `validation` (loan select) · `business-rules` (print, one-barcode rule) ·
`negative` (roles) · `api` · `regression` (UI) · `positive` (real – opt-in).

## How the tests avoid creating barcodes

A printed barcode is **permanent** – it can be cancelled but never deleted. So the tests block every write after login. Where a
test needs to see how the screen reacts to the server (success, failure, "loan already has an unused barcode"), the reply is
**simulated** (`mockWrite`), for example barcode `BH9999999999`. TC_PB_054 sends one POST **without a token** for a loan that does
not exist, to check the server refuses it.

## Real print and cancel (off by default)

TC_PB_060 prints a real BH barcode for an **AUTOTEST** loan; TC_PB_061 then cancels it. The cancelled record stays in the register.

```powershell
$env:ALLOW_DATA_CREATION="1"; npm run form -- "Gold Packet Barcode Generator" tests/positive --rerun; Remove-Item Env:ALLOW_DATA_CREATION
```

## Categories (TC_PB_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001, 026 |
| Default values & field state | 002, 003 |
| Data consistency | 004, 005, 027, 028 |
| Dropdown / autocomplete | 006, 007, 012, 029 |
| Required field & input validation | 008, 013, 014, 023, 045, 046 |
| Clear / Reset | 015 |
| Preview | 009, 010, 011 |
| Print payload & success | 016, 017, 018 |
| Error recovery | 019, 020, 049 |
| Double submit | 021 |
| Business rules (one barcode / packet) | 022, 025, 037, 039, 040, 041 |
| Duplicate prevention | 038 |
| Cancel barcode | 024, 044, 047, 048 |
| Filtering | 030, 031, 032 |
| Search | 033–036 |
| Sorting & pagination | 042, 043 |
| Role-based access | 050, 051, 052 |
| API | 053–056 |
| Accessibility & responsive | 057, 058, 059 |
| Create & cancel (real, opt-in) | 060, 061 |
| Not executed | 062 (Audit limit), 063 (used at inventory), 064 (print/scan), 065 (session/concurrency/browser) |
| N/A | NA1 edit/delete, NA2 field length, NA3 database, NA4 upload |

## Reports

`reports\QMetryReport.html` (filterable), `qmetry-import.csv`, `execution-results.json`, `reconciliation.md`. They show the latest
full run. Screenshots: `test-results\artifacts\`.

## Common problems

| Message | What to do |
|---|---|
| `locator.click: Timeout` on login | Server in `.env` down or slow – open it in a browser, rerun |
| Test skipped "no Not Used barcode" | No cancellable barcode today – expected, nothing to fix |
| Test skipped "already has an unused barcode" | Only the real test (060) – pick another AUTOTEST loan or cancel the old one |
