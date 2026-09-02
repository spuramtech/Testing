# Finsta — Employees Module Automation

Self-contained Playwright + POM framework for Contact > Contact
Configuration > Employees, built from `EMPLOYEE_AUTOMATION_PROMPT.md`.
Independent of the `../Contact` framework (own `package.json`,
`node_modules`, config) — nothing here touches or depends on it.

## Setup
```bash
npm install
npx playwright install --with-deps
```
Fill in real credentials in `.env` if different from the defaults.

## Run
```bash
npm test                     # all 14 tests, all 3 browsers
npm run test:chromium        # chromium only
npm run test:smoke
npm run test:regression
```

## Verified live findings (see EMPLOYEE_AUTOMATION_PROMPT.md for the full list)
- Sidebar "Employees" link opens the **Add Employee form** directly
  (`#/Contact/ContactToEmployees`) — the list
  (`#/Contact/ContactToEmployeesView`) is reached only via the form's
  "View" link.
- The Employees grid is a real **Kendo Grid**, not the ngx-datatable used
  elsewhere in this app — different locator strategy required
  (`table tbody tr`, `.k-grid-norecords`, `.k-pager-*`).
- CTC only recalculates on **real keystroke events** — a plain
  `.fill()` leaves it stale; `pressSequentially` (real typing) is
  required, both in the app's own UX and in this framework.
- The sidebar's global search box and the Kendo grid's search box share
  the identical `search-k-cst` class — locators are scoped to the
  Kendo-specific `[kendotextbox]` attribute instead.
- The page carries several hidden modals (Designation/Role "add new"
  popups, an EMI calculator) that duplicate button text and even a whole
  second `<kendo-grid>` — every ambiguous locator is scoped to `:visible`.
- The "View" back-link itself reports as not `:visible` to Playwright
  (likely a zero-size wrapper around its visible inner `<span>`) even
  though it renders and is clickable — that one lookup omits `:visible`.

## Status
14/14 tests passing on Chromium (verified). Not yet run cross-browser —
run `npm test` for the full Chromium/Firefox/WebKit matrix.
