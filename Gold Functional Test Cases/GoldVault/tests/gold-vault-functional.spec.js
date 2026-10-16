const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldVaultPage, zipTexts } = require('../pages/GoldVaultPage');

// Vault (Gold Loan Configuration -> Vault) - functional coverage across the 26 test types and the 37 categories.
//
// DATA SAFETY: the Vault grid has NO delete action, so every vault that is saved stays for good.
//   * exactly ONE vault is created per run (CREATE_01, code ATFT<5 digits>); later tests edit only that vault and the last edit
//     restores its original values;
//   * the existing vaults (including the hand-off vault of the Safe & Lockers flow) are only read - the page object refuses to
//     edit any vault whose code does not start with ATFT;
//   * every other test that reaches the save call has the request aborted in the browser (page.route), so nothing is saved;
//   * two tests (duplicate code / duplicate name) really send the save: if the server wrongly accepts them an extra vault remains.
const STATE = path.resolve(__dirname, '../test-data/coverage-vault.json');
const tag = () => Date.now().toString().slice(-5);
let V = null;          // { name, branch, code, original: { name, code } }  the vault created by CREATE_01
let createCalls = [];  // save request(s) seen during CREATE_01

test.describe('Vault - 26 test types', () => {
  let vault;

  test.beforeEach(async ({ page }) => {
    vault = new GoldVaultPage(page);
    try { ({ V, calls: createCalls } = JSON.parse(fs.readFileSync(STATE, 'utf8'))); } catch { V = null; createCalls = []; }
    await new LoginPage(page).login('CHECKER_BH');
    await vault.open();
  });

  // ---------- helpers ----------
  const saveState = () => fs.writeFileSync(STATE, JSON.stringify({ V, calls: createCalls }, null, 2));
  const needV = async () => { test.skip(!V, 'CREATE_01 has not created the test vault yet'); const r = await vault.findByCode(V.code); test.skip(!r, `test vault ${V.code} is not in the list`); return r; };
  const joined = async () => (await vault.messages()).join(' ');
  const isSuccess = (m) => /success|saved/i.test(m) && !/not saved|fail|error/i.test(m);
  // aborts every non-GET vault call in the browser and records it (nothing reaches the server)
  const blockSave = async (page) => {
    const sink = { calls: [] };
    await page.route(/\/api\//, (route) => {
      const r = route.request();
      if (r.method() !== 'GET' && /vault/i.test(r.url())) { sink.calls.push({ method: r.method(), url: r.url(), body: r.postData() }); route.abort(); } else route.continue();
    });
    return sink;
  };
  const num = (t) => Number(String(t).replace(/\D/g, ''));
  const sortedLike = (arr, dir) => { const s = [...arr].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true })); return dir === 'asc' ? s : s.reverse(); };

  // ======================================================================================================
  // 1. Positive / Create
  // ======================================================================================================
  test('TC_VAULT_CREATE_01 - Positive / Create: a valid vault is saved and listed', async ({ page }) => {
    const t = tag();
    const v = { name: `AUTOTEST FT Vault ${t}`, branch: 'HEAD OFFICE', code: `ATFT${t}` };
    const calls = [];
    page.on('response', (r) => { if (r.request().method() !== 'GET' && /vault/i.test(r.url())) calls.push({ url: r.url(), status: r.status(), body: r.request().postData() }); });
    const msgs = (await vault.add(v)).join(' ');
    expect(isSuccess(msgs), `message: ${msgs}`).toBe(true);
    const row = await vault.findByCode(v.code);
    expect(row).toMatchObject({ name: v.name, branch: v.branch, code: v.code });
    V = { ...v, original: { name: v.name, code: v.code } };
    createCalls = calls;
    saveState();
  });

  // ======================================================================================================
  // 2. Read / Persistence
  // ======================================================================================================
  test('TC_VAULT_READ_01 - Read / Persistence: the grid shows Vault Name, Vault Branch and Vault Code for each vault', async () => {
    for (const h of ['Vault Name', 'Vault Branch', 'Vault Code']) await expect(vault.headerCell(h)).toBeVisible();
    const rows = await vault.rows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(10);
    for (const r of rows) { expect(r.name).toBeTruthy(); expect(r.branch).toBeTruthy(); expect(r.code).toBeTruthy(); }
  });
  test('TC_VAULT_READ_02 - Read / Persistence: the vault created earlier is still listed after a fresh login', async () => {
    const r = await needV();
    expect(r).toMatchObject({ branch: V.branch });
  });
  test('TC_VAULT_READ_03 - Read / Persistence: across all pages every vault code is unique and the count matches the pager', async () => {
    const all = await vault.allRows();
    const total = await vault.total();
    expect(all.length, 'rows read over all pages').toBe(total);
    const codes = all.map((r) => r.code);
    expect(codes.filter((c, i) => codes.indexOf(c) !== i), 'duplicate codes').toEqual([]);
  });
  test('TC_VAULT_READ_04 - Read / Persistence: the vault of the Safe & Lockers hand-off is still listed', async () => {
    let hand;
    try { hand = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../test-data/last-vault.json'), 'utf8')); } catch { /* none */ }
    test.skip(!hand, 'No hand-off vault file (run npm run vault first)');
    const r = await vault.findByCode(hand.code);
    expect(r, `hand-off vault ${hand.code}`).toBeTruthy();
    expect(r.name).toBe(hand.name);
  });

  // ======================================================================================================
  // 3. Update / Edit
  // ======================================================================================================
  test('TC_VAULT_UPDATE_01 - Update / Edit: the Vault Name of the test vault can be changed and saved', async () => {
    await needV();
    await vault.edit(V.code);
    const newName = `${V.original.name} EDITED`;
    await vault.name.fill(newName);
    await vault.clickUpdate();
    expect(isSuccess(await joined())).toBe(true);
    expect((await vault.findByCode(V.code)).name).toBe(newName);
    V.name = newName; saveState();
  });
  test('TC_VAULT_UPDATE_02 - Update / Edit: the Vault Code of the test vault can be changed and saved', async () => {
    await needV();
    await vault.edit(V.code);
    const newCode = `${V.original.code}X`;
    await vault.code.fill(newCode);
    await vault.clickUpdate();
    expect(isSuccess(await joined())).toBe(true);
    expect((await vault.findByCode(newCode))?.code).toBe(newCode);
    V.code = newCode; saveState();
  });
  test('TC_VAULT_UPDATE_03 - Update / Edit: the original name and code of the test vault can be restored', async () => {
    await needV();
    await vault.edit(V.code);
    await vault.fill({ name: V.original.name, code: V.original.code });
    await vault.clickUpdate();
    expect(isSuccess(await joined())).toBe(true);
    const r = await vault.findByCode(V.original.code);
    expect(r).toMatchObject({ name: V.original.name, code: V.original.code });
    V.name = V.original.name; V.code = V.original.code; saveState();
  });

  // ======================================================================================================
  // 4. Delete & Cancel
  // ======================================================================================================
  test('TC_VAULT_CANCEL_01 - Delete & Cancel: closing the New panel with × saves nothing', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: 'AUTOTEST CANCEL ONLY', branch: 'HEAD OFFICE', code: 'ATFTCANCEL1' });
    await vault.closePanel();
    expect(await vault.panelOpen()).toBe(false);
    expect(await vault.findByCode('ATFTCANCEL1')).toBeUndefined();
    expect(sink.calls).toEqual([]);
  });
  test('TC_VAULT_CANCEL_02 - Delete & Cancel: closing the Edit panel with × leaves the vault unchanged', async () => {
    const before = await needV();
    await vault.edit(V.code);
    await vault.name.fill('SHOULD NOT BE SAVED');
    await vault.closePanel();
    expect(await vault.findByCode(V.code)).toMatchObject({ name: before.name, branch: before.branch });
  });
  test('TC_VAULT_DELETE_01 - Delete & Cancel: a vault cannot be deleted from the grid', async () => {
    test.skip(true, 'Not applicable: the Vault grid has only an Edit icon - there is no delete action. Test vaults therefore stay (one per run).');
  });

  // ======================================================================================================
  // 5. Negative / Required field
  // ======================================================================================================
  test('TC_VAULT_REQUIRED_01 - Negative / Required field: saving an empty panel shows all three "Required" messages and sends nothing', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.clickSave();
    const m = (await vault.requiredMessages()).join(' ');
    expect(m).toMatch(/Vault Name Required/i);
    expect(m).toMatch(/Vault Branch Required/i);
    expect(m).toMatch(/Vault Code Required/i);
    expect(sink.calls).toEqual([]);
  });
  for (const [missing, fields] of [['Vault Name', { branch: 'HEAD OFFICE', code: 'ATFTREQ' }], ['Vault Branch', { name: 'AUTOTEST REQ', code: 'ATFTREQ' }], ['Vault Code', { name: 'AUTOTEST REQ', branch: 'HEAD OFFICE' }]]) {
    test(`TC_VAULT_REQUIRED_0${missing === 'Vault Name' ? 2 : missing === 'Vault Branch' ? 3 : 4} - Negative / Required field: saving without ${missing} shows only "${missing} Required" and sends nothing`, async ({ page }) => {
      const sink = await blockSave(page);
      await vault.openNew();
      await vault.fill(fields);
      await vault.clickSave();
      const m = (await vault.requiredMessages()).join(' ');
      expect(m).toMatch(new RegExp(`${missing} Required`, 'i'));
      expect((await vault.requiredMessages()).length).toBe(1);
      expect(sink.calls).toEqual([]);
    });
  }

  // ======================================================================================================
  // 6. Input validation
  // ======================================================================================================
  test('TC_VAULT_INPUT_01 - Input validation: spaces only in all three fields count as empty (nothing is sent)', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: '     ', branch: '     ', code: '     ' });
    await vault.clickSave();
    expect(sink.calls.length, 'a save request was sent for blank (space-only) values').toBe(0);
  });
  test('TC_VAULT_INPUT_02 - Input validation: characters kept in Vault Code are recorded (letters, digits and symbols)', async ({}, testInfo) => {
    await vault.openNew();
    await vault.code.fill('');
    await vault.code.pressSequentially('ab-1_ 2#$<>/');
    testInfo.annotations.push({ type: 'role', description: `Typed "ab-1_ 2#$<>/" into Vault Code; the field kept "${await vault.code.inputValue()}"` });
  });
  test('TC_VAULT_INPUT_03 - Input validation: script text in Vault Name is not executed', async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', async (d) => { dialogs++; await d.dismiss(); });
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: '<script>alert(1)</script>', branch: '<img src=x onerror=alert(2)>', code: 'ATFTXSS' });
    await vault.clickSave();
    await page.waitForTimeout(1500);
    expect(dialogs).toBe(0);
    expect(sink.calls.length).toBeLessThanOrEqual(1);
  });
  test('TC_VAULT_INPUT_04 - Input validation: Unicode text (Telugu and emoji) is kept in Vault Name', async () => {
    await vault.openNew();
    await vault.name.fill('ఖజానా Vault 🔒');
    expect(await vault.name.inputValue()).toBe('ఖజానా Vault 🔒');
  });
  test('TC_VAULT_INPUT_05 - Input validation: spaces around the values are trimmed before they are sent', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: '  AUTOTEST TRIM  ', branch: '  HEAD OFFICE  ', code: '  ATFTTRIM  ' });
    await vault.clickSave();
    expect(sink.calls.length).toBeGreaterThan(0);
    const body = JSON.parse(sink.calls[0].body);
    const vals = Object.values(body).filter((x) => typeof x === 'string');
    expect(vals.filter((x) => x !== x.trim()), 'values sent with leading / trailing spaces').toEqual([]);
  });

  // ======================================================================================================
  // 7. Boundary values
  // ======================================================================================================
  test('TC_VAULT_BOUNDARY_01 - Boundary values: a Vault Name of exactly 250 characters is accepted by the panel and sent in full', async ({ page }) => {
    const sink = await blockSave(page);
    const long = 'N'.repeat(250);
    await vault.openNew();
    await vault.fill({ name: long, branch: 'HEAD OFFICE', code: 'ATFTB250' });
    await vault.clickSave();
    expect((await vault.name.inputValue()).length).toBe(250);
    expect(JSON.stringify(sink.calls.map((c) => c.body))).toContain(long);
  });
  test('TC_VAULT_BOUNDARY_02 - Boundary values: the 251st character of Vault Name is not accepted', async () => {
    await vault.openNew();
    await vault.name.fill('');
    await vault.name.pressSequentially('N'.repeat(260));
    expect((await vault.name.inputValue()).length).toBe(250);
  });
  test('TC_VAULT_BOUNDARY_03 - Boundary values: a Vault Code of exactly 30 characters is accepted by the panel and sent in full', async ({ page }) => {
    const sink = await blockSave(page);
    const code = 'C'.repeat(30);
    await vault.openNew();
    await vault.fill({ name: 'AUTOTEST B30', branch: 'HEAD OFFICE', code });
    await vault.clickSave();
    expect((await vault.code.inputValue()).length).toBe(30);
    expect(JSON.stringify(sink.calls.map((c) => c.body))).toContain(code);
  });
  test('TC_VAULT_BOUNDARY_04 - Boundary values: the 31st character of Vault Code is not accepted', async () => {
    await vault.openNew();
    await vault.code.fill('');
    await vault.code.pressSequentially('C'.repeat(40));
    expect((await vault.code.inputValue()).length).toBe(30);
  });
  test('TC_VAULT_BOUNDARY_05 - Boundary values: one-character values are accepted by the panel and sent', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: 'A', branch: 'B', code: 'C' });
    await vault.clickSave();
    expect(sink.calls.length, 'save request for one-character values').toBeGreaterThan(0);
  });

  // ======================================================================================================
  // 8. Default values  /  9. Date
  // ======================================================================================================
  test('TC_VAULT_DEFAULT_01 - Default values: the New panel opens empty (Vault Branch is not pre-filled)', async ({}, testInfo) => {
    await vault.openNew();
    await expect(vault.name).toHaveValue('');
    await expect(vault.code).toHaveValue('');
    testInfo.annotations.push({ type: 'role', description: `Vault Branch default: "${await vault.branch.inputValue()}"` });
    await expect(vault.branch).toHaveValue('');
  });
  test('TC_VAULT_DATE_01 - Date / calendar validation: the Vault screen has no date fields', async () => {
    test.skip(true, 'Not applicable: no date or time fields on the Vault screen.');
  });

  // ======================================================================================================
  // 10. Business rules / Calculation
  // ======================================================================================================
  test('TC_VAULT_BUSINESS_01 - Business rules / Calculation: a Vault Branch must be an existing branch', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): Vault Branch is a free-text box, so checking whether an unknown branch is refused would need to SAVE one - and vaults cannot be deleted. Check manually or on a throw-away server.');
  });
  test('TC_VAULT_BUSINESS_02 - Business rules / Calculation: the Vault Code stays editable after saving (recorded)', async ({}, testInfo) => {
    await needV();
    await vault.edit(V.code);
    const editable = await vault.code.isEditable();
    testInfo.annotations.push({ type: 'role', description: `Vault Code is ${editable ? 'EDITABLE' : 'locked'} in the Edit panel - ${editable ? 'a code can be changed even after safes were created in the vault (not tested whether the safes follow)' : 'good: the code cannot change'}` });
    await vault.closePanel();
  });

  // ======================================================================================================
  // 11. Data consistency
  // ======================================================================================================
  test('TC_VAULT_CONSISTENCY_01 - Data consistency: the Excel export contains every vault code listed in the grid', async () => {
    const all = await vault.allRows();
    const { name, buf } = await vault.download('excel');
    expect(name).toMatch(/\.xlsx$/i);
    const text = Object.values(zipTexts(buf)).join(' ');
    const missing = all.map((r) => r.code).filter((c) => !text.includes(c));
    expect(missing, `codes in the grid but not in the Excel file`).toEqual([]);
  });
  test('TC_VAULT_CONSISTENCY_02 - Data consistency: the Edit panel shows exactly the values listed in the grid', async () => {
    const r = await needV();
    await vault.edit(V.code);
    expect(await vault.name.inputValue()).toBe(r.name);
    expect(await vault.branch.inputValue()).toBe(r.branch);
    expect(await vault.code.inputValue()).toBe(r.code);
    await vault.closePanel();
  });
  test('TC_VAULT_CONSISTENCY_03 - Data consistency: the new vault is offered in the Safe & Lockers vault dropdown', async ({ page }) => {
    await needV();
    const { SafePage } = require('../../pages/SafePage');
    const safe = new SafePage(page);
    await safe.open();
    await safe.openNew();
    const options = await safe.vaultOptions();
    expect(options.some((o) => o.includes(V.original.name) || o.includes(V.name)), `vault dropdown: ${options.slice(0, 5).join(' | ')} ...`).toBe(true);
  });

  // ======================================================================================================
  // 12. Duplicate prevention  (these two really send the save: if the server wrongly accepts, an extra vault remains)
  // ======================================================================================================
  test('TC_VAULT_DUPLICATE_01 - Duplicate prevention: a second vault with the same Vault Code is rejected', async () => {
    await needV();
    const msgs = (await vault.add({ name: `${V.original.name} DUP`, branch: V.branch, code: V.code })).join(' ');
    await vault.searchFor(V.code);
    const same = (await vault.rows()).filter((r) => r.code === V.code);
    expect(isSuccess(msgs), `message: ${msgs}`).toBe(false);
    expect(same.length, 'vaults with that code').toBe(1);
  });
  test('TC_VAULT_DUPLICATE_02 - Duplicate prevention: a second vault with the same Vault Name is rejected (HYPOTHESIS: names are unique)', async () => {
    await needV();
    const code2 = `ATFTD${tag()}`;
    const msgs = (await vault.add({ name: V.original.name, branch: V.branch, code: code2 })).join(' ');
    await vault.searchFor(V.original.name);
    const same = (await vault.rows()).filter((r) => r.name === V.original.name);
    expect(isSuccess(msgs) && same.length > 1, `a second vault named "${V.original.name}" was saved (${msgs})`).toBe(false);
  });

  // ======================================================================================================
  // 13. Search
  // ======================================================================================================
  test('TC_VAULT_SEARCH_01 - Search: searching a Vault Code lists only that vault and the pager shows 1 item', async () => {
    await needV();
    await vault.searchFor(V.code);
    expect((await vault.rows()).map((r) => r.code)).toEqual([V.code]);
    expect(await vault.pagerText()).toMatch(/1 - 1 of 1 items/);
  });
  test('TC_VAULT_SEARCH_02 - Search: searching part of a Vault Name (lower case) finds the vault', async () => {
    await needV();
    await vault.searchFor('autotest ft vault');
    expect((await vault.rows()).some((r) => r.code === V.code)).toBe(true);
  });
  test('TC_VAULT_SEARCH_03 - Search: the search also looks in the Vault Branch column', async () => {
    await vault.searchFor('kavuri');
    const rows = await vault.rows();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(`${r.name} ${r.branch} ${r.code}`.toLowerCase()).toContain('kavuri');
  });
  test('TC_VAULT_SEARCH_04 - Search: an unknown value shows "No records available."', async ({ page }) => {
    await vault.searchFor('zzzz-no-such-vault');
    expect(await vault.rows()).toEqual([]);
    await expect(page.getByText(/No records available/i).first()).toBeVisible();
  });
  test('TC_VAULT_SEARCH_05 - Search: script / SQL text in the search box finds nothing and runs nothing', async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', async (d) => { dialogs++; await d.dismiss(); });
    for (const evil of ['<script>alert(1)</script>', "' OR 1=1--"]) {
      await vault.searchFor(evil);
      expect(await vault.rows(), evil).toEqual([]);
    }
    expect(dialogs).toBe(0);
  });
  test('TC_VAULT_SEARCH_06 - Search: clearing the search box brings the full list back', async () => {
    const total = await vault.total();
    await vault.searchFor('zzzz-no-such-vault');
    await vault.searchFor('');
    expect(await vault.total()).toBe(total);
  });

  // 14. Filtering
  test('TC_VAULT_FILTER_01 - Filtering: the grid has no column filters (only the search box)', async () => {
    test.skip(true, 'Not applicable: no column filters; the search box covers all columns (SEARCH tests).');
  });

  // ======================================================================================================
  // 15. Sorting
  // ======================================================================================================
  for (const [col, key, n] of [['Vault Code', 'code', 1], ['Vault Name', 'name', 2], ['Vault Branch', 'branch', 3]]) {
    test(`TC_VAULT_SORT_0${n} - Sorting: clicking the ${col} header sorts ascending, then descending`, async () => {
      await vault.searchFor('');
      await vault.headerCell(col).click();
      await vault.page.waitForTimeout(1000);
      const asc = (await vault.rows()).map((r) => r[key]);
      expect(await vault.headerCell(col).getAttribute('aria-sort')).toBe('ascending');
      expect(asc, `${col} ascending`).toEqual(sortedLike(asc, 'asc'));
      await vault.headerCell(col).click();
      await vault.page.waitForTimeout(1000);
      const desc = (await vault.rows()).map((r) => r[key]);
      expect(desc, `${col} descending`).toEqual(sortedLike(desc, 'desc'));
    });
  }

  // ======================================================================================================
  // 16. Pagination
  // ======================================================================================================
  test('TC_VAULT_PAGINATION_01 - Pagination: the pager shows "1 - 10 of N items" and page 2 shows the rest', async () => {
    const total = await vault.total();
    test.skip(total <= 10, 'Fewer than 11 vaults: one page only');
    expect(await vault.pagerText()).toMatch(new RegExp(`^1 - 10 of ${total} items`));
    await vault.page.getByTitle('Go to the next page').click();
    await vault.page.waitForTimeout(1000);
    expect((await vault.rows()).length).toBe(Math.min(10, total - 10));
    expect(await vault.pagerText()).toMatch(new RegExp(`^11 - ${Math.min(20, total)} of ${total} items`));
  });
  test('TC_VAULT_PAGINATION_02 - Pagination: the first / previous / next / last buttons move between pages', async () => {
    const total = await vault.total();
    test.skip(total <= 10, 'Fewer than 11 vaults: one page only');
    const lastStart = Math.floor((total - 1) / 10) * 10 + 1;
    const go = async (title) => { await vault.page.getByTitle(title).click(); await vault.page.waitForTimeout(900); };
    // on page 1 the first / previous buttons are disabled (k-state-disabled), so only next / last are used there
    await expect(vault.page.getByTitle('Go to the first page')).toHaveClass(/k-state-disabled/);
    await go('Go to the last page');
    expect((await vault.pagerText()).startsWith(`${lastStart} - `), `pager after Last: ${await vault.pagerText()}`).toBe(true);
    await go('Go to the first page');
    expect(await vault.pagerText()).toMatch(/^1 - 10 of/);
    await go('Go to the next page');
    expect((await vault.pagerText()).startsWith('11 - ')).toBe(true);
    await go('Go to the previous page');
    expect(await vault.pagerText()).toMatch(/^1 - 10 of/);
  });

  // ======================================================================================================
  // 17. Clear / Reset
  // ======================================================================================================
  test('TC_VAULT_CLEAR_01 - Clear / Reset: Clear empties the New panel', async () => {
    await vault.openNew();
    await vault.fill({ name: 'x', branch: 'y', code: 'z' });
    await vault.clearLink().click();
    await vault.page.waitForTimeout(600);
    await expect(vault.name).toHaveValue('');
    await expect(vault.branch).toHaveValue('');
    await expect(vault.code).toHaveValue('');
  });
  test('TC_VAULT_CLEAR_02 - Clear / Reset: after closing and reopening, the New panel is empty again', async () => {
    await vault.openNew();
    await vault.fill({ name: 'left over', branch: 'left over', code: 'left over' });
    await vault.closePanel();
    await vault.openNew();
    await expect(vault.name).toHaveValue('');
    await expect(vault.code).toHaveValue('');
  });

  // ======================================================================================================
  // 18. Navigation & UI layout
  // ======================================================================================================
  test('TC_VAULT_NAV_01 - Navigation & UI layout: the breadcrumb shows Vault & Safe > Vault and Overview returns to the tiles', async ({ page }) => {
    await expect(page.getByText('Vault & Safe').first()).toBeVisible();
    await page.getByText('Overview', { exact: true }).first().click();
    await expect(page.getByText('Gold Rate & Purity').first()).toBeVisible();
  });
  test('TC_VAULT_NAV_02 - Navigation & UI layout: browser Back leaves the Vault screen', async ({ page }) => {
    await page.goBack();
    await page.waitForTimeout(2000);
    expect(await page.getByText('Vault Code', { exact: true }).first().isVisible().catch(() => false)).toBe(false);
  });

  // ======================================================================================================
  // 19. Role-based access
  // ======================================================================================================
  test('TC_VAULT_ROLE_01 - Role-based access: only the admin can open and change vaults (other roles recorded; HYPOTHESIS for Internal Appraiser 1)', async ({ browser }, testInfo) => {
    test.setTimeout(600_000);
    for (const role of ['INT_APPRAISER1', 'INT_APPRAISER2', 'AUDITOR']) {
      if (!process.env[`${role}_USER`]) continue;
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      try {
        await new LoginPage(p).login(role);
        const g = new GoldVaultPage(p);
        const opened = await g.open().then(() => true, () => false);
        const canNew = opened && (await g.newButton.isVisible().catch(() => false));
        testInfo.annotations.push({ type: 'role', description: `${role}: Vault screen ${opened ? 'opens' : 'does not open'}; New ${canNew ? 'VISIBLE (can create vaults)' : 'not available'}` });
        if (role === 'INT_APPRAISER1') expect(canNew, 'an appraiser must not be able to create vaults').toBe(false);
      } catch (e) {
        if (role === 'INT_APPRAISER1') throw e;
        testInfo.annotations.push({ type: 'role', description: `${role}: ${String(e.message).split('\n')[0]}` });
      } finally { await ctx.close(); }
    }
  });

  // 20. Workflow
  test('TC_VAULT_WORKFLOW_01 - Workflow (approval): vault changes need no approval', async () => {
    test.skip(true, 'Not applicable: a saved vault is available at once (for example in Safe & Lockers); there is no approval step.');
  });

  // ======================================================================================================
  // 21. API
  // ======================================================================================================
  test('TC_VAULT_API_01 - API: the vault list API answers 200 with JSON that contains the vault codes', async ({ page }) => {
    const seen = [];
    page.on('response', async (r) => { if (/vault/i.test(r.url()) && r.request().method() === 'GET' && /api\//i.test(r.url())) seen.push({ url: r.url(), status: r.status(), body: await r.text().catch(() => '') }); });
    await page.reload(); await vault.open();
    await expect.poll(() => seen.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(seen[0].status).toBe(200);
    expect(() => JSON.parse(seen[0].body)).not.toThrow();
    expect(seen[0].body).toContain('ATV');
  });
  test('TC_VAULT_API_02 - API: the save request carried the entered name, branch and code and returned 200', async () => {
    test.skip(!createCalls.length || !V, 'CREATE_01 recorded no save request');
    const c = createCalls.find((x) => /save|insert|create|add/i.test(x.url)) || createCalls[0];
    expect(c.status).toBe(200);
    const body = c.body || '';
    expect(body).toContain(V.original.name);
    expect(body).toContain(V.original.code);
    expect(body).toContain(V.branch);
  });
  test('TC_VAULT_API_03 - API: the vault list API refuses a call that carries no login', async ({ page, playwright }) => {
    let url;
    page.on('request', (r) => { if (/vault/i.test(r.url()) && r.method() === 'GET' && /api\//i.test(r.url())) url = r.url(); });
    await page.reload(); await vault.open();
    await expect.poll(() => url, { timeout: 20_000 }).toBeTruthy();
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(url);
    const body = await res.text();
    await ctx.dispose();
    expect(res.status() === 401 || res.status() === 403 || !/ATV/.test(body), `status ${res.status()} without login`).toBe(true);
  });
  test('TC_VAULT_API_04 - API: the save URL carries the user id (createdby) - recorded, the server should take the user from the login', async ({}, testInfo) => {
    test.skip(!createCalls.length, 'CREATE_01 recorded no save request');
    const u = createCalls[0].url;
    testInfo.annotations.push({ type: 'role', description: `Save URL: ${u.replace(/^https?:\/\/[^/]+/, '')} - ${/createdby=\d+/i.test(u) ? 'the browser sends the user id' : 'no createdby in the URL'}; whether the server ignores a changed value was NOT tested` });
    expect(u).toMatch(/vault/i);
  });
  test('TC_VAULT_API_05 - API: server-side validation by sending invalid vaults straight to the save API', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): a direct call the server accepts would create a vault that cannot be deleted; covered at screen level instead.');
  });

  // ======================================================================================================
  // 22. Error recovery
  // ======================================================================================================
  test('TC_VAULT_ERROR_01 - Error recovery: after the "Required" messages, filling the fields lets the save go through', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.clickSave();
    expect((await vault.requiredMessages()).length).toBe(3);
    expect(sink.calls).toEqual([]);
    await vault.fill({ name: 'AUTOTEST RECOVER', branch: 'HEAD OFFICE', code: 'ATFTRECOVER' });
    await vault.clickSave();
    expect(await vault.requiredMessages()).toEqual([]);
    expect(sink.calls.length, 'save requests after fixing the fields').toBe(1);
  });
  test('TC_VAULT_ERROR_02 - Error recovery: when the save call fails (network aborted) no success message is shown and the panel keeps the values', async ({ page }) => {
    await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: 'AUTOTEST NETFAIL', branch: 'HEAD OFFICE', code: 'ATFTNET' });
    await vault.clickSave();
    expect(isSuccess(await joined())).toBe(false);
    await expect(vault.name).toHaveValue('AUTOTEST NETFAIL');
  });

  // ======================================================================================================
  // 23. File download / upload
  // ======================================================================================================
  test('TC_VAULT_FILE_01 - File download / upload: the Excel icon downloads "Vault Configuration.xlsx" with the vault rows', async () => {
    const { name, buf } = await vault.download('excel');
    expect(name).toBe('Vault Configuration.xlsx');
    expect(buf.slice(0, 2).toString('latin1')).toBe('PK');
    const text = Object.values(zipTexts(buf)).join(' ');
    expect(text).toContain('Vault Code');
    expect(text).toContain('ATV');
  });
  test('TC_VAULT_FILE_02 - File download / upload: the PDF icon downloads "Vault Configuration.pdf" that is a real PDF', async () => {
    const { name, buf } = await vault.download('pdf');
    expect(name).toBe('Vault Configuration.pdf');
    expect(buf.slice(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(2000);
  });
  test('TC_VAULT_FILE_03 - File download / upload: after a search the Excel export contains only the matching vault (HYPOTHESIS: export follows the filter)', async () => {
    await needV();
    await vault.searchFor(V.code);
    const { buf } = await vault.download('excel');
    const text = Object.values(zipTexts(buf)).join(' ');
    expect(text).toContain(V.code);
    expect(text, 'an unrelated vault code in the filtered export').not.toContain('ATV71407');
  });

  // ======================================================================================================
  // 24. Accessibility & responsive
  // ======================================================================================================
  test('TC_VAULT_A11Y_01 - Accessibility & responsive: the screen fits a phone (390 x 844) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_VAULT_A11Y_02 - Accessibility & responsive: every field and button of the New panel has an accessible name', async () => {
    await vault.openNew();
    const unnamed = await vault.page.evaluate(() => {
      const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('placeholder') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.innerText) || e.closest('label')?.innerText || (e.tagName === 'BUTTON' ? e.innerText : '') || (e.getAttribute('aria-labelledby') ? 'ref' : '') || '').trim();
      return [...document.querySelectorAll('[formcontrolname], app-root button, app-root img[title]')].filter((e) => e.offsetParent && !name(e)).map((e) => e.tagName.toLowerCase() + (e.getAttribute('formcontrolname') ? `[${e.getAttribute('formcontrolname')}]` : '')).slice(0, 12);
    });
    expect(unnamed, 'controls without an accessible name').toEqual([]);
  });
  test('TC_VAULT_A11Y_03 - Accessibility & responsive: the screen fits a tablet (768 x 1024) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_VAULT_A11Y_04 - Accessibility & responsive: browser compatibility (Firefox, Safari / WebKit, Edge)', async () => {
    test.skip(true, 'NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).');
  });
  test('TC_VAULT_A11Y_05 - Accessibility & responsive: Tab moves Vault Name -> Vault Branch -> Vault Code', async ({ page }) => {
    await vault.openNew();
    await vault.name.focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.getAttribute('formcontrolname'))).toBe('pVaultbranch');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.getAttribute('formcontrolname'))).toBe('pVaultcode');
  });

  // ======================================================================================================
  // 25. Session / concurrency / browser
  // ======================================================================================================
  test('TC_VAULT_SESSION_01 - Session / concurrency / browser: the Vault URL without a login does not show the vaults', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldLoanConfiguration?open=Vaultconfig');
    await p.waitForTimeout(3000);
    await expect(p.getByText('Vault Code', { exact: true })).toHaveCount(0);
    await ctx.close();
  });
  test('TC_VAULT_SESSION_02 - Session / concurrency / browser: browser storage cleared with the panel open, then Save (behaviour recorded, save call aborted)', async ({ page, context }, testInfo) => {
    await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: 'AUTOTEST SESS', branch: 'HEAD OFFICE', code: 'ATFTSESS' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await context.clearCookies();
    await vault.clickSave();
    const login = await page.locator('input[type=password]').first().isVisible().catch(() => false);
    testInfo.annotations.push({ type: 'role', description: `After clearing the session and clicking Save: ${login ? 'redirected to the login page' : 'stayed on the screen'}; messages: ${(await joined()).slice(0, 100) || 'none'}` });
  });
  test('TC_VAULT_SESSION_03 - Session / concurrency / browser: a page refresh with the New panel open closes the panel (behaviour recorded)', async ({ page }, testInfo) => {
    await vault.openNew();
    await vault.fill({ name: 'AUTOTEST REFRESH', branch: 'HEAD OFFICE', code: 'ATFTREF' });
    await page.reload();
    await page.waitForTimeout(3000);
    testInfo.annotations.push({ type: 'role', description: `After refresh the New panel is ${(await vault.panelOpen()) ? 'still open' : 'closed (entered values lost)'}` });
  });
  test('TC_VAULT_SESSION_04 - Session / concurrency / browser: double-clicking New opens one panel', async ({ page }) => {
    await vault.newButton.dblclick();
    await page.waitForTimeout(1000);
    expect(await page.locator('[formcontrolname=pVaultname]').count()).toBe(1);
  });
  test('TC_VAULT_SESSION_05 - Session / concurrency / browser: double-clicking Save sends only one save request', async ({ page }) => {
    const sink = await blockSave(page);
    await vault.openNew();
    await vault.fill({ name: 'AUTOTEST DBLCLICK', branch: 'HEAD OFFICE', code: 'ATFTDBL' });
    await vault.save.scrollIntoViewIfNeeded();
    await vault.save.dblclick();
    await page.waitForTimeout(2500);
    expect(sink.calls.length, 'save requests sent by a double-click').toBe(1);
  });
  test('TC_VAULT_SESSION_06 - Session / concurrency / browser: two users saving the same vault code at the same time', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): needs two real saves of one code, and vaults cannot be deleted.');
  });

  // ======================================================================================================
  // 26. Field length & autocomplete
  // ======================================================================================================
  test('TC_VAULT_LENGTH_01 - Field length & autocomplete: Vault Name and Vault Branch allow 250 characters and Vault Code 30', async () => {
    await vault.openNew();
    expect(await vault.name.getAttribute('maxlength')).toBe('250');
    expect(await vault.branch.getAttribute('maxlength')).toBe('250');
    expect(await vault.code.getAttribute('maxlength')).toBe('30');
  });
});
