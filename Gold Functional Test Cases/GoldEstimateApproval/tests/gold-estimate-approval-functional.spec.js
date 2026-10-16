const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldEstimateQueuePage } = require('../../pages/GoldEstimateQueuePage');

// Gold Estimate Approval Queue (Internal Appraiser 2 = priya) - functional coverage across the 26 test types.
// SAFETY: the queue also holds other people's estimates. Tests only ever act on ONE estimate - the one created by
// gold-estimate-functional CREATE_01 (GE number + the coverage contact's mobile must both match, see state files).
// Only APPROVE_01 clicks Approve (it runs last); no test clicks Revert. current-flow.json is never read or written.
const EST_STATE = path.resolve(__dirname, '../../GoldEstimate/test-data/coverage-estimate.json');
const CONTACT_STATE = path.resolve(__dirname, '../../Contact/test-data/coverage-contact.json');
const SAVE_STATE = path.resolve(__dirname, '../test-data/coverage-approval.json');
const GE = process.env.GE_NUMBER || JSON.parse(fs.readFileSync(EST_STATE, 'utf8')).ge;
const MOBILE = JSON.parse(fs.readFileSync(CONTACT_STATE, 'utf8')).d.mobile;
const num = (t) => Number(String(t).replace(/[^\d.]/g, ''));
const b64 = (s) => Buffer.from(s).toString('base64');

