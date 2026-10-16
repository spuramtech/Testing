const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldSlabPage, SANDBOX_MIN, indian } = require('../pages/GoldSlabPage');

// Gold Estimate Slab Configuration ("Gold Slab Config") - functional coverage across the 26 test types and the 37 categories.
//
// SAFETY: these slabs decide how many appraisers must approve EVERY estimate. Rules for this file:
//   * the 5 real slabs (0 .. 10,00,00,000) are only READ - the page object refuses to edit / delete them;
//   * every slab that is created starts above 10 crore ("sandbox"), where no real estimate can fall;
//   * tests that could not be run safely against the server send their save request into a browser-side abort;
//   * a cleanup step removes any leftover sandbox slab before and after the suite.
const STATE = path.resolve(__dirname, '../test-data/coverage-slab.json');
const ESTIMATE_STATE = path.resolve(__dirname, '../../GoldEstimate/test-data/coverage-estimate.json');
const A0 = { from: SANDBOX_MIN, to: 101000000, internal: 2, external: 1 }; // sandbox slab "A" created by CREATE_01
let A = { ...A0 };
let createCalls = [];

// Removes stray sandbox slabs but KEEPS the main test slab A (see GoldSlabPage.sandboxCleanup). Never throws: an unreachable server
// must not turn into "every test skipped"; the tests then fail on their own and are reported as BLOCKED.
async function cleanup(browser) {
  let ctx;
  try {
    ctx = await browser.newContext();
    const p = await ctx.newPage();
    await new LoginPage(p).login('CHECKER_BH');
    const s = new GoldSlabPage(p);
    await s.open();
    const left = await s.sandboxCleanup([A0.from]);
    console.log(`sandbox cleanup: ${left === 0 ? 'nothing stray left over' : left === -1 ? 'COULD NOT remove every stray sandbox slab' : 'done'}`);
  } catch (e) {
    console.log(`sandbox cleanup skipped (${String(e.message).split('\n')[0]})`);
  } finally { if (ctx) await ctx.close().catch(() => {}); }
}

