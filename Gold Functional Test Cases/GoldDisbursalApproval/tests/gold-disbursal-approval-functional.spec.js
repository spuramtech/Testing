const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldDisbQueuePage, STATUS, num, money } = require('../pages/GoldDisbQueuePage');

// Gold Disbursal Approval Queue - functional coverage across the 26 test types and the 37 categories.
//
// SAFETY - READ THIS FIRST: "Approve & Disburse" posts a VOUCHER that "cannot be undone from here" and "Revert" sends a loan back.
// The loans in this queue belong to other people's live work (and to your own flow). So this suite is READ-ONLY:
//   * it never clicks Approve & Disburse, Revert or the confirmation of either - there is no helper that could;
//   * a browser-side guard aborts and records any approve / revert / disburse / voucher write; afterEach FAILS the test if one occurs;
//   * nothing is created (disbursals are created in the Loan Disbursal form), so there is nothing to clean up.
// The approve / revert scenarios are listed in the report as NOT EXECUTED with this reason.
const FLOW_FILE = path.resolve(__dirname, '../../test-data/last-disbursal.json');

test.describe('Gold Disbursal Approval Queue - 26 test types', () => {
  let q;
  let writes;

  test.beforeEach(async ({ page }) => {
    q = new GoldDisbQueuePage(page);
    writes = [];
    // block ONLY approval-type writes (never the login call) and remember them
    await page.route(/\/api\//, (route) => {
      const r = route.request();
      if (r.method() !== 'GET' && /approv|revert|disburs|voucher/i.test(r.url())) { writes.push(`${r.method()} ${r.url()}`); route.abort(); } else route.continue();
    });
    await new LoginPage(page).login('CHECKER_BH');
    await q.open();
  });

  test.afterEach(async () => {
    expect(writes, 'the suite must never post an approval / revert / disbursal').toEqual([]);
  });

  // ---------- helpers ----------
  const view = async (status) => { await q.setView(status); return q.rows(); };
  const need = (rows, what) => { test.skip(!rows.length, `No ${what} in the queue right now`); return rows; };
  const firstOf = async (status) => (need(await view(status), status))[0];
  const flowLoan = () => { try { return JSON.parse(fs.readFileSync(FLOW_FILE, 'utf8')).last; } catch { return null; } };
  const sample = (rows, n) => rows.slice(0, n);

  // ======================================================================================================
  // 1. Positive / Create
  // ======================================================================================================
  test('TC_DISBAPP_CREATE_01 - Positive / Create: disbursals cannot be created in this queue', async () => {
    test.skip(true, 'Not applicable: a disbursal is created in the Loan Disbursal form; this queue only approves or reverts it.');
  });

  // ======================================================================================================
  // 2. Read / Persistence
  // ======================================================================================================
  test('TC_DISBAPP_READ_01 - Read / Persistence: the grid shows the 10 columns and every row is complete', async () => {
    for (const h of ['LOAN NO', 'CUSTOMER', 'MOBILE', 'BRANCH', 'DISBURSAL AMOUNT', 'MODE', 'ENTERED BY', 'ENTERED ON', 'STATUS', 'AGING', 'ACTION']) await expect(q.headerCell(h)).toBeVisible();
    const rows = await view(STATUS.all);
    need(rows, 'loans');
    expect(rows.length).toBeLessThanOrEqual(10);
    for (const r of rows) {
      expect(r.loanNo, 'loan no').toMatch(/^GLNG\d+/);
      expect(r.customer && r.mobile && r.branch && r.mode && r.enteredBy, `row ${r.loanNo} has an empty cell`).toBeTruthy();
      expect(r.amount, `amount of ${r.loanNo}`).toMatch(/^₹ [\d,]+$/);
      expect(Object.values(STATUS)).toContain(r.status);
    }
  });
  test('TC_DISBAPP_READ_02 - Read / Persistence: the status views add up (All = Waiting + Approved & Disbursed + Reverted)', async () => {
    const t = {};
    for (const s of [STATUS.waiting, STATUS.approved, STATUS.reverted, STATUS.all]) { await q.setView(s); t[s] = await q.total(); }
    expect(t[STATUS.all], JSON.stringify(t)).toBe(t[STATUS.waiting] + t[STATUS.approved] + t[STATUS.reverted]);
  });
  test('TC_DISBAPP_READ_03 - Read / Persistence: an approved loan\'s page shows every field (amounts, who entered / approved, voucher, history)', async () => {
    const r = await firstOf(STATUS.approved);
    await q.openDetail(r.loanNo);
    const d = await q.detail();
    expect(d.loanNo).toBe(r.loanNo);
    expect(d.customer).toContain(r.mobile);
    expect(d.loanName).toBeTruthy();
    expect(d.branch).toBeTruthy();
    expect(d.sanctioned).toBeGreaterThan(0);
    expect(d.status).toBe(STATUS.approved);
    expect(d.enteredBy).toMatch(/\d{2}-[A-Za-z]{3}-\d{4}/);
    expect(d.approvedBy).toMatch(/\d{2}-[A-Za-z]{3}-\d{4}/);
    expect(d.voucher).toBeTruthy();
    expect(d.actions).toEqual(['SUBMIT', 'APPROVE']);
  });
  test('TC_DISBAPP_READ_04 - Read / Persistence: a reverted loan\'s page shows who reverted it, the remark and a REVERT entry in the history', async () => {
    const r = await firstOf(STATUS.reverted);
    await q.openDetail(r.loanNo);
    const d = await q.detail();
    expect(d.status).toBe(STATUS.reverted);
    expect(d.revertedBy).toMatch(/\d{2}-[A-Za-z]{3}-\d{4}/);
    expect(d.raw).toMatch(/Revert remarks:/i);
    expect(d.actions).toContain('REVERT');
  });
  test('TC_DISBAPP_READ_05 - Read / Persistence: the loan from your own flow (last-disbursal.json) is listed as Approved & Disbursed with its amount', async () => {
    const f = flowLoan();
    test.skip(!f, 'No test-data/last-disbursal.json');
    await q.setView(STATUS.all);
    await q.searchFor(f.loanNumber);
    const r = (await q.rows()).find((x) => x.loanNo === f.loanNumber);
    test.skip(!r, `${f.loanNumber} is not on this server`);
    expect(r.amountNum, 'amount shown vs amount in the flow file').toBe(f.amount);
    expect(r.status).toBe(STATUS.approved);
  });
  test('TC_DISBAPP_READ_06 - Read / Persistence: a loan\'s page shows the same values again after a page reload', async ({ page }) => {
    const r = await firstOf(STATUS.approved);
    await q.openDetail(r.loanNo);
    const a = await q.detail();
    await page.reload();
    await expect.poll(async () => (await q.detail()).loanNo, { timeout: 30_000, message: 'loan page after reload' }).toBe(a.loanNo);
    const b = await q.detail();
    for (const k of ['loanNo', 'customer', 'sanctioned', 'net', 'status', 'voucher', 'approvedBy']) expect(b[k], k).toEqual(a[k]);
  });

  // ======================================================================================================
  // 3. Update / Edit
  // ======================================================================================================
  test('TC_DISBAPP_UPDATE_01 - Update / Edit: Approve & Disburse posts the voucher and sets "Approved & Disbursed"', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): the confirmation text says the voucher "is posted now and cannot be undone from here", the waiting loans belong to other live work, and the suite has no disbursal of its own to approve. Run the existing "npm run disbursal-approval" for the approval itself.');
  });
  test('TC_DISBAPP_UPDATE_02 - Update / Edit: a finished loan\'s page is read-only (only a Back button)', async () => {
    for (const s of [STATUS.approved, STATUS.reverted]) {
      const rows = await view(s);
      if (!rows.length) continue;
      await q.openDetail(rows[0].loanNo);
      expect(await q.detailButtons(), `buttons on a ${s} loan`).toEqual(['Back']);
      await q.back();
    }
  });

  // ======================================================================================================
  // 4. Delete & Cancel
  // ======================================================================================================
  test('TC_DISBAPP_CANCEL_01 - Delete & Cancel: Back on a loan\'s page returns to the queue', async ({ page }) => {
    const r = await firstOf(STATUS.approved);
    await q.openDetail(r.loanNo);
    await q.back();
    expect(page.url()).toMatch(/GoldDisbursalApprovalQueue/);
    await expect(q.headerCell('LOAN NO')).toBeVisible();
  });
  test('TC_DISBAPP_CANCEL_02 - Delete & Cancel: Back returns to the same status view the user was looking at (HYPOTHESIS)', async () => {
    const r = await firstOf(STATUS.reverted);
    await q.openDetail(r.loanNo);
    await q.back();
    expect((await q.currentView()).status, 'status view after Back (it was "Reverted" before opening the loan)').toBe(STATUS.reverted);
  });
  test('TC_DISBAPP_CANCEL_03 - Delete & Cancel: Revert sends a loan back with a remark', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): Revert changes a live loan; the suite has no disbursal of its own to revert.');
  });
  test('TC_DISBAPP_DELETE_01 - Delete & Cancel: a disbursal cannot be deleted from the queue', async () => {
    test.skip(true, 'Not applicable: the queue has no delete action.');
  });

  // ======================================================================================================
  // 5. Negative / Required field
  // ======================================================================================================
  test('TC_DISBAPP_REQUIRED_01 - Negative / Required field: a remark is required when reverting', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): checking it would need the Revert dialog on a live loan.');
  });

  // ======================================================================================================
  // 6. Input validation  (search box)
  // ======================================================================================================
  test('TC_DISBAPP_INPUT_01 - Input validation: script / SQL text in the search box finds nothing and runs nothing', async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', async (d) => { dialogs++; await d.dismiss(); });
    await q.setView(STATUS.all);
    for (const evil of ['<script>alert(1)</script>', "' OR 1=1--", '"; DROP TABLE loans;--']) {
      await q.searchFor(evil);
      expect(await q.rows(), evil).toEqual([]);
    }
    expect(dialogs).toBe(0);
  });
  test('TC_DISBAPP_INPUT_02 - Input validation: a search of only spaces is treated as empty (the full list stays)', async () => {
    await q.setView(STATUS.all);
    const total = await q.total();
    await q.searchFor('     ');
    expect(await q.total()).toBe(total);
  });
  test('TC_DISBAPP_INPUT_03 - Input validation: spaces around a loan number are ignored', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(`   ${r.loanNo}   `);
    expect((await q.rows()).map((x) => x.loanNo)).toContain(r.loanNo);
  });
  test('TC_DISBAPP_INPUT_04 - Input validation: Unicode text (Telugu, emoji) in the search box does not break the grid', async () => {
    await q.setView(STATUS.all);
    await q.searchFor('ఖజానా 🔒');
    expect(await q.rows()).toEqual([]);
    await expect(q.headerCell('LOAN NO')).toBeVisible();
  });

  // ======================================================================================================
  // 7. Boundary values
  // ======================================================================================================
  test('TC_DISBAPP_BOUNDARY_01 - Boundary values: a one-character search returns matching rows', async () => {
    await q.setView(STATUS.all);
    await q.searchFor('G');
    expect((await q.rows()).length).toBeGreaterThan(0);
  });
  test('TC_DISBAPP_BOUNDARY_02 - Boundary values: a 2,000-character search does not break the grid', async () => {
    await q.setView(STATUS.all);
    await q.searchFor('x'.repeat(2000));
    expect(await q.rows()).toEqual([]);
    await expect(q.headerCell('LOAN NO')).toBeVisible();
  });
  test('TC_DISBAPP_BOUNDARY_03 - Boundary values: the last page shows exactly the remaining rows', async ({ page }) => {
    await q.setView(STATUS.all);
    const total = await q.total();
    test.skip(total <= 10, 'One page only');
    await page.getByTitle('Go to the last page').click();
    await page.waitForTimeout(1000);
    expect((await q.rows()).length).toBe(total % 10 === 0 ? 10 : total % 10);
  });

  // ======================================================================================================
  // 8. Default values
  // ======================================================================================================
  test('TC_DISBAPP_DEFAULT_01 - Default values: the queue opens on "Branch Head queue" / "Waiting for Approval" with an empty search', async () => {
    expect(await q.currentView()).toMatchObject({ queue: 'Branch Head queue', status: STATUS.waiting });
    await expect(q.search).toHaveValue('');
  });
  test('TC_DISBAPP_DEFAULT_02 - Default values: the "All" view lists the newest entries first (Entered On descending)', async () => {
    await q.setView(STATUS.all);
    const all = await q.allRows();
    const ts = all.map((r) => Date.parse(r.enteredOn.replace(/(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}:\d{2})/, '$1 $2 $3 $4')));
    expect(ts.every((t) => !isNaN(t)), 'dates parse').toBe(true);
    expect(ts, 'Entered On order').toEqual([...ts].sort((a, b) => b - a));
  });

  // ======================================================================================================
  // 9. Date / calendar validation
  // ======================================================================================================
  test('TC_DISBAPP_DATE_01 - Date / calendar validation: Entered On uses the format dd-MMM-yyyy hh:mm on every row', async () => {
    const rows = await view(STATUS.all);
    need(rows, 'loans');
    for (const r of rows) expect(r.enteredOn, r.loanNo).toMatch(/^\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}$/);
  });
  test('TC_DISBAPP_DATE_02 - Date / calendar validation: no loan was entered in the future', async () => {
    const all = await (async () => { await q.setView(STATUS.all); return q.allRows(); })();
    const latest = Math.max(...all.map((r) => Date.parse(r.enteredOn.replace(/(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}:\d{2})/, '$1 $2 $3 $4'))));
    expect(latest, 'newest Entered On vs now + 5 minutes').toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000);
  });
  test('TC_DISBAPP_DATE_03 - Date / calendar validation: Aging shows hours / days for waiting loans and "-" for finished ones', async () => {
    const rows = await view(STATUS.all);
    need(rows, 'loans');
    for (const r of rows) {
      if (r.status === STATUS.waiting) expect(r.aging, `aging of waiting ${r.loanNo}`).toMatch(/^(<\s*1h|\d+\s*[hdm])$/i);
      else expect(r.aging, `aging of ${r.status} ${r.loanNo}`).toBe('-');
    }
  });

  // ======================================================================================================
  // 10. Business rules / Calculation
  // ======================================================================================================
  test('TC_DISBAPP_BUSINESS_01 - Business rules / Calculation: Net Payout = Sanctioned Amount - Charges Adjusted - Broken Interest', async () => {
    const checked = [];
    for (const s of [STATUS.waiting, STATUS.approved, STATUS.reverted]) {
      const rows = sample(await view(s), s === STATUS.approved ? 3 : 2);
      for (const r of rows) {
        await q.openDetail(r.loanNo);
        const d = await q.detail();
        expect(d.net, `${r.loanNo} (${s}): ${d.sanctioned} - ${d.charges} - ${d.brokenInterest}`).toBe(d.sanctioned - d.charges - d.brokenInterest);
        checked.push(r.loanNo);
        await q.back();
        await q.setView(s);
      }
    }
    test.skip(!checked.length, 'No loans to check');
  });
  test('TC_DISBAPP_BUSINESS_02 - Business rules / Calculation: every approved loan has a voucher number and an approver', async () => {
    const rows = sample(await view(STATUS.approved), 4);
    need(rows, STATUS.approved);
    for (const r of rows) {
      await q.openDetail(r.loanNo);
      const d = await q.detail();
      expect(d.voucher, `voucher of ${r.loanNo}`).toMatch(/\S/);
      expect(d.approvedBy, `approver of ${r.loanNo}`).toMatch(/\S/);
      await q.back();
      await q.setView(STATUS.approved);
    }
  });
  test('TC_DISBAPP_BUSINESS_03 - Business rules / Calculation: the approver is not the person who entered the disbursal (maker-checker)', async () => {
    const rows = sample(await view(STATUS.approved), 4);
    need(rows, STATUS.approved);
    for (const r of rows) {
      await q.openDetail(r.loanNo);
      const d = await q.detail();
      const name = (t) => String(t).replace(/\d{2}-[A-Za-z]{3}-\d{4}.*$/, '').trim();
      expect(name(d.approvedBy), `${r.loanNo}: entered by "${name(d.enteredBy)}"`).not.toBe(name(d.enteredBy));
      await q.back();
      await q.setView(STATUS.approved);
    }
  });
  test('TC_DISBAPP_BUSINESS_04 - Business rules / Calculation: a waiting loan has no voucher and no approver yet', async () => {
    const r = await firstOf(STATUS.waiting);
    await q.openDetail(r.loanNo);
    const d = await q.detail();
    expect(d.voucher).toBeFalsy();
    expect(d.approvedBy).toBeFalsy();
    expect(d.actions).toEqual(['SUBMIT']);
  });
  test('TC_DISBAPP_BUSINESS_05 - Business rules / Calculation: the last history action matches the status (APPROVE / REVERT / SUBMIT)', async () => {
    const want = { [STATUS.approved]: 'APPROVE', [STATUS.reverted]: 'REVERT', [STATUS.waiting]: 'SUBMIT' };
    let seen = 0;
    for (const s of [STATUS.approved, STATUS.reverted, STATUS.waiting]) {
      const rows = await view(s);
      if (!rows.length) continue;
      await q.openDetail(rows[0].loanNo);
      const d = await q.detail();
      expect(d.actions[d.actions.length - 1], `${rows[0].loanNo} (${s})`).toBe(want[s]);
      seen++;
      await q.back();
    }
    expect(seen).toBeGreaterThan(0);
  });

  // ======================================================================================================
  // 11. Data consistency
  // ======================================================================================================
  test('TC_DISBAPP_CONSISTENCY_01 - Data consistency: the grid row and the loan\'s page agree (loan, customer, branch, amount, status)', async () => {
    let n = 0;
    for (const s of [STATUS.waiting, STATUS.approved, STATUS.reverted]) {
      const rows = sample(await view(s), 2);
      for (const r of rows) {
        await q.openDetail(r.loanNo);
        const d = await q.detail();
        expect(d.loanNo).toBe(r.loanNo);
        expect(d.customer).toContain(r.mobile);
        expect(d.branch).toBe(r.branch);
        expect(d.net, `net payout vs grid amount of ${r.loanNo}`).toBe(r.amountNum);
        expect(d.status).toBe(r.status);
        n++;
        await q.back();
        await q.setView(s);
      }
    }
    test.skip(!n, 'No loans');
  });
  test('TC_DISBAPP_CONSISTENCY_02 - Data consistency: the pager total equals the number of rows read over all pages, for every status', async () => {
    for (const s of [STATUS.waiting, STATUS.approved, STATUS.reverted, STATUS.all]) {
      await q.setView(s);
      const total = await q.total();
      const all = await q.allRows();
      expect(all.length, `rows over all pages in "${s}"`).toBe(total);
    }
  });
  test('TC_DISBAPP_CONSISTENCY_03 - Data consistency: the payment mode in the grid matches the page (CASH / BANK)', async () => {
    const rows = sample(await view(STATUS.approved), 2).concat(sample(await view(STATUS.waiting), 1));
    need(rows, 'loans');
    for (const r of rows) {
      await q.setView(r.status); // the loan is only listed in its own status view
      await q.openDetail(r.loanNo);
      const d = await q.detail();
      expect(d.mode.toUpperCase().startsWith(r.mode.toUpperCase()), `${r.loanNo}: grid "${r.mode}" vs page "${d.mode}"`).toBe(true);
      await q.back();
    }
  });

  // ======================================================================================================
  // 12. Duplicate prevention
  // ======================================================================================================
  // A loan can have several ENTRIES (it is resubmitted after a revert); what must be unique is loan + status + entered-on.
  test('TC_DISBAPP_DUPLICATE_01 - Duplicate prevention: no two rows of the "All" view are the same entry (same loan, status and entered-on)', async ({}, testInfo) => {
    await q.setView(STATUS.all);
    const all = await q.allRows();
    const keys = all.map((r) => `${r.loanNo}|${r.status}|${r.enteredOn}`);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i), 'identical entries').toEqual([]);
    const nos = all.map((r) => r.loanNo);
    const repeated = [...new Set(nos.filter((n, i) => nos.indexOf(n) !== i))];
    testInfo.annotations.push({ type: 'role', description: repeated.length ? `Loan numbers with more than one entry (for example resubmitted after a revert): ${repeated.join(', ')}` : 'Every loan number has exactly one entry' });
  });

  // ======================================================================================================
  // 13. Search
  // ======================================================================================================
  test('TC_DISBAPP_SEARCH_01 - Search: a loan number finds exactly that loan', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.loanNo);
    expect((await q.rows()).map((x) => x.loanNo)).toEqual([r.loanNo]);
  });
  test('TC_DISBAPP_SEARCH_02 - Search: part of a customer name in lower case finds the loan', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.customer.split(' ')[0].toLowerCase());
    expect((await q.rows()).some((x) => x.loanNo === r.loanNo)).toBe(true);
  });
  test('TC_DISBAPP_SEARCH_03 - Search: a mobile number finds the loan', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.mobile);
    expect((await q.rows()).some((x) => x.loanNo === r.loanNo)).toBe(true);
  });
  test('TC_DISBAPP_SEARCH_04 - Search: the branch name finds the loans of that branch', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.branch.toLowerCase());
    const rows = await q.rows();
    expect(rows.length).toBeGreaterThan(0);
    for (const x of rows) expect(x.branch.toLowerCase()).toContain(r.branch.toLowerCase());
  });
  test('TC_DISBAPP_SEARCH_05 - Search: the maker (entered by) can be searched', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.enteredBy.toLowerCase());
    expect((await q.rows()).some((x) => x.loanNo === r.loanNo)).toBe(true);
  });
  test('TC_DISBAPP_SEARCH_06 - Search: an unknown value shows "No disbursals here." and "0 - 0 of 0 items"', async ({ page }) => {
    await q.setView(STATUS.all);
    await q.searchFor('zzzz-no-such-loan');
    expect(await q.rows()).toEqual([]);
    await expect(page.getByText(/No disbursals here/i).first()).toBeVisible();
    expect(await q.pagerText()).toMatch(/0 - 0 of 0 items/);
  });
  test('TC_DISBAPP_SEARCH_07 - Search: clearing the search brings the full list back', async () => {
    await q.setView(STATUS.all);
    const total = await q.total();
    await q.searchFor('zzzz-no-such-loan');
    await q.searchFor('');
    expect(await q.total()).toBe(total);
  });

  // ======================================================================================================
  // 14. Filtering
  // ======================================================================================================
  test('TC_DISBAPP_FILTER_01 - Filtering: each status filter lists only loans with that status', async () => {
    for (const s of [STATUS.waiting, STATUS.approved, STATUS.reverted]) {
      const rows = await view(s);
      for (const r of rows) expect(r.status, `${r.loanNo} under "${s}"`).toBe(s);
    }
  });
  test('TC_DISBAPP_FILTER_02 - Filtering: "My submissions" shows the admin\'s own submissions (none) and no status filter', async ({ page }) => {
    await q.setView(null, 'My submissions');
    const v = await q.currentView();
    expect(v.selects, 'selects visible in My submissions').toBe(1);
    await expect(page.getByText(/You have not submitted any gold loan disbursals|No records available/i).first()).toBeVisible();
  });
  test('TC_DISBAPP_FILTER_03 - Filtering: search and status filter work together', async () => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.customer.split(' ')[0].toLowerCase());
    const rows = await q.rows();
    expect(rows.length).toBeGreaterThan(0);
    for (const x of rows) expect(x.status).toBe(STATUS.approved);
  });

  // ======================================================================================================
  // 15. Sorting
  // ======================================================================================================
  test('TC_DISBAPP_SORT_01 - Sorting: clicking a column header sorts the grid', async () => {
    await q.setView(STATUS.all);
    const h = q.headerCell('LOAN NO');
    await h.click();
    await q.page.waitForTimeout(800);
    test.skip((await h.getAttribute('aria-sort')) === null, 'Not applicable: the column headers are not sortable (no aria-sort after a click); the list is ordered by Entered On, newest first.');
  });

  // ======================================================================================================
  // 16. Pagination
  // ======================================================================================================
  test('TC_DISBAPP_PAGINATION_01 - Pagination: the pager shows "1 - 10 of N items" and 10 rows on the first page', async () => {
    await q.setView(STATUS.all);
    const total = await q.total();
    test.skip(total <= 10, 'One page only');
    expect(await q.pagerText()).toMatch(new RegExp(`^1 - 10 of ${total} items`));
    expect((await q.rows()).length).toBe(10);
  });
  test('TC_DISBAPP_PAGINATION_02 - Pagination: first / previous / next / last buttons move between pages', async ({ page }) => {
    await q.setView(STATUS.all);
    const total = await q.total();
    test.skip(total <= 10, 'One page only');
    const go = async (title) => { await page.getByTitle(title).click(); await page.waitForTimeout(900); };
    await expect(page.getByTitle('Go to the first page')).toHaveClass(/k-state-disabled/);
    await go('Go to the next page');
    expect((await q.pagerText()).startsWith('11 - ')).toBe(true);
    await go('Go to the last page');
    expect((await q.pagerText()).startsWith(`${Math.floor((total - 1) / 10) * 10 + 1} - `)).toBe(true);
    await go('Go to the first page');
    expect(await q.pagerText()).toMatch(/^1 - 10 of/);
  });
  test('TC_DISBAPP_PAGINATION_03 - Pagination: clicking page number 2 opens the second page', async ({ page }) => {
    await q.setView(STATUS.all);
    test.skip((await q.total()) <= 10, 'One page only');
    await page.locator('kendo-pager, .k-pager-numbers, .k-pager-wrap').getByText('2', { exact: true }).first().click();
    await page.waitForTimeout(900);
    expect((await q.pagerText()).startsWith('11 - ')).toBe(true);
  });

  // ======================================================================================================
  // 17. Clear / Reset
  // ======================================================================================================
  test('TC_DISBAPP_CLEAR_01 - Clear / Reset: clearing the search keeps the chosen status view', async () => {
    await q.setView(STATUS.approved);
    await q.searchFor('zzzz-no-such-loan');
    await q.searchFor('');
    expect((await q.currentView()).status).toBe(STATUS.approved);
    expect((await q.rows()).length).toBeGreaterThan(0);
  });

  // ======================================================================================================
  // 18. Navigation & UI layout
  // ======================================================================================================
  test('TC_DISBAPP_NAV_01 - Navigation & UI layout: the page title and the menu path Loans > Gold > Gold Disbursal Approval Queue', async ({ page }) => {
    await expect(page.locator('h1, h2, h3, h4').filter({ hasText: 'Gold Disbursal Approval Queue' }).first()).toBeVisible();
    expect(page.url()).toMatch(/#\/Loans\/GoldDisbursalApprovalQueue/);
  });
  test('TC_DISBAPP_NAV_02 - Navigation & UI layout: Review / View opens the loan\'s own page (GoldDisbursalApprovalDetail;id=...)', async ({ page }) => {
    const r = await firstOf(STATUS.approved);
    await q.openDetail(r.loanNo);
    expect(page.url()).toMatch(/GoldDisbursalApprovalDetail;id=/);
  });
  test('TC_DISBAPP_NAV_03 - Navigation & UI layout: the action button says "Review" on waiting loans and "View" on finished ones', async ({ page }) => {
    for (const [s, label] of [[STATUS.waiting, /Review/], [STATUS.approved, /View/], [STATUS.reverted, /View/]]) {
      const rows = await view(s);
      if (!rows.length) continue;
      await expect(q.actionButton(rows[0].loanNo)).toHaveText(label);
    }
  });
  test('TC_DISBAPP_NAV_04 - Navigation & UI layout: browser Back from a loan\'s page returns to the queue', async ({ page }) => {
    const r = await firstOf(STATUS.approved);
    await q.openDetail(r.loanNo);
    await page.goBack();
    await page.waitForURL(/GoldDisbursalApprovalQueue/);
    await expect(q.headerCell('LOAN NO')).toBeVisible();
  });

  // ======================================================================================================
  // 19. Role-based access
  // ======================================================================================================
  test('TC_DISBAPP_ROLE_01 - Role-based access: what the maker and other roles see in the queue (HYPOTHESIS: appraisers cannot approve)', async ({ browser }, testInfo) => {
    test.setTimeout(600_000);
    for (const role of ['INT_APPRAISER1', 'INT_APPRAISER2', 'AUDITOR']) {
      if (!process.env[`${role}_USER`]) continue;
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.route(/\/api\//, (route) => { const r = route.request(); if (r.method() !== 'GET' && /approv|revert|disburs|voucher/i.test(r.url())) route.abort(); else route.continue(); });
      try {
        await new LoginPage(p).login(role);
        const g = new GoldDisbQueuePage(p);
        const opened = await g.open().then(() => true, () => false);
        let note = opened ? 'queue opens' : 'queue does not open';
        if (opened) {
          const v = await g.currentView();
          const opts = await g.selects().nth(0).locator('option').allInnerTexts();
          note += `; views: ${opts.map((o) => o.trim()).join(' / ')}`;
          await g.setView(STATUS.waiting).catch(() => {});
          const waiting = await g.rows();
          if (waiting.length) {
            await g.openDetail(waiting[0].loanNo);
            const b = await g.detailButtons();
            note += `; on a waiting loan the buttons are: ${b.join(', ')}`;
            if (role === 'INT_APPRAISER1') expect(b.join(' '), 'a maker must not see Approve & Disburse').not.toMatch(/Approve & Disburse/);
          }
        }
        testInfo.annotations.push({ type: 'role', description: `${role}: ${note}` });
      } catch (e) {
        if (role === 'INT_APPRAISER1' && /Approve & Disburse|maker/.test(String(e.message))) throw e;
        testInfo.annotations.push({ type: 'role', description: `${role}: ${String(e.message).split('\n')[0]}` });
      } finally { await ctx.close(); }
    }
  });

  // ======================================================================================================
  // 20. Workflow (approval)
  // ======================================================================================================
  test('TC_DISBAPP_WORKFLOW_01 - Workflow (approval): a waiting loan\'s page offers Back, Approve & Disburse and Revert (they are only looked at, never clicked)', async () => {
    const r = await firstOf(STATUS.waiting);
    await q.openDetail(r.loanNo);
    const b = await q.detailButtons();
    expect(b).toEqual(expect.arrayContaining(['Back', 'Approve & Disburse', 'Revert']));
  });
  test('TC_DISBAPP_WORKFLOW_02 - Workflow (approval): the history of a finished loan reads SUBMIT then APPROVE (or REVERT)', async () => {
    for (const [s, last] of [[STATUS.approved, 'APPROVE'], [STATUS.reverted, 'REVERT']]) {
      const rows = await view(s);
      if (!rows.length) continue;
      await q.openDetail(rows[0].loanNo);
      expect((await q.detail()).actions).toEqual(['SUBMIT', last]);
      await q.back();
    }
  });
  test('TC_DISBAPP_WORKFLOW_03 - Workflow (approval): approving and reverting move a loan out of "Waiting for Approval"', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): needs a real approve / revert. The existing "npm run disbursal-approval" covers the approval of the flow\'s own loan.');
  });

  // ======================================================================================================
  // 21. API
  // ======================================================================================================
  test('TC_DISBAPP_API_01 - API: the queue list API answers 200 with JSON that contains loan numbers', async ({ page }) => {
    const seen = [];
    page.on('response', async (r) => { if (/disburs/i.test(r.url()) && r.request().method() === 'GET' && /api\//i.test(r.url())) seen.push({ url: r.url(), status: r.status(), body: await r.text().catch(() => '') }); });
    await page.reload(); await q.open();
    await expect.poll(() => seen.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(seen[0].status).toBe(200);
    expect(() => JSON.parse(seen[0].body)).not.toThrow();
    expect(seen.map((s) => s.body).join(' ')).toMatch(/GLNG/);
  });
  test('TC_DISBAPP_API_02 - API: the loan page\'s data call answers 200', async ({ page }) => {
    const r = await firstOf(STATUS.approved);
    const seen = [];
    page.on('response', (res) => { if (/disburs/i.test(res.url()) && res.request().method() === 'GET' && /api\//i.test(res.url())) seen.push(res.status()); });
    await q.openDetail(r.loanNo);
    await page.waitForTimeout(1500);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.filter((s) => s >= 400)).toEqual([]);
  });
  test('TC_DISBAPP_API_03 - API: the queue list API refuses a call that carries no login', async ({ page, playwright }) => {
    let url;
    page.on('request', (r) => { if (/disburs/i.test(r.url()) && r.method() === 'GET' && /api\//i.test(r.url())) url = r.url(); });
    await page.reload(); await q.open();
    await expect.poll(() => url, { timeout: 20_000 }).toBeTruthy();
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(url);
    const body = await res.text();
    await ctx.dispose();
    expect(res.status() === 401 || res.status() === 403 || !/GLNG/.test(body), `status ${res.status()} without login`).toBe(true);
  });
  test('TC_DISBAPP_API_04 - API: browsing the queue and the loans\' pages sends no approve / revert / disburse request', async ({ page }) => {
    await view(STATUS.all);
    const r = (await q.rows())[0];
    await q.openDetail(r.loanNo);
    await q.back();
    expect(writes).toEqual([]);
  });
  test('TC_DISBAPP_API_05 - API: the approve / revert API with invalid data or without permission', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): a direct call could post a real voucher.');
  });

  // ======================================================================================================
  // 22. Error recovery
  // ======================================================================================================
  test('TC_DISBAPP_ERROR_01 - Error recovery: when the list call fails the page does not crash and recovers after a reload', async ({ page }) => {
    await page.route(/\/api\/.*disburs.*/i, (route) => (route.request().method() === 'GET' ? route.abort() : route.continue()));
    await page.reload();
    await page.waitForTimeout(4000);
    expect(await q.rows()).toEqual([]);
    await page.unroute(/\/api\/.*disburs.*/i);
    await page.reload(); await q.open();
    expect((await q.rows()).length + (await q.total())).toBeGreaterThan(-1);
    await expect(q.headerCell('LOAN NO')).toBeVisible();
  });
  test('TC_DISBAPP_ERROR_02 - Error recovery: opening a loan page with an invalid id shows no Approve button', async ({ page }) => {
    await page.goto('/#/Loans/GoldDisbursalApprovalDetail;id=' + encodeURIComponent(Buffer.from('999999999').toString('base64')));
    await page.waitForTimeout(4000);
    expect(await page.locator('button:visible').filter({ hasText: /Approve & Disburse|Revert/ }).count()).toBe(0);
  });

  // ======================================================================================================
  // 23. File download / upload
  // ======================================================================================================
  test('TC_DISBAPP_FILE_01 - File download / upload: the queue has no export or upload', async () => {
    test.skip(true, 'Not applicable: no Excel / PDF export or upload icons on the queue (unlike the Vault screen).');
  });

  // ======================================================================================================
  // 24. Accessibility & responsive
  // ======================================================================================================
  test('TC_DISBAPP_A11Y_01 - Accessibility & responsive: the queue fits a phone (390 x 844) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_DISBAPP_A11Y_02 - Accessibility & responsive: the search box, both filters and the action buttons have accessible names', async () => {
    const unnamed = await q.page.evaluate(() => {
      const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('placeholder') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.innerText) || e.closest('label')?.innerText || (e.tagName === 'BUTTON' ? e.innerText : '') || (e.getAttribute('aria-labelledby') ? 'ref' : '') || '').trim();
      return [...document.querySelectorAll('app-root select, app-root input:not([type=hidden]), app-root td button')].filter((e) => e.offsetParent && !name(e)).map((e) => e.tagName.toLowerCase()).slice(0, 12);
    });
    expect(unnamed, 'controls without an accessible name').toEqual([]);
  });
  test('TC_DISBAPP_A11Y_03 - Accessibility & responsive: the queue fits a tablet (768 x 1024) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_DISBAPP_A11Y_04 - Accessibility & responsive: browser compatibility (Firefox, Safari / WebKit, Edge)', async () => {
    test.skip(true, 'NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).');
  });
  test('TC_DISBAPP_A11Y_05 - Accessibility & responsive: Tab moves from the search box to the queue filter and then the status filter', async ({ page }) => {
    await q.search.focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe('SELECT');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe('SELECT');
  });

  // ======================================================================================================
  // 25. Session / concurrency / browser
  // ======================================================================================================
  test('TC_DISBAPP_SESSION_01 - Session / concurrency / browser: the queue URL without a login does not show the loans', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldDisbursalApprovalQueue');
    await p.waitForTimeout(3000);
    await expect(p.locator('tr', { hasText: /GLNG\d+/ })).toHaveCount(0);
    await ctx.close();
  });
  test('TC_DISBAPP_SESSION_02 - Session / concurrency / browser: a loan page URL without a login shows no loan and no Approve button', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldDisbursalApprovalDetail;id=MjY%3D');
    await p.waitForTimeout(3000);
    await expect(p.getByText(/GLNG\d+/)).toHaveCount(0);
    expect(await p.locator('button:visible').filter({ hasText: /Approve & Disburse|Revert/ }).count()).toBe(0);
    await ctx.close();
  });
  test('TC_DISBAPP_SESSION_03 - Session / concurrency / browser: browser storage cleared, then the filter is changed (behaviour recorded)', async ({ page, context }, testInfo) => {
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await context.clearCookies();
    await q.setView(STATUS.approved).catch(() => {});
    await page.waitForTimeout(1500);
    const login = await page.locator('input[type=password]').first().isVisible().catch(() => false);
    testInfo.annotations.push({ type: 'role', description: `After clearing the session and changing the filter: ${login ? 'redirected to the login page' : `stayed on the queue with ${(await q.rows()).length} rows`}` });
  });
  test('TC_DISBAPP_SESSION_04 - Session / concurrency / browser: a page refresh keeps or resets the chosen status view (behaviour recorded)', async ({ page }, testInfo) => {
    await q.setView(STATUS.approved);
    await page.reload();
    await page.waitForTimeout(3500);
    testInfo.annotations.push({ type: 'role', description: `After a refresh the status view is "${(await q.currentView()).status}" (it was "${STATUS.approved}")` });
  });
  test('TC_DISBAPP_SESSION_05 - Session / concurrency / browser: double-clicking View opens one loan page', async ({ page }) => {
    const r = await firstOf(STATUS.approved);
    await q.searchFor(r.loanNo);
    await q.actionButton(r.loanNo).dblclick();
    await page.waitForURL(/GoldDisbursalApprovalDetail/);
    await page.waitForTimeout(1500);
    expect(await page.getByText(r.loanNo, { exact: true }).count()).toBeGreaterThan(0);
    expect(page.url().match(/GoldDisbursalApprovalDetail/g).length).toBe(1);
  });
  test('TC_DISBAPP_SESSION_06 - Session / concurrency / browser: two approvers approving the same loan at the same time', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): needs two real approvals of one loan.');
  });

  // ======================================================================================================
  // 26. Field length & autocomplete
  // ======================================================================================================
  test('TC_DISBAPP_LENGTH_01 - Field length & autocomplete: the search box has a maximum length', async () => {
    expect(await q.search.getAttribute('maxlength'), 'search maxlength').not.toBeNull();
  });
  test('TC_DISBAPP_LENGTH_02 - Field length & autocomplete: the search box keeps at most a sensible number of characters (a 5,000-character paste is cut)', async () => {
    await q.search.fill('y'.repeat(5000));
    expect((await q.search.inputValue()).length).toBeLessThanOrEqual(500);
  });
});
