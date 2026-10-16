# Inventory Form – How to Run the Functional Tests

Run every command in **PowerShell** from the suite folder:

```powershell
cd "C:\Users\Admin\Desktop\Gold Module\Gold Functional Test Cases"
```

One-time setup: `npm install` then `npx playwright install chromium`. Logins from `Gold Module\.env`: **CHECKER_BH** (Branch Head,
main user), **INT_APPRAISER1** and **EXT_APPRAISER1** (access tests). Run **one test session at a time**.
Test IDs **TC_IF_001 – TC_IF_064** (67 cases, 59 automated).

## Commands

| Command | What it does | Time (approx.) |
|---|---|---|
| `npm run inventory` | All automated tests + report | 25 min |
| `npm run inventory:smoke` | 8 quick checks | 4 min |
| `npm run inventory:regression` | All @regression tests | 25 min |
| `npm run inventory:api` | API tests (TC_IF_052–055) | 2 min |
| `npm run inventory:headed` | All tests, browser visible | 25 min |
| `npm run inventory:report` | Rebuild and open `reports\QMetryReport.html` | seconds |
| `npm run inventory:discover` | Read-only re-scan of the screen | 1 min |

From the `Gold Module` folder use `npm run inventorytests`, `npm run inventorytests:smoke`, `npm run inventorytests:report`
(`npm run inventory` there is the Gold Flow Entry single-entry script, which **does** save a real inventory).

```powershell
npm run form -- "Inventory Form" --grep TC_IF_019                  # one test
npm run form -- "Inventory Form" --grep "TC_IF_013|TC_IF_016"      # several
npm run form -- "Inventory Form" tests/validation                  # one group
npm run form -- "Inventory Form" --grep TC_IF_019 --rerun          # rerun, keep the rest of the last result
```

Groups: `functional` (form lists, view) · `validation` (barcode scan) · `business-rules` (add, save) · `negative` (roles) · `api` ·
`regression` (UI) · `positive` (real save – opt-in).

## What the tests need from today's data

Most form tests need **one loan in the Inventory Form list that already has an unused BH barcode** (printed in Gold Packet Barcode
Generator). They find it automatically. If there is none, those tests are **skipped** with "no offered loan has an unused BH barcode
today" – print a barcode for an AUTOTEST loan first.

## How the tests avoid saving

Saving an inventory is **permanent** and uses up the barcode. The tests block every write after login. The packet photo upload and
the Save reply are **simulated**, so the screen can be checked through Add and Save without anything reaching the server.
TC_IF_053 sends one POST **without a token** for a loan that does not exist, to check the server refuses it.

## Real save (off by default)

TC_IF_059 saves a real inventory for an **AUTOTEST** loan that has an unused BH barcode, into an AUTOTEST vault, with a real photo.
TC_IF_060 then checks the loan left the list and is shown in View. This cannot be undone.

```powershell
$env:ALLOW_DATA_CREATION="1"; npm run form -- "Inventory Form" tests/positive --rerun; Remove-Item Env:ALLOW_DATA_CREATION
```

## Categories (TC_IF_…)

| Category | IDs |
|---|---|
| Navigation & UI layout | 001, 041, 048 |
| Default values & field state | 002, 008, 011 |
| Data consistency | 004, 006, 007, 042 |
| Dropdown & dependent fields | 003, 009, 010, 012 |
| Barcode scan validation | 013–017, 019, 021, 022 |
| Required field | 020, 023–027, 034 |
| Business rules | 005, 028, 044 |
| Duplicate prevention | 018, 043 |
| File upload (photo) | 029, 030, 063 |
| Add packet | 031 |
| Save payload & success | 032, 036 |
| Calculation | 033, 047 |
| Max length | 035 |
| Error recovery | 037, 038 |
| Double submit | 039 |
| Clear / Reset | 040 |
| Sorting & pagination | 045, 046 |
| Role-based access | 049, 050, 051 |
| API | 052–055 |
| Accessibility & responsive | 056, 057 |
| Create (real, opt-in) | 059, 060 |
| Not executed | 061 (partial packets), 062 (concurrency), 063 (camera), 064 (Firefox/WebKit), 058 (session timeout) |
| N/A | NA1 edit/delete, NA2 view search, NA3 database |

## Reports

`reports\QMetryReport.html` (filterable), `qmetry-import.csv`, `execution-results.json`, `reconciliation.md` – latest full run.
Screenshots: `test-results\artifacts\`.

## Common problems

| Message | What to do |
|---|---|
| Many tests skipped "no offered loan has an unused BH barcode today" | Print a BH barcode for an AUTOTEST loan in Gold Packet Barcode Generator |
| `locator.click: Timeout` on login | Server in `.env` down or slow – open it in a browser, rerun |