test.describe('Gold Estimate Slab Configuration - 26 test types', () => {
  let slab;

  test.beforeAll(async ({ browser }) => { test.setTimeout(420_000); await cleanup(browser); });
  test.afterAll(async ({ browser }) => { test.setTimeout(420_000); await cleanup(browser); });

  test.beforeEach(async ({ page }) => {
    slab = new GoldSlabPage(page);
    try { ({ A, calls: createCalls } = JSON.parse(fs.readFileSync(STATE, 'utf8'))); } catch { A = { ...A0 }; createCalls = []; }
    await new LoginPage(page).login('CHECKER_BH');
    await slab.open();
  });

  // ---------- helpers ----------
  const saveA = () => fs.writeFileSync(STATE, JSON.stringify({ A, calls: createCalls }, null, 2));
  const rowOf = async (from) => (await slab.rows()).find((r) => r.from === from);
  const needA = async () => { const r = await rowOf(A.from); test.skip(!r, 'Sandbox slab A is missing (CREATE_01 did not run or was already deleted)'); return r; };
  const closeForm = async () => { if (await slab.cancel.isVisible().catch(() => false)) await slab.cancel.click(); };
  const joined = async () => (await slab.messages()).join(' ');
  // counts save / delete calls that really leave the browser
  const watchWrites = (page) => { const w = []; page.on('request', (r) => { if (['POST', 'PUT', 'DELETE'].includes(r.method()) && /SaveSlabConfig|DeleteSlabConfig/i.test(r.url())) w.push(r.method() + ' ' + r.url()); }); return w; };
  // create a sandbox slab, run the body, always delete it again
  const withSlab = async (page, d, body) => {
    const msgs = (await slab.add(d)).join(' ');
    try { await body(msgs); } finally {
      await page.reload(); await slab.open();
      if (await rowOf(d.from)) await slab.remove(d.from, true);
    }
  };
  const saved = (m) => /slab saved/i.test(m);

  // ======================================================================================================
  // 1. Positive / Create
  // ======================================================================================================
  test('TC_SLAB_CREATE_01 - Positive / Create: a valid slab above 10 crore is saved and listed', async ({ page }) => {
    const calls = [];
    page.on('response', (r) => { if (/SaveSlabConfig/i.test(r.url()) && r.request().method() === 'POST') calls.push({ url: r.url(), status: r.status(), body: r.request().postData() }); });
    A = { ...A0 };
    // a fresh run starts without a slab A left behind by an interrupted earlier run
    if (await rowOf(A.from)) { await slab.remove(A.from, true); await page.reload(); await slab.open(); }
    const msgs = (await slab.add(A)).join(' ');
    expect(msgs).toMatch(/slab saved/i);
    const row = await rowOf(A.from);
    expect(row).toMatchObject({ to: A.to, internal: A.internal, external: A.external });
    createCalls = calls;
    saveA();
  });

  // ======================================================================================================
  // 2. Read / Persistence
  // ======================================================================================================
  test('TC_SLAB_READ_01 - Read / Persistence: the existing slabs are listed with valid appraiser counts', async () => {
    const real = (await slab.rows()).filter((r) => r.from < SANDBOX_MIN);
    expect(real.length).toBeGreaterThanOrEqual(1);
    expect(real[0].from).toBe(0);
    for (const r of real) {
      expect([1, 2], `internal count of ${r.text}`).toContain(r.internal);
      expect([0, 1, 2], `external count of ${r.text}`).toContain(r.external);
      if (r.external > 0) expect(r.internal, `external needs 2 internal: ${r.text}`).toBe(2);
    }
  });
  test('TC_SLAB_READ_02 - Read / Persistence: the slab created earlier is still listed after a fresh login', async () => {
    const r = await needA();
    expect(r).toMatchObject({ to: A.to, internal: A.internal, external: A.external });
  });
  test('TC_SLAB_READ_03 - Read / Persistence: the existing slabs are continuous (each starts at the previous To + 1)', async () => {
    const real = (await slab.rows()).filter((r) => r.from < SANDBOX_MIN);
    for (let i = 1; i < real.length; i++) expect(real[i].from, `slab ${i + 1} starts after slab ${i}`).toBe(real[i - 1].to + 1);
  });
  test('TC_SLAB_READ_04 - Read / Persistence: the top real slab ends at 10,00,00,000 (the premise of the sandbox range)', async () => {
    const real = (await slab.rows()).filter((r) => r.from < SANDBOX_MIN);
    expect(real[real.length - 1].to).toBe(SANDBOX_MIN - 1);
  });

  // ======================================================================================================
  // 3. Update / Edit
  // ======================================================================================================
  test('TC_SLAB_UPDATE_01 - Update / Edit: the External Appraiser count of a slab can be changed and saved', async () => {
    await needA();
    await slab.edit(A.from);
    await slab.external.selectOption({ label: '2' });
    await slab.submit();
    expect(await joined()).toMatch(/slab (saved|updated)/i);
    expect((await rowOf(A.from)).external).toBe(2);
    A.external = 2; saveA();
  });
  test('TC_SLAB_UPDATE_02 - Update / Edit: the To Amount of a slab can be changed and saved', async () => {
    await needA();
    await slab.edit(A.from);
    await slab.to.fill('102000000');
    await slab.submit();
    expect(await joined()).toMatch(/slab (saved|updated)/i);
    expect((await rowOf(A.from)).to).toBe(102000000);
    A.to = 102000000; saveA();
  });

  // ======================================================================================================
  // 4. Delete & Cancel
  // ======================================================================================================
  test('TC_SLAB_CANCEL_01 - Delete & Cancel: Cancel on Add Slab closes the form and adds nothing', async () => {
    await slab.openAdd();
    await slab.fill({ from: 999999991, to: 999999999, internal: 2, external: 0 });
    await slab.cancel.click();
    await expect(slab.from).toBeHidden();
    expect(await rowOf(999999991)).toBeUndefined();
  });
  test('TC_SLAB_CANCEL_02 - Delete & Cancel: Cancel on Edit leaves the slab unchanged', async () => {
    const before = await needA();
    await slab.edit(A.from);
    await slab.external.selectOption({ label: '0' });
    await slab.cancel.click();
    const after = await rowOf(A.from);
    expect(after).toMatchObject({ to: before.to, internal: before.internal, external: before.external });
  });
  test('TC_SLAB_CANCEL_03 - Delete & Cancel: answering No to "Delete this slab?" keeps the slab and sends no delete', async ({ page }) => {
    await needA();
    const writes = watchWrites(page);
    const message = await slab.remove(A.from, false);
    expect(message).toMatch(/Delete this slab\?/i);
    expect(writes.filter((w) => /Delete/i.test(w))).toEqual([]);
    expect(await rowOf(A.from)).toBeTruthy();
  });

  // ======================================================================================================
  // 5. Negative / Required field
  // ======================================================================================================
  test('TC_SLAB_REQUIRED_01 - Negative / Required field: saving an empty form shows "From Amount is required." and sends nothing', async ({ page }) => {
    const writes = watchWrites(page);
    await slab.openAdd();
    await slab.submit();
    expect(await joined()).toMatch(/From Amount is required/i);
    expect(writes).toEqual([]);
  });
  test('TC_SLAB_REQUIRED_02 - Negative / Required field: a To Amount alone (no From Amount) is rejected', async ({ page }) => {
    const writes = watchWrites(page);
    await slab.openAdd();
    await slab.fill({ to: 250000000 });
    await slab.submit();
    expect(await joined()).toMatch(/From Amount is required/i);
    expect(writes).toEqual([]);
  });

  // ======================================================================================================
  // 6. Input validation
  // ======================================================================================================
  test('TC_SLAB_INPUT_01 - Input validation: letters and symbols typed in From / To Amount are not kept (digits only)', async () => {
    await slab.openAdd();
    for (const f of [slab.from, slab.to]) {
      await f.fill('');
      await f.pressSequentially('ab-1.5,,x#$');
      expect(await f.inputValue()).toMatch(/^\d*$/);
    }
  });
  test('TC_SLAB_INPUT_02 - Input validation: a number typed with commas (1,00,000) is stored as plain digits', async () => {
    await slab.openAdd();
    await slab.from.fill('');
    await slab.from.pressSequentially('1,00,000');
    expect(await slab.from.inputValue()).toBe('100000');
  });
  test('TC_SLAB_INPUT_03 - Input validation: spaces only in From Amount count as empty', async ({ page }) => {
    const writes = watchWrites(page);
    await slab.openAdd();
    await slab.from.fill('');
    await slab.from.pressSequentially('     ');
    await slab.submit();
    expect(await joined()).toMatch(/From Amount is required/i);
    expect(writes).toEqual([]);
  });
  test('TC_SLAB_INPUT_04 - Input validation: script / SQL text typed in the amount fields is not kept', async () => {
    await slab.openAdd();
    for (const evil of ['<script>alert(1)</script>', "' OR 1=1--"]) {
      await slab.from.fill('');
      await slab.from.pressSequentially(evil);
      expect(await slab.from.inputValue(), evil).toMatch(/^\d*$/);
    }
  });
  test('TC_SLAB_INPUT_05 - Input validation: non-Latin digits typed in From Amount are not kept', async () => {
    await slab.openAdd();
    await slab.from.fill('');
    await slab.from.pressSequentially('١٢٣');
    expect(await slab.from.inputValue()).toMatch(/^[0-9]*$/);
  });

  // ======================================================================================================
  // 7. Boundary values
  // ======================================================================================================
  test('TC_SLAB_BOUNDARY_01 - Boundary values: From Amount greater than To Amount is rejected with a message and sends nothing', async ({ page }) => {
    const writes = watchWrites(page);
    await slab.openAdd();
    await slab.fill({ from: 900, to: 100, internal: 2, external: 0 });
    await slab.submit();
    expect(await joined()).toMatch(/cannot be less than From Amount/i);
    expect(writes).toEqual([]);
  });
  test('TC_SLAB_BOUNDARY_02 - Boundary values: a one-amount slab (From = To) directly after slab A is accepted', async ({ page }) => {
    await needA();
    const d = { from: A.to + 1, to: A.to + 1, internal: 2, external: 2 };
    await withSlab(page, d, async (m) => { expect(m).toMatch(/slab saved/i); expect(await rowOf(d.from)).toMatchObject({ to: d.to }); });
  });
  test('TC_SLAB_BOUNDARY_03 - Boundary values: a slab that overlaps slab A by one amount (From = A.To) is rejected', async ({ page }) => {
    await needA();
    const d = { from: A.to, to: A.to + 1000, internal: 2, external: 0 };
    await withSlab(page, d, async (m) => { expect(saved(m), `message: ${m}`).toBe(false); });
  });
  test('TC_SLAB_BOUNDARY_04 - Boundary values: a slab inside slab A\'s range is rejected', async ({ page }) => {
    await needA();
    const d = { from: A.from + 10, to: A.to - 10, internal: 2, external: 0 };
    await withSlab(page, d, async (m) => { expect(saved(m), `message: ${m}`).toBe(false); });
  });
  test('TC_SLAB_BOUNDARY_05 - Boundary values: a slab that leaves a gap after slab A (From = A.To + 2) is rejected', async ({ page }) => {
    await needA();
    const d = { from: A.to + 2, to: A.to + 5000, internal: 2, external: 0 };
    await withSlab(page, d, async (m) => { expect(saved(m), `a gap of one amount was accepted: ${m}`).toBe(false); });
  });
  test('TC_SLAB_BOUNDARY_06 - Boundary values: a slab with a blank To Amount becomes an open-ended top slab', async ({ page }) => {
    await needA();
    const d = { from: A.to + 1, internal: 2, external: 2 };
    await withSlab(page, d, async (m) => { expect(m).toMatch(/slab saved/i); const r = await rowOf(d.from); expect(r.to === null || r.to === 0).toBe(true); });
  });

  // ======================================================================================================
  // 8. Default values
  // ======================================================================================================
  test('TC_SLAB_DEFAULT_01 - Default values: the Add Slab form opens empty with Internal 1 and External 0 (disabled)', async () => {
    await slab.openAdd();
    await expect(slab.from).toHaveValue('');
    await expect(slab.to).toHaveValue('');
    expect(await slab.internal.evaluate((s) => s.options[s.selectedIndex].text)).toBe('1');
    expect(await slab.external.evaluate((s) => s.options[s.selectedIndex].text)).toBe('0');
    await expect(slab.external).toBeDisabled();
  });

  // 9. Date / calendar validation
  test('TC_SLAB_DATE_01 - Date / calendar validation: the slab screen has no date fields', async () => {
    test.skip(true, 'Not applicable: the Estimate Slab Configuration has no date or time fields.');
  });

  // ======================================================================================================
  // 10. Business rules / Calculation
  // ======================================================================================================
  test('TC_SLAB_BUSINESS_01 - Business rules / Calculation: External Appraiser count is disabled with 1 Internal and enabled with 2', async () => {
    await slab.openAdd();
    await slab.internal.selectOption({ label: '1' });
    await expect(slab.external).toBeDisabled();
    await slab.internal.selectOption({ label: '2' });
    await expect(slab.external).toBeEnabled();
  });
  test('TC_SLAB_BUSINESS_02 - Business rules / Calculation: Internal count offers 1 and 2, External count offers 0, 1 and 2', async () => {
    await slab.openAdd();
    expect((await slab.internal.locator('option').allInnerTexts()).map((o) => o.trim())).toEqual(['1', '2']);
    expect((await slab.external.locator('option').allInnerTexts()).map((o) => o.trim())).toEqual(['0', '1', '2']);
  });
  test('TC_SLAB_BUSINESS_03 - Business rules / Calculation: switching Internal from 2 back to 1 resets External to 0', async () => {
    await slab.openAdd();
    await slab.internal.selectOption({ label: '2' });
    await slab.external.selectOption({ label: '2' });
    await slab.internal.selectOption({ label: '1' });
    expect(await slab.external.evaluate((s) => s.options[s.selectedIndex].text)).toBe('0');
  });

  // ======================================================================================================
  // 11. Data consistency
  // ======================================================================================================
  test('TC_SLAB_CONSISTENCY_01 - Data consistency: amounts in the grid use Indian digit grouping (1,00,000 / 10,00,00,000)', async () => {
    const cells = (await slab.page.locator('tr').allInnerTexts()).flatMap((t) => t.split('\t')).map((t) => t.trim()).filter((t) => /^\d[\d,]*$/.test(t) && t.length > 3);
    expect(cells.length).toBeGreaterThan(0);
    for (const c of cells) expect(c, `grouping of ${c}`).toBe(indian(c.replace(/,/g, '')));
  });
  test('TC_SLAB_CONSISTENCY_02 - Data consistency: the Edit form shows exactly the values listed in the grid', async () => {
    const r = await needA();
    await slab.edit(A.from);
    expect(Number(await slab.from.inputValue())).toBe(r.from);
    expect(Number(await slab.to.inputValue())).toBe(r.to);
    expect(Number(await slab.internal.evaluate((s) => s.options[s.selectedIndex].text))).toBe(r.internal);
    expect(Number(await slab.external.evaluate((s) => s.options[s.selectedIndex].text))).toBe(r.external);
    await slab.cancel.click();
  });
  test('TC_SLAB_CONSISTENCY_03 - Data consistency: the stages a saved estimate needs equal Internal + External of the slab its value falls in', async ({ browser }) => {
    test.setTimeout(300_000);
    let ge;
    try { ge = JSON.parse(fs.readFileSync(ESTIMATE_STATE, 'utf8')).ge; } catch { /* no estimate yet */ }
    test.skip(!ge, 'No saved estimate (GoldEstimate CREATE_01) to compare with');
    const real = (await slab.rows()).filter((r) => r.from < SANDBOX_MIN);
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    try {
      await new LoginPage(p).login('INT_APPRAISER1');
      await p.getByRole('button', { name: /My Saved Estimates/ }).waitFor({ state: 'attached', timeout: 1000 }).catch(() => {});
      const { GoldEstimatePage } = require('../../pages/GoldEstimatePage');
      await new GoldEstimatePage(p).open();
      await p.getByRole('button', { name: /My Saved Estimates/ }).click();
      await p.waitForURL(/#\/Loans\/MyGoldEstimates/);
      await p.getByText('My GE Numbers', { exact: true }).first().click();
      await p.waitForTimeout(1500);
      await p.locator('tr', { hasText: ge }).first().getByRole('button', { name: 'Summary' }).click();
      await p.waitForURL(/GoldEstimateApprovalDetail/);
      await p.waitForTimeout(1500);
      const t = (await p.locator('body').innerText()).replace(/\s+/g, ' ');
      const value = Number((t.match(/ELIGIBLE LOAN AMOUNT \(LTV\) ₹ ?([\d,.]+)/i) || [])[1].replace(/,/g, ''));
      const required = Number((t.match(/APPRAISAL STAGES REQUIRED\/COMPLETED \d+ \/ (\d+)/i) || [])[1]);
      const s = real.find((r) => value >= r.from && (r.to === null || value <= r.to));
      expect(s, `a slab covering ${value}`).toBeTruthy();
      expect(required, `stages required by ${ge} (value ${value}, slab ${s.text})`).toBe(s.internal + s.external);
    } finally { await ctx.close(); }
  });

  // ======================================================================================================
  // 12. Duplicate prevention
  // ======================================================================================================
  test('TC_SLAB_DUPLICATE_01 - Duplicate prevention: a slab with exactly the same range as slab A is rejected', async ({ page }) => {
    await needA();
    const d = { from: A.from, to: A.to, internal: 2, external: 0 }; // External is disabled with 1 Internal, so use 2
    await slab.openAdd(); await slab.fill(d); await slab.submit();
    const m = await joined();
    await closeForm();
    await page.reload(); await slab.open();
    const same = (await slab.rows()).filter((r) => r.from === A.from);
    expect(saved(m) ? 'saved' : 'rejected', `message: ${m}`).toBe('rejected');
    expect(same.length).toBe(1);
  });
  test('TC_SLAB_DUPLICATE_02 - Duplicate prevention: a slab with the same From Amount as slab A but another To Amount is rejected', async ({ page }) => {
    await needA();
    await slab.openAdd(); await slab.fill({ from: A.from, to: A.to + 5000, internal: 2, external: 0 }); await slab.submit();
    const m = await joined();
    await closeForm();
    await page.reload(); await slab.open();
    expect(saved(m), `message: ${m}`).toBe(false);
    expect((await slab.rows()).filter((r) => r.from === A.from).length).toBe(1);
  });

  // ======================================================================================================
  // 13 - 16, 17, 23: controls the screen does not have
  // ======================================================================================================
  test('TC_SLAB_SEARCH_01 - Search: the slab list has no search box', async () => { test.skip(true, 'Not applicable: the Estimate Slab Configuration list has no search box.'); });
  test('TC_SLAB_FILTER_01 - Filtering: the slab list has no filters', async () => { test.skip(true, 'Not applicable: the slab list has no filters.'); });
  test('TC_SLAB_SORT_01 - Sorting: the slab list has no sortable columns', async () => { test.skip(true, 'Not applicable: slabs are shown in range order; the headers are not sortable.'); });
  test('TC_SLAB_PAGINATION_01 - Pagination: the slab list has no pager', async () => { test.skip(true, 'Not applicable: all slabs are shown on one page (no pager).'); });
  test('TC_SLAB_WORKFLOW_01 - Workflow (approval): slab changes need no approval', async () => { test.skip(true, 'Not applicable: a saved slab is effective immediately for new estimates; there is no maker-checker step on this screen.'); });
  test('TC_SLAB_FILE_01 - File download / upload: not part of this screen', async () => { test.skip(true, 'Not applicable: the screen has no import, export or upload.'); });

  // ======================================================================================================
  // 17. Clear / Reset
  // ======================================================================================================
  test('TC_SLAB_CLEAR_01 - Clear / Reset: after Cancel, a new Add Slab form opens empty again (nothing left over)', async () => {
    await slab.openAdd();
    await slab.fill({ from: 999999991, to: 999999999, internal: 2, external: 2 });
    await slab.cancel.click();
    await slab.openAdd();
    await expect(slab.from).toHaveValue('');
    await expect(slab.to).toHaveValue('');
    expect(await slab.internal.evaluate((s) => s.options[s.selectedIndex].text)).toBe('1');
  });

  // ======================================================================================================
  // 18. Navigation & UI layout
  // ======================================================================================================
  test('TC_SLAB_NAV_01 - Navigation & UI layout: the breadcrumb is shown and Overview returns to the Gold Loan Configuration tiles', async ({ page }) => {
    await expect(page.getByText('Appraisal & Pre-Estimate Setup').first()).toBeVisible();
    await expect(page.getByText('Estimate Approval Slabs').first()).toBeVisible();
    await page.getByText('Overview', { exact: true }).first().click();
    await expect(page.getByText('Gold Rate & Purity').first()).toBeVisible();
  });
  test('TC_SLAB_NAV_02 - Navigation & UI layout: browser Back leaves the slab screen', async ({ page }) => {
    await page.goBack();
    await page.waitForTimeout(2000);
    expect(await page.getByText('Gold Estimate Slab Configuration').isVisible().catch(() => false)).toBe(false);
  });

  // ======================================================================================================
  // 19. Role-based access
  // ======================================================================================================
  test('TC_SLAB_ROLE_01 - Role-based access: only the admin can change slabs (other roles recorded; HYPOTHESIS for Internal Appraiser 1)', async ({ browser }, testInfo) => {
    test.setTimeout(600_000);
    for (const role of ['INT_APPRAISER1', 'INT_APPRAISER2', 'AUDITOR']) {
      if (!process.env[`${role}_USER`]) continue;
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      try {
        await new LoginPage(p).login(role);
        const s = new GoldSlabPage(p);
        const opened = await s.open().then(() => true, () => false);
        const canAdd = opened && (await s.addButton.isVisible().catch(() => false));
        testInfo.annotations.push({ type: 'role', description: `${role}: slab screen ${opened ? 'opens' : 'does not open'}; Add Slab ${canAdd ? 'VISIBLE (can change slabs)' : 'not available'}` });
        if (role === 'INT_APPRAISER1') expect(canAdd, 'an appraiser must not be able to change the approval slabs').toBe(false);
      } catch (e) {
        if (role === 'INT_APPRAISER1') throw e;
        testInfo.annotations.push({ type: 'role', description: `${role}: ${String(e.message).split('\n')[0]}` });
      } finally { await ctx.close(); }
    }
  });

  // ======================================================================================================
  // 21. API
  // ======================================================================================================
  test('TC_SLAB_API_01 - API: the slab list API answers 200 with JSON that contains the real slabs', async ({ page }) => {
    const seen = [];
    page.on('response', async (r) => { if (/slab/i.test(r.url()) && r.request().method() === 'GET' && /api\//i.test(r.url())) seen.push({ url: r.url(), status: r.status(), body: await r.text().catch(() => '') }); });
    await page.reload(); await slab.open();
    await expect.poll(() => seen.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(seen[0].status).toBe(200);
    expect(() => JSON.parse(seen[0].body)).not.toThrow();
    expect(seen[0].body).toContain('99999');
  });
  test('TC_SLAB_API_02 - API: the save request carried the entered amounts and counts and returned 200', async () => {
    test.skip(!createCalls.length, 'CREATE_01 recorded no save request');
    const c = createCalls[0];
    expect(c.status).toBe(200);
    const b = JSON.parse(c.body);
    expect(b).toMatchObject({ pSlabFromAmount: A0.from, pSlabToAmount: A0.to, pInternalAppraiserCount: A0.internal, pExternalAppraiserCount: A0.external });
  });
  test('TC_SLAB_API_03 - API: the slab list API refuses a call that carries no login', async ({ page, playwright }) => {
    let url;
    page.on('request', (r) => { if (/slab/i.test(r.url()) && r.method() === 'GET' && /api\//i.test(r.url())) url = r.url(); });
    await page.reload(); await slab.open();
    await expect.poll(() => url, { timeout: 20_000 }).toBeTruthy();
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(url);
    const body = await res.text();
    await ctx.dispose();
    expect(res.status() === 401 || res.status() === 403 || !/99999/.test(body), `status ${res.status()} without login`).toBe(true);
  });
  test('TC_SLAB_API_04 - API: the save URL carries the user id (createdby) - recorded, the server should take the user from the login', async ({}, testInfo) => {
    test.skip(!createCalls.length, 'CREATE_01 recorded no save request');
    const m = createCalls[0].url.match(/createdby=(\d+)/i);
    testInfo.annotations.push({ type: 'role', description: `Save URL: ${createCalls[0].url.replace(/^https?:\/\/[^/]+/, '')} - the user id is sent by the browser (${m ? 'createdby=' + m[1] : 'no createdby'}); whether the server ignores a changed value was NOT tested` });
    expect(createCalls[0].url).toMatch(/SaveSlabConfig/);
  });
  test('TC_SLAB_API_05 - API: server-side validation by sending invalid slabs straight to the save API', async () => {
    test.skip(true, 'NOT EXECUTED: needs the login token to call the API directly; invalid slabs are exercised through the screen instead (BOUNDARY / DUPLICATE tests, sandbox range only).');
  });

  // ======================================================================================================
  // 22. Error recovery
  // ======================================================================================================
  test('TC_SLAB_ERROR_01 - Error recovery: after an overlapping slab is rejected, a valid slab can be saved (double-click Save creates one)', async ({ page }) => {
    await needA();
    await slab.openAdd();
    await slab.fill({ from: A.from + 5, to: A.to - 5, internal: 2, external: 0 });
    await slab.submit();
    expect(saved(await joined())).toBe(false);
    const good = { from: A.to + 1, to: A.to + 1000000, internal: 2, external: 0 };
    await slab.from.fill(String(good.from)); await slab.to.fill(String(good.to));
    await slab.save.scrollIntoViewIfNeeded();
    await slab.save.dblclick();
    await page.waitForTimeout(3000);
    try {
      await page.reload(); await slab.open();
      expect((await slab.rows()).filter((r) => r.from === good.from).length, 'slabs created by the double-click').toBe(1);
    } finally {
      await page.reload(); await slab.open();
      while (await rowOf(good.from)) { await slab.remove(good.from, true); await page.reload(); await slab.open(); }
    }
  });
  test('TC_SLAB_ERROR_02 - Error recovery: when the save call fails (network aborted) no success message is shown and the form keeps the values', async ({ page }) => {
    await page.route(/SaveSlabConfig/i, (route) => route.abort());
    await slab.openAdd();
    await slab.fill({ from: 999999991, to: 999999999, internal: 2, external: 0 });
    await slab.submit();
    expect(saved(await joined())).toBe(false);
    await expect(slab.from).toHaveValue('999999991');
  });

  // ======================================================================================================
  // 24. Accessibility & responsive
  // ======================================================================================================
  test('TC_SLAB_A11Y_01 - Accessibility & responsive: the screen fits a phone (390 x 844) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_SLAB_A11Y_02 - Accessibility & responsive: every field and button of the Add Slab form has an accessible name', async () => {
    await slab.openAdd();
    const unnamed = await slab.page.evaluate(() => {
      const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('placeholder') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.innerText) || e.closest('label')?.innerText || (e.tagName === 'BUTTON' ? e.innerText : '') || (e.getAttribute('aria-labelledby') ? 'ref' : '') || '').trim();
      return [...document.querySelectorAll('app-root input:not([type=hidden]), app-root select, app-root textarea, app-root button, app-root a.icon-btn')].filter((e) => e.offsetParent && !name(e)).map((e) => e.tagName.toLowerCase() + (e.getAttribute('formcontrolname') ? `[${e.getAttribute('formcontrolname')}]` : '')).slice(0, 12);
    });
    expect(unnamed, 'controls without an accessible name').toEqual([]);
  });
  test('TC_SLAB_A11Y_03 - Accessibility & responsive: the screen fits a tablet (768 x 1024) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_SLAB_A11Y_04 - Accessibility & responsive: browser compatibility (Firefox, Safari / WebKit, Edge)', async () => {
    test.skip(true, 'NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).');
  });

  // ======================================================================================================
  // 25. Session / concurrency / browser
  // ======================================================================================================
  test('TC_SLAB_SESSION_01 - Session / concurrency / browser: the slab URL without a login does not show the slabs', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldLoanConfiguration?open=GoldEstimateSlabConfig');
    await p.waitForTimeout(3000);
    await expect(p.getByText('Gold Estimate Slab Configuration')).toHaveCount(0);
    await ctx.close();
  });
  // The app may warn before logging out an idle user, but the warning has NOT been observed: the dialog text exists in the page
  // while hidden. The test waits 5 minutes idle and RECORDS whether a visible warning or a logout happened.
  test('TC_SLAB_SESSION_02 - Session / concurrency / browser: whether an inactivity warning or logout appears within 5 minutes idle (behaviour recorded)', async ({ page }, testInfo) => {
    test.setTimeout(360_000);
    const popup = page.getByText(/You will be logged out in d+ seconds/i);
    let outcome = 'no warning and no logout within 5 minutes';
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(5000);
      if (await popup.isVisible().catch(() => false)) { outcome = `a visible inactivity warning after about ${(i + 1) * 5} seconds`; await page.getByRole('button', { name: /Stay Logged In/i }).click().catch(() => {}); break; }
      if (await page.locator('input[type=password]').first().isVisible().catch(() => false)) { outcome = `logged out (login page) after about ${(i + 1) * 5} seconds`; break; }
    }
    testInfo.annotations.push({ type: 'role', description: `5-minute idle session test: ${outcome}. A longer idle time was not tried.` });
  });
  test('TC_SLAB_SESSION_03 - Session / concurrency / browser: browser storage cleared with the form open, then Save (behaviour recorded, save call aborted)', async ({ page, context }, testInfo) => {
    await page.route(/SaveSlabConfig/i, (route) => route.abort());
    await slab.openAdd();
    await slab.fill({ from: 999999991, to: 999999999, internal: 2, external: 0 });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await context.clearCookies();
    await slab.submit();
    const login = await page.locator('input[type=password]').first().isVisible().catch(() => false);
    testInfo.annotations.push({ type: 'role', description: `After clearing the session and clicking Save: ${login ? 'redirected to the login page' : 'stayed on the form'}; messages: ${(await joined()).slice(0, 100) || 'none'}` });
  });
  test('TC_SLAB_SESSION_04 - Session / concurrency / browser: double-clicking Add Slab opens one form', async ({ page }) => {
    await slab.addButton.dblclick();
    await page.waitForTimeout(1000);
    expect(await page.getByPlaceholder('e.g. 0').count()).toBe(1);
  });
  test('TC_SLAB_SESSION_05 - Session / concurrency / browser: two users saving overlapping slabs at the same time', async () => {
    test.skip(true, 'NOT EXECUTED: two simultaneous writers on the live approval configuration were judged too risky; run it manually in a quiet window.');
  });

  // ======================================================================================================
  // 26. Field length & autocomplete
  // ======================================================================================================
  test('TC_SLAB_LENGTH_01 - Field length & autocomplete: From / To Amount have a maximum length', async () => {
    await slab.openAdd();
    expect(await slab.from.getAttribute('maxlength'), 'From Amount maxlength').not.toBeNull();
    expect(await slab.to.getAttribute('maxlength'), 'To Amount maxlength').not.toBeNull();
  });
  test('TC_SLAB_LENGTH_02 - Field length & autocomplete: a 25-digit number typed in From Amount is cut to a safe length (16 digits at most)', async () => {
    await slab.openAdd();
    await slab.from.fill('');
    await slab.from.pressSequentially('1234567890123456789012345');
    expect((await slab.from.inputValue()).length).toBeLessThanOrEqual(16);
  });

  // ======================================================================================================
  // 4. Delete (runs last: removes slab A)
  // ======================================================================================================
  test('TC_SLAB_DELETE_01 - Delete & Cancel: Delete (after confirming) removes slab A from the list', async ({ page }) => {
    await needA();
    const writes = watchWrites(page);
    const message = await slab.remove(A.from, true);
    expect(message).toMatch(/Delete this slab\?/i);
    expect(writes.some((w) => /DeleteSlabConfig/i.test(w))).toBe(true);
    await page.reload(); await slab.open();
    expect(await rowOf(A.from)).toBeUndefined();
  });
  test('TC_SLAB_DELETE_02 - Delete & Cancel: the real slabs are untouched after the whole run', async () => {
    const real = (await slab.rows()).filter((r) => r.from < SANDBOX_MIN);
    expect(real.map((r) => `${r.from}-${r.to}/${r.internal}/${r.external}`)).toEqual([
      '0-99999/1/0', '100000-500000/2/0', '500001-1000000/2/0', '1000001-1500000/2/1', '1500001-100000000/2/2',
    ]);
    expect((await slab.rows()).filter((r) => r.from >= SANDBOX_MIN)).toEqual([]);
  });
});