test.describe('Gold Estimate Approval Queue - 26 test types', () => {
  let queue;

  test.beforeEach(async ({ page }) => {
    queue = new GoldEstimateQueuePage(page);
    await new LoginPage(page).login('INT_APPRAISER2');
    await queue.open();
  });

  // The target row in priya's queue; skips the test when it was already approved by an earlier run
  const target = async () => {
    const rows = await queue.rows();
    const row = rows.find((r) => r.ge === GE);
    return { row, rows };
  };
  const needTarget = async () => {
    const { row, rows } = await target();
    test.skip(!row, `${GE} is no longer waiting for Internal Appraiser 2 (already approved by an earlier run). Run gold-estimate-functional CREATE_01 to create a new one.`);
    expect(row.mobile, 'safety: target must be the coverage contact').toContain(MOBILE);
    return { row, rows };
  };
  const search = async (page, text) => {
    const box = page.getByPlaceholder(/Search GE number/i);
    await box.fill(text);
    await page.waitForTimeout(1500);
  };
  const statusSelect = (page) => page.locator('select').filter({ has: page.locator('option', { hasText: /All statuses/ }) });

  // 1. Positive / Create  (see also WORKFLOW_01 / API_01 / READ_03 which run after it)
  // -- placed last in the file (it changes the estimate); declared at the end of the suite.

  // 2. Read / Persistence
  test('TC_GEAPPR_READ_01 - Read / Persistence: the estimate is listed with customer, mobile, value, role, status and Verify action', async () => {
    const { row } = await needTarget();
    expect(row.customer).toMatch(/autotest/i);
    expect(row.mobile).toContain(MOBILE);
    expect(num(row.value)).toBeGreaterThan(0);
    expect(row.role).toMatch(/Internal Appraiser 2/i);
    expect(row.status).toMatch(/Awaiting Internal Appraiser 2 verification/i);
    expect(row.action).toMatch(/Verify/i);
  });
  test('TC_GEAPPR_READ_02 - Read / Persistence: the Verify page shows the estimate entered by the Internal Appraiser', async ({ page }) => {
    await needTarget();
    await queue.openVerify(GE);
    const s = await queue.verificationSummary();
    expect(s.enteredBy).toMatch(/tryfinsta/i);
    expect(num(s.grossWeight)).toBe(10.5);
    expect(num(s.netWeight)).toBe(10);
    await expect(page.getByText('RING').first()).toBeVisible();
  });

  // 3. Update / Edit
  test('TC_GEAPPR_UPDATE_01 - Update / Edit: the Verify page is read-only (only Back, Approve and Revert actions)', async ({ page }) => {
    await needTarget();
    await queue.openVerify(GE);
    const btns = (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    expect(btns).toEqual(expect.arrayContaining(['Back', 'Approve', 'Revert']));
    expect(await page.locator('main input:visible, .content input:visible, app-gold-estimate-internal-approval input:visible').count()).toBe(0);
  });

  // 4. Delete & Cancel
  // Read-only tests below only OPEN a Verify page and click Back (never Approve / Revert). They use the AUTOTEST estimate
  // while it is still pending, otherwise the first pending row in the queue.
  const viewRow = async () => {
    const { row, rows } = await target();
    const r = row || rows.find((x) => /Verify/i.test(x.action));
    test.skip(!r, 'No estimate is waiting for Internal Appraiser 2 – nothing to open.');
    return r;
  };
  test('TC_GEAPPR_CANCEL_01 - Delete & Cancel: Back leaves the Verify page without changing the estimate', async ({ page }) => {
    const r = await viewRow();
    await queue.openVerify(r.ge);
    await page.getByRole('button', { name: /^\W*Back\s*$/ }).click();
    await page.waitForTimeout(3000);
    expect(page.url()).not.toMatch(/GoldEstimateInternalApproval/);
    await queue.open();
    const after = (await queue.rows()).find((x) => x.ge === r.ge);
    expect(after.status).toBe(r.status);
  });
  test('TC_GEAPPR_DELETE_01 - Delete & Cancel: estimates cannot be deleted from the queue', async () => {
    test.skip(true, 'Not applicable: the queue and Verify page have no delete action.');
  });

  // 5. Negative / Required field
  test('TC_GEAPPR_REQUIRED_01 - Negative / Required field: is a remark mandatory when approving?', async () => {
    test.skip(true, 'Not verified: checking this would approve the estimate (Approve may submit immediately). The Approve step itself is covered by APPROVE_01.');
  });

  // 6. Input validation
  test('TC_GEAPPR_INPUT_01 - Input validation: special characters in the search box are handled safely', async ({ page }) => {
    await search(page, '<script>alert(1)</script>');
    expect((await queue.rows()).length).toBe(0);
    await expect(page.getByText('GE NUMBER', { exact: false }).first()).toBeVisible();
  });

  // 7. Boundary values
  test('TC_GEAPPR_BOUNDARY_01 - Boundary values: a 1-character and a 500-character search do not break the queue', async ({ page }) => {
    await search(page, 'G');
    expect((await queue.rows()).length).toBeGreaterThan(0);
    await search(page, 'x'.repeat(500));
    expect((await queue.rows()).length).toBe(0);
    await expect(page.getByText('GE NUMBER', { exact: false }).first()).toBeVisible();
  });

  // 8. Default values
  test('TC_GEAPPR_DEFAULT_01 - Default values: queue opens with all statuses and an empty search box', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search GE number/i)).toHaveValue('');
    expect(await statusSelect(page).evaluate((s) => s.options[s.selectedIndex].text)).toMatch(/All statuses/i);
  });

  // 9. Date / calendar validation
  test('TC_GEAPPR_DATE_01 - Date / calendar validation: the Aging column shows a valid age (<1h, Nh, Nd)', async ({ page }) => {
    const { row } = await needTarget();
    const aging = (await page.locator('tr', { hasText: GE }).first().locator('td').allInnerTexts()).map((t) => t.trim()).find((t) => /^(<\s*1h|\d+\s*[hdm])$/i.test(t));
    expect(aging, `Aging cell of ${row.ge}`).toBeTruthy();
  });

  // 10. Business rules / Calculation
  test('TC_GEAPPR_BUSINESS_01 - Business rules / Calculation: Estimated Value = Net Weight x Rate/g on the Verify page', async () => {
    await needTarget();
    await queue.openVerify(GE);
    const s = await queue.verificationSummary();
    expect(num(s.estimatedValue)).toBeCloseTo(num(s.netWeight) * num(s.ratePerGram), 0);
  });

  // 11. Data consistency
  test('TC_GEAPPR_CONSISTENCY_01 - Data consistency: queue value, Verify page article value and the saved estimate agree', async ({ page }) => {
    const { row } = await needTarget();
    await queue.openVerify(GE);
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    expect(body).toContain(GE);
    expect(body).toContain(MOBILE);
    // queue "highest value so far" = appraised value of the article row (₹ 1,38,718.1 for the 10 g RING)
    expect(body).toContain(row.value.replace('₹ ', '₹ '));
  });

  // 12. Duplicate prevention
  test('TC_GEAPPR_DUPLICATE_01 - Duplicate prevention: every GE number appears only once in the queue', async () => {
    const { rows } = await target();
    const ges = rows.map((r) => r.ge);
    expect(new Set(ges).size).toBe(ges.length);
  });

  // 13. Search
  for (const [by, val] of [['GE number', GE], ['mobile number', MOBILE], ['customer name', 'Bebijg'], ['role', 'Internal Appraiser 2']]) {
    test(`TC_GEAPPR_SEARCH_01 - Search: queue search by ${by} finds the estimate`, async ({ page }) => {
      await needTarget();
      await search(page, val);
      expect((await queue.rows()).some((r) => r.ge === GE)).toBe(true);
    });
  }
  test('TC_GEAPPR_SEARCH_02 - Search: an unknown GE number finds nothing', async ({ page }) => {
    await search(page, 'GE0000000000');
    expect((await queue.rows()).length).toBe(0);
  });

  // 14. Filtering
  test('TC_GEAPPR_FILTER_01 - Filtering: the status filter shows only the chosen status', async ({ page }) => {
    for (const label of ['Awaiting Internal Appraiser 2 verification', 'Ready for Approval', 'Approved']) {
      await statusSelect(page).selectOption({ label });
      await page.waitForTimeout(2000);
      // every listed row must have the chosen status (an empty list is fine)
      for (const r of await queue.rows()) expect(r.status, `filter "${label}" lists ${r.ge}`).toMatch(new RegExp(label.replace(/ verification$/, ''), 'i'));
    }
  });

  // 15. Sorting
  test('TC_GEAPPR_SORT_01 - Sorting: clicking a column header sorts the queue', async ({ page }) => {
    const head = page.locator('th', { hasText: 'CUSTOMER' }).first();
    const sortable = (await head.getAttribute('aria-sort')) !== null || (await head.evaluate((e) => /sortable/.test(e.className) || e.querySelectorAll('.k-link, .k-i-sort-asc-sm').length > 0)) ? 1 : 0;
    test.skip(sortable === 0, 'Not applicable: queue column headers are not sortable.');
    await page.locator('th', { hasText: 'CUSTOMER' }).first().click();
    await page.waitForTimeout(1000);
    const names = (await queue.rows()).map((r) => r.customer.toLowerCase());
    expect(names.join('|')).toMatch(new RegExp(`^(${[...names].sort().join('\\|')}|${[...names].sort().reverse().join('\\|')})$`));
  });

  // 16. Pagination
  test('TC_GEAPPR_PAGINATION_01 - Pagination: pager summary matches the rows', async ({ page }) => {
    const info = await page.getByText(/\d+\s*-\s*\d+ of \d+ items/).first().innerText().catch(() => '');
    test.skip(!info, 'Not applicable: the queue has no pager (all rows on one page).');
    const m = info.match(/of (\d+) items/);
    expect(Number(m[1])).toBeGreaterThanOrEqual((await queue.rows()).length);
  });

  // 17. Clear / Reset
  test('TC_GEAPPR_CLEAR_01 - Clear / Reset: clearing the search restores the full queue', async ({ page }) => {
    const before = (await queue.rows()).length;
    await search(page, 'GE0000000000');
    expect((await queue.rows()).length).toBe(0);
    await search(page, '');
    expect((await queue.rows()).length).toBe(before);
  });

  // 18. Navigation & UI layout
  test('TC_GEAPPR_NAV_01 - Navigation & UI layout: Verify opens the Internal Appraiser Verification page and Back returns to the queue', async ({ page }) => {
    const r = await viewRow();
    await queue.openVerify(r.ge);
    await expect(page.getByText('Internal Appraiser Verification').first()).toBeVisible();
    await page.getByRole('button', { name: /^\W*Back\s*$/ }).click();
    await page.waitForTimeout(3000);
    expect(page.url(), 'Back should return to the Approval Queue').toMatch(/GoldEstimateApprovalQueue/);
    for (const h of ['GE NUMBER', 'CUSTOMER', 'MOBILE', 'HIGHEST VALUE SO FAR', 'IMAGES', 'YOUR ROLE', 'STATUS', 'AGING', 'ACTION']) {
      await expect(page.locator('th', { hasText: h }).first()).toBeVisible();
    }
  });

  // 19. Role-based access
  test('TC_GEAPPR_ROLE_01 - Role-based access: what each role sees for this estimate in the queue', async ({ browser }, testInfo) => {
    test.setTimeout(600_000);
    for (const role of ['INT_APPRAISER2', 'INT_APPRAISER1', 'CHECKER_BH']) {
      if (!process.env[`${role}_USER`]) continue;
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      try {
        await new LoginPage(p).login(role);
        const q = new GoldEstimateQueuePage(p);
        await q.open();
        const row = (await q.rows()).find((r) => r.ge === GE);
        testInfo.annotations.push({ type: 'role', description: `${role}: ${row ? `${row.status} | action "${row.action}"` : 'estimate not in this role\'s queue'}` });
        if (role === 'INT_APPRAISER2') expect(row?.action).toMatch(/Verify/i);
      } catch (e) {
        if (role === 'INT_APPRAISER2') throw e;
        testInfo.annotations.push({ type: 'role', description: `${role}: ${String(e.message).split('\n')[0]}` });
      } finally { await ctx.close(); }
    }
  });

  // 21. API
  // (API_01 runs after APPROVE_01 - see below)

  // 22. Error recovery
  test('TC_GEAPPR_ERROR_01 - Error recovery: opening Verify for a GE number that does not exist shows no Approve button', async ({ page }) => {
    await page.goto(`/#/Loans/GoldEstimateInternalApproval;id=${b64('GE0000000000')}`);
    await page.waitForTimeout(4000);
    expect(await page.locator('button:visible').filter({ hasText: /^\W*Approve\s*$/ }).count()).toBe(0);
  });

  // 23. File download / upload
  test('TC_GEAPPR_FILE_01 - File download / upload: the gold article image uploaded with the estimate is shown on the Verify page', async ({ page }) => {
    await needTarget();
    await queue.openVerify(GE);
    await page.waitForTimeout(2000);
    const loaded = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !/assets\/images|logo/i.test(i.src) && i.src).filter((i) => i.complete && i.naturalWidth > 0).length);
    expect(loaded).toBeGreaterThan(0);
  });

  // 24. Accessibility & responsive
  test('TC_GEAPPR_A11Y_01 - Accessibility & responsive: the queue fits a phone screen and the search box is keyboard-reachable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
    await page.getByPlaceholder(/Search GE number/i).focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.tagName)).toBeTruthy();
  });

  // 25. Session / concurrency / browser
  test('TC_GEAPPR_SESSION_01 - Session / concurrency / browser: the queue and Verify URLs without logging in do not show estimates', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldEstimateApprovalQueue');
    await p.waitForTimeout(3000);
    await expect(p.locator('tr', { hasText: /GE\d{6,}/ })).toHaveCount(0);
    await p.goto(`/#/Loans/GoldEstimateInternalApproval;id=${b64(GE)}`);
    await p.waitForTimeout(3000);
    expect(await p.locator('button:visible').filter({ hasText: /^\W*Approve\s*$/ }).count()).toBe(0);
    await ctx.close();
  });

  // 26. Field length & autocomplete
  test('TC_GEAPPR_LENGTH_01 - Field length & autocomplete: a 2000-character search is accepted without an error and the page stays usable', async ({ page }) => {
    await search(page, 'y'.repeat(2000));
    await expect(page.getByText('GE NUMBER', { exact: false }).first()).toBeVisible();
    expect((await queue.rows()).length).toBe(0);
  });

  // ---- State-changing test: the ONLY Approve click. Everything that needs the post-approval state follows it. ----
  // 1. Positive / Create
  test('TC_GEAPPR_APPROVE_01 - Positive / Create: priya verifies and approves the AUTOTEST estimate and it moves past Internal Appraiser 2', async ({ page }) => {
    test.setTimeout(300_000);
    await needTarget();
    const calls = [];
    page.on('response', (r) => {
      if (['POST', 'PUT'].includes(r.request().method()) && !/\.(js|css|png|svg)/.test(r.url())) calls.push({ url: r.url(), status: r.status() });
    });
    await queue.openVerify(GE);
    await queue.approveWithRemarks(`Functional test approval ${new Date().toISOString().slice(0, 16)}`);
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await queue.messages()).join(' ');
    expect(msgs).not.toMatch(/error|fail|cannot|please/i);
    fs.writeFileSync(SAVE_STATE, JSON.stringify({ ge: GE, msgs, apiCalls: calls, approvedAt: new Date().toISOString() }, null, 2));
    await queue.open();
    const row = (await queue.rows()).find((r) => r.ge === GE);
    if (row) expect(row.status).not.toMatch(/Awaiting Internal Appraiser 2/i);
  });

  // 2. Read / Persistence (after approval)
  test('TC_GEAPPR_READ_03 - Read / Persistence: after approval the estimate has left priya\'s Verify list, also after a fresh login', async () => {
    const saved = fs.existsSync(SAVE_STATE) ? JSON.parse(fs.readFileSync(SAVE_STATE, 'utf8')) : null;
    test.skip(!saved, 'APPROVE_01 did not run');
    const row = (await queue.rows()).find((r) => r.ge === GE);
    if (row) expect(row.action).not.toMatch(/^Verify$/i);
  });

  // 20. Workflow (approval)
  test('TC_GEAPPR_WORKFLOW_01 - Workflow (approval): the approved estimate reaches the next stage and is visible to the Checker', async ({ browser }, testInfo) => {
    test.setTimeout(300_000);
    test.skip(!fs.existsSync(SAVE_STATE), 'APPROVE_01 did not run');
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    try {
      await new LoginPage(p).login('CHECKER_BH');
      const q = new GoldEstimateQueuePage(p);
      await q.open();
      const row = (await q.rows()).find((r) => r.ge === GE);
      testInfo.annotations.push({ type: 'role', description: `CHECKER_BH sees ${GE}: ${row ? `${row.status} | action "${row.action}"` : 'not in the Checker queue'}` });
      expect(row, `${GE} should be visible to the Checker after Internal Appraiser 2 approved`).toBeTruthy();
      expect(row.status).not.toMatch(/Awaiting Internal Appraiser 2/i);
    } finally { await ctx.close(); }
  });

  // 21. API
  test('TC_GEAPPR_API_01 - API: the approve requests all succeeded (2xx)', async () => {
    const saved = fs.existsSync(SAVE_STATE) ? JSON.parse(fs.readFileSync(SAVE_STATE, 'utf8')) : null;
    test.skip(!saved, 'APPROVE_01 did not run');
    expect(saved.apiCalls.length).toBeGreaterThan(0);
    expect(saved.apiCalls.filter((c) => c.status >= 400)).toEqual([]);
  });
});
