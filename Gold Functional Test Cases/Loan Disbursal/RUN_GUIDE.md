# Loan Disbursal – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. Logins from `Gold Module\.env`: **INT_APPRAISER1**
(tryfinsta – maker, main user), **CHECKER_BH** and **EXT_APPRAISER1** (access tests). Run **one test session at a time**.
Test IDs **TC_LD_001 – TC_LD_062** (65 cases, 56 automated).

## Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run disbursal` | All automated tests + report | 20 min |
| `npm run disbursal:smoke` | 6 quick checks | 3 min |
| `npm run disbursal:regression` | All @regression tests | 20 min |
| `npm run disbursal:api` | API tests (TC_LD_050–053) | 2 min |
| `npm run disbursal:headed` | All tests, browser visible | 20 min |
| `npm run disbursal:report` | Rebuild and open `reports\QMetryReport.html` | seconds |
| `npm run disbursal:discover` | Read-only re-scan of the screen | 2 min |

From the `Gold Module` folder use `npm run disbursaltests`, `npm run disbursaltests:smoke`, `npm run disbursaltests:report`
(`npm run disbursal` there is the Gold Flow Entry single-entry script, which **does** submit a real disbursal).

```powershell
npm run form -- "Loan Disbursal" --grep TC_LD_038                  # one test
npm run form -- "Loan Disbursal" --grep "TC_LD_032|TC_LD_033"      # several
npm run form -- "Loan Disbursal" tests/validation                  # one group
npm run form -- "Loan Disbursal" --grep TC_LD_038 --rerun          # rerun, keep the rest of the last result
```

Groups: `functional` (list, loan details) · `validation` (payout) · `business-rules` (submit) · `negative` (roles) · `api` ·
`regression` (UI) · `positive` (real submit – opt-in).

## What the tests need from today's data

Form tests open an **AUTOTEST approved loan with a sanctioned amount above 0 and nothing waiting for approval**. They find it
automatically and are **skipped** when there is none ("no AUTOTEST approved loan …") – create one with the Gold Flow Entry flow up
to `npm run inventory`. TC_LD_046 needs a loan already waiting for Branch Head approval and is skipped otherwise.

## How the tests avoid submitting

Every write is blocked after login, and the Submit reply is **simulated** (success, network failure, error 500) so the screen can
be checked without a disbursal reaching the server. The *Revert to Approval* icon is never clicked. TC_LD_051 sends one POST
**without a token** for a loan that does not exist, to check the server refuses it.

## Real submit (off by default)

TC_LD_056 submits a real Online/NEFT disbursal of an AUTOTEST loan for Branch Head approval. It then waits in the Gold Disbursal
Approval Queue; it can only be removed there (reject).

```powershell
$env:ALLOW_DATA_CREATION="1"; npm run form -- "Loan Disbursal" tests/positive --rerun; Remove-Item Env:ALLOW_DATA_CREATION
```

## Categories (TC_LD_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001, 010 |
| Data consistency | 002, 003, 012, 013 |
| Filtering, search & pagination | 004–008 |
| Business rules | 009, 052 |
| Calculation & dates | 011, 014, 015, 040 |
| Read views | 016 |
| Mode of payment & dependent fields | 017–021 |
| Clear / Reset | 022 |
| Payout validation & boundaries | 023–029 |
| Max length | 030, 031 |
| Required field | 032–037 |
| Submit payload & success | 038, 039, 041, 042 |
| Error recovery | 043, 044 |
| Double submit & duplicate prevention | 045, 046 |
| Role-based access | 047, 048, 049 |
| API | 050, 051, 053 |
| Accessibility & responsive | 054, 055 |
| Submit (real, opt-in) | 056 |
| Not executed | 057 part/stage-wise, 058 top up / broken interest, 059 add/sync bank, 060 revert to approval, 061 back date, 062 session/concurrency/browser |
| N/A | NA1 delete, NA2 upload, NA3 database |

## Reports

`reports\QMetryReport.html` (filterable), `qmetry-import.csv`, `execution-results.json`, `reconciliation.md` – latest full run.
Screenshots: `test-results\artifacts\`.

## Common problems

| Message | What to do |
|---|---|
| Many tests skipped "no AUTOTEST approved loan …" | Every AUTOTEST loan is already submitted – run the Gold Flow Entry flow for a new loan |
| `locator.click: Timeout` on login | Server in `.env` down or slow – open it in a browser, rerun |
