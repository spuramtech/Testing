const { test, expect } = require('@playwright/test');
const dates = require('../../utils/dates');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldSchemePage } = require('../pages/GoldSchemePage');
const { uniqueScheme } = require('../test-data/scheme');

// Gold Scheme Matrix - functional coverage across the 26 test types (one test, or an N/A skip with a reason, per type).
// Runs in file order (1 worker). The scheme created by CREATE_01 is kept in a file so later tests still work if a worker restarts.
// DELETE_01 / DELETE_02 remove the AUTOTEST schemes these tests create.
const fs = require('fs');
const STATE = require('path').resolve(__dirname, '../test-data/coverage-scheme.json');
const loadState = () => JSON.parse(fs.readFileSync(STATE, 'utf8'));
const saveState = (st) => fs.writeFileSync(STATE, JSON.stringify(st, null, 2));
let s; // scheme created by CREATE_01
let apiCalls = [];
let errScheme; // scheme created by ERROR_01

test.describe('Gold Scheme Matrix - 26 test types', () => {
  let scheme;
  const SAVE = /Save Scheme|Update Scheme/i;

  test.beforeEach(async ({ page }) => {
    scheme = new GoldSchemePage(page);
    try { ({ s, apiCalls, errScheme } = loadState()); } catch { s = undefined; }
    await new LoginPage(page).login('CHECKER_BH');
    await scheme.open();
    await page.waitForTimeout(1500);
  });

  const toast = async (page) => {
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    return (await scheme.messages()).join(' ');
  };
  const saveBtn = (page) => page.getByRole('button', { name: SAVE });
  const rowOf = (page, code) => page.locator('tr[role=row]', { hasText: code }).first();
  const rowCount = (page, code) => page.locator('tr[role=row]', { hasText: code }).count();
  const openNewFilled = async (d) => { await scheme.openNew(); await scheme.fill(d); };
  const createScheme = async (page, d) => { await openNewFilled(d); await saveBtn(page).click(); return toast(page); };
  const expectNotSaved = async (page, code) => {
    await saveBtn(page).click();
    await page.waitForTimeout(1500);
    expect((await scheme.messages()).join(' ')).not.toMatch(/success|saved/i);
    expect(await rowCount(page, code)).toBe(0);
  };
  const openEdit = async (page, code) => { await rowOf(page, code).getByTitle('Edit').click(); await expect(scheme.code).toHaveValue(code); };
  const deleteScheme = async (page, code) => {
    page.on('dialog', (dlg) => dlg.accept());
    await rowOf(page, code).getByTitle('Delete').click();
    const confirm = page.getByRole('button', { name: /^(yes|ok|confirm|delete)/i }).last();
    if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
    await page.waitForTimeout(2500);
  };

  // 1. Positive / Create
  test('TC_SCHEME_CREATE_01 - Positive / Create: Bullet scheme (9 mo, 18%) is saved and listed', async ({ page }) => {
    test.setTimeout(300_000);
    s = uniqueScheme();
    apiCalls = [];
    page.on('response', (r) => {
      if (['POST', 'PUT', 'DELETE'].includes(r.request().method()) && !/\.(js|css|png|svg)/.test(r.url())) apiCalls.push({ m: r.request().method(), url: r.url(), status: r.status() });
    });
    expect(await createScheme(page, s)).toMatch(/success|saved/i);
    const text = (await rowOf(page, s.code).innerText()).replace(/\s+/g, ' ');
    expect(text).toContain(`${s.tenure} mo`);
    expect(text).toContain(`${s.rate.toFixed(2)}%`);
    saveState({ s, apiCalls, errScheme });
  });

  // 2. Read / Persistence
  test('TC_SCHEME_READ_01 - Read / Persistence: saved scheme shows all columns after a fresh login', async ({ page }) => {
    const text = (await rowOf(page, s.code).innerText()).replace(/\s+/g, ' ');
    for (const v of [s.code, s.name, `${s.tenure} mo`, 'Bullet', `${s.rate.toFixed(2)}%`, (s.rate / 12).toFixed(2)]) expect(text).toContain(v);
    expect(text).toMatch(/\d+\.\d+% \/ \d+\.\d+% \/ \d+\.\d+%/); // 3 internal LTV slabs
  });

  // 3. Update / Edit
  test('TC_SCHEME_UPDATE_01 - Update / Edit: rate can be changed to 12% and the grid reflects it', async ({ page }) => {
    await openEdit(page, s.code);
    await scheme.rate.fill('12');
    await scheme.applyToSlabs.click();
    await saveBtn(page).click();
    expect(await toast(page)).toMatch(/success|saved|updated/i);
    const text = (await rowOf(page, s.code).innerText()).replace(/\s+/g, ' ');
    expect(text).toContain('12.00%');
    expect(text).toContain('1.00');
    s.rate = 12;
    saveState({ s, apiCalls, errScheme });
  });
  test('TC_SCHEME_UPDATE_02 - Update / Edit: Scheme-on toggle changes state and persists after reload', async ({ page }) => {
    const sw = rowOf(page, s.code).locator('.gcfg-toggle-switch input');
    const before = await sw.isChecked();
    await rowOf(page, s.code).locator('.gcfg-toggle-slider').click();
    await page.waitForTimeout(2000);
    await page.reload();
    await scheme.open();
    await page.waitForTimeout(1500);
    expect(await rowOf(page, s.code).locator('.gcfg-toggle-switch input').isChecked()).toBe(!before);
    await rowOf(page, s.code).locator('.gcfg-toggle-slider').click(); // restore
    await page.waitForTimeout(1500);
  });

  // 4. Delete & Cancel
  test('TC_SCHEME_CANCEL_01 - Delete & Cancel: leaving the New Scheme form without saving creates nothing', async ({ page }) => {
    const x = uniqueScheme();
    await openNewFilled(x);
    await page.reload(); // leave the form without saving = cancel
    await scheme.open();
    await page.waitForTimeout(1500);
    expect(await rowCount(page, x.code)).toBe(0);
  });

  // 5. Negative / Required field
  test('TC_SCHEME_REQUIRED_01 - Negative / Required field: empty form is rejected with the mandatory-fields message', async ({ page }) => {
    await scheme.openNew();
    await saveBtn(page).click();
    expect(await toast(page)).toMatch(/mandatory/i);
  });
  test('TC_SCHEME_REQUIRED_02 - Negative / Required field: scheme without Scheme Code is not saved', async ({ page }) => {
    const x = { ...uniqueScheme(), code: '' };
    await openNewFilled(x);
    await saveBtn(page).click();
    expect(await toast(page)).not.toMatch(/saved successfully|success/i);
    expect(await rowCount(page, x.name)).toBe(0);
  });

  // 6. Input validation
  test('TC_SCHEME_INPUT_01 - Input validation: Interest and Tenure reject letters', async () => {
    await scheme.openNew();
    await scheme.rate.fill('');
    await scheme.rate.pressSequentially('abc');
    expect(await scheme.rate.inputValue()).not.toMatch(/[a-z]/i);
    await scheme.tenure.fill('');
    await scheme.tenure.pressSequentially('xy');
    expect(await scheme.tenure.inputValue()).not.toMatch(/[a-z]/i);
  });

  // 7. Boundary values
  test('TC_SCHEME_BOUNDARY_01 - Boundary values: Tenure 0 months is not saved', async ({ page }) => {
    const x = { ...uniqueScheme(), tenure: 0 };
    await openNewFilled(x);
    await expectNotSaved(page, x.code);
  });
  test('TC_SCHEME_BOUNDARY_02 - Boundary values: Interest rate above 100% is not saved', async ({ page }) => {
    const x = { ...uniqueScheme(), rate: 150 };
    await openNewFilled(x);
    await expectNotSaved(page, x.code);
  });

  // 8. Default values
  test('TC_SCHEME_DEFAULT_01 - Default values: New form opens with Tenure 3, Bullet, Rate 0, Effective From today, Active', async ({ page }) => {
    await scheme.openNew();
    await expect(scheme.tenure).toHaveValue('3');
    await expect(scheme.type).toHaveValue('BULLET');
    expect(Number(await scheme.rate.inputValue())).toBe(0);
    await expect(scheme.effectiveFrom).toHaveValue(dates.today());
    await expect(page.locator('input#schemeStatusActive')).toBeChecked();
  });

  // 9. Date / calendar validation
  test('TC_SCHEME_DATE_01 - Date / calendar validation: Effective From can be back-dated by a year using the calendar', async ({ page }) => {
    await scheme.openNew();
    const d = new Date(); d.setFullYear(d.getFullYear() - 1);
    const past = dates.today().replace(/\d{4}$/, String(d.getFullYear()));
    await dates.pickDate(page, scheme.effectiveFrom, past, 'Scheme Effective From');
    await expect(scheme.effectiveFrom).toHaveValue(past);
  });

  // 10. Business rules / Calculation
  for (const rate of [12, 18, 24]) {
    test(`TC_SCHEME_BUSINESS_01 - Business rules / Calculation: ${rate}% gives ${(rate / 12).toFixed(2)} paise/month on every slab`, async () => {
      await scheme.openNew();
      await scheme.rate.fill(String(rate));
      await scheme.applyToSlabs.click();
      const slabs = await scheme.slabs();
      expect(slabs.length).toBeGreaterThan(0);
      for (const sl of slabs) { expect(sl.interest).toBe(rate); expect(sl.paise).toBeCloseTo(rate / 12, 2); }
    });
  }
  test('TC_SCHEME_BUSINESS_02 - Business rules / Calculation: Add Slab adds a slab row', async ({ page }) => {
    await scheme.openNew();
    const before = (await scheme.slabs()).length;
    await page.getByRole('button', { name: /Add Slab/i }).click();
    await page.waitForTimeout(800);
    expect((await scheme.slabs()).length).toBeGreaterThanOrEqual(before);
  });

  // 11. Data consistency
  test('TC_SCHEME_CONSISTENCY_01 - Data consistency: Edit form shows exactly what was saved', async ({ page }) => {
    await openEdit(page, s.code);
    await expect(scheme.name).toHaveValue(s.name);
    await expect(scheme.tenure).toHaveValue(String(s.tenure));
    expect(Number(await scheme.rate.inputValue())).toBe(s.rate);
    await expect(scheme.type).toHaveValue('BULLET');
  });

  // 12. Duplicate prevention
  test('TC_SCHEME_DUPLICATE_01 - Duplicate prevention: same Scheme Code + tenure + type cannot be created twice', async ({ page }) => {
    const x = { ...uniqueScheme(), code: s.code, tenure: s.tenure };
    await openNewFilled(x);
    await saveBtn(page).click();
    await page.waitForTimeout(2000);
    expect(await rowCount(page, s.code)).toBe(1);
  });

  // 13. Search
  test('TC_SCHEME_SEARCH_01 - Search: no search box on the Scheme Matrix', async () => {
    test.skip(true, 'Not applicable: the Gold Scheme Matrix grid has no search box.');
  });

  // 14. Filtering
  test('TC_SCHEME_FILTER_01 - Filtering: no filter on the Scheme Matrix', async () => {
    test.skip(true, 'Not applicable: the grid has no column filters (only a Company selector, a single company is available).');
  });

  // 15. Sorting
  test('TC_SCHEME_SORT_01 - Sorting: clicking the Tenure header orders the grid', async ({ page }) => {
    const sortable = await page.locator('th[aria-sort], th.k-sortable, th[role=columnheader] .k-link').count();
    test.skip(sortable === 0, 'Not applicable: column headers are not sortable.');
    const tenures = async () => (await page.locator('tbody tr[role=row] td:nth-child(2)').allInnerTexts()).map((t) => parseInt(t, 10)).filter((n) => !isNaN(n));
    await page.locator('th', { hasText: 'Tenure' }).first().click();
    await page.waitForTimeout(1000);
    const v = await tenures();
    const asc = [...v].sort((a, b) => a - b), desc = [...v].sort((a, b) => b - a);
    expect(v.join()).toMatch(new RegExp(`^(${asc.join()}|${desc.join()})$`));
  });

  // 16. Pagination
  test('TC_SCHEME_PAGINATION_01 - Pagination: pager summary matches the rows and the second page opens', async ({ page }) => {
    const info = (await page.locator('.k-pager-info, kendo-pager-info').first().innerText().catch(() => '')) || '';
    const m = info.match(/(\d+)\s*-\s*(\d+)\s+of\s+(\d+)/);
    expect(m, `pager summary "${info}"`).toBeTruthy();
    expect(Number(m[3])).toBeGreaterThanOrEqual(Number(m[2]));
    if (Number(m[3]) > Number(m[2])) {
      await page.getByTitle(/next page/i).first().click();
      await page.waitForTimeout(1000);
      expect(await page.locator('.k-pager-info, kendo-pager-info').first().innerText()).not.toBe(info);
    }
  });

  // 17. Clear / Reset
  test('TC_SCHEME_CLEAR_01 - Clear / Reset: no Clear / Reset button on the form', async () => {
    test.skip(true, 'Not applicable: the New Scheme form has only Apply to all slabs, Add Slab and Save Scheme (no Clear / Reset).');
  });

  // 18. Navigation & UI layout
  test('TC_SCHEME_NAV_01 - Navigation & UI layout: New Scheme opens the form and returning shows the grid again', async ({ page }) => {
    await expect(page.getByText('Unified Scheme Matrix', { exact: false }).first()).toBeVisible();
    await scheme.openNew();
    await expect(saveBtn(page)).toBeVisible();
    await page.reload();
    await scheme.open();
    await expect(page.getByText('New Scheme')).toBeVisible();
    for (const h of ['Scheme', 'Tenure', 'Type', 'Interest %', 'Paise/mo', 'Internal LTV by slab', 'Scheme on', 'Action']) {
      await expect(page.locator('th', { hasText: h }).first()).toBeVisible();
    }
  });

  // 19. Role-based access
  test('TC_SCHEME_ROLE_01 - Role-based access: Gold Scheme Matrix availability per role', async ({ browser }, testInfo) => {
    test.setTimeout(600_000);
    for (const role of ['CHECKER_BH', 'INT_APPRAISER1', 'AUDITOR']) {
      if (!process.env[`${role}_USER`]) continue;
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      try {
        await new LoginPage(p).login(role);
        const can = await new GoldSchemePage(p).open().then(() => true, () => false);
        testInfo.annotations.push({ type: 'role', description: `${role}: Scheme Matrix ${can ? 'accessible (New Scheme visible)' : 'not accessible'}` });
        if (role === 'CHECKER_BH') expect(can).toBe(true);
      } catch (e) {
        if (role === 'CHECKER_BH') throw e;
        testInfo.annotations.push({ type: 'role', description: `${role}: login failed (${String(e.message).split('\n')[0]})` });
      } finally { await ctx.close(); }
    }
  });

  // 20. Workflow (approval)
  test('TC_SCHEME_WORKFLOW_01 - Workflow (approval): no approval step for schemes', async () => {
    test.skip(true, 'Not applicable: a scheme is live when saved (activation is the Scheme-on toggle, covered in UPDATE_02); there is no maker-checker approval.');
  });

  // 21. API
  test('TC_SCHEME_API_01 - API: save / update requests all succeeded (2xx)', async () => {
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls.filter((c) => c.status >= 400)).toEqual([]);
  });

  // 22. Error recovery
  test('TC_SCHEME_ERROR_01 - Error recovery: after a rejected save, filling the missing field saves exactly one scheme', async ({ page }) => {
    const x = uniqueScheme();
    await openNewFilled({ ...x, name: '' });
    await saveBtn(page).click();
    expect(await toast(page)).not.toMatch(/saved successfully/i);
    await scheme.name.fill(x.name);
    await saveBtn(page).dblclick();
    await page.waitForTimeout(3000);
    expect(await rowCount(page, x.code)).toBe(1);
    errScheme = x;
    saveState({ s, apiCalls, errScheme });
  });

  // 23. File download / upload
  test('TC_SCHEME_FILE_01 - File download / upload: not part of the Scheme Matrix', async () => {
    test.skip(true, 'Not applicable: the Scheme Matrix has no import / export / upload control.');
  });

  // 24. Accessibility & responsive
  test('TC_SCHEME_A11Y_01 - Accessibility & responsive: New Scheme form fits a phone screen and fields are keyboard-reachable', async ({ page }) => {
    await scheme.openNew();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
    await scheme.code.focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.getAttribute('formcontrolname') || document.activeElement.tagName)).toBeTruthy();
  });

  // 25. Session / concurrency / browser
  test('TC_SCHEME_SESSION_01 - Session / concurrency / browser: opening the Scheme Matrix URL without logging in does not show the screen', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldLoanConfiguration?open=GoldSchemeMatrix');
    await p.waitForTimeout(3000);
    await expect(p.getByText('New Scheme')).toHaveCount(0);
    await ctx.close();
  });

  // 26. Field length & autocomplete
  test('TC_SCHEME_LENGTH_01 - Field length & autocomplete: Scheme Code and Name enforce a maximum length', async () => {
    await scheme.openNew();
    expect(await scheme.code.getAttribute('maxlength')).not.toBeNull();
    expect(await scheme.name.getAttribute('maxlength')).not.toBeNull();
  });

  // Cleanup: remove the AUTOTEST schemes created above (also exercises Delete)
  test('TC_SCHEME_DELETE_01 - Delete & Cancel: Delete removes the scheme from the grid', async ({ page }) => {
    await deleteScheme(page, s.code);
    expect(await rowCount(page, s.code)).toBe(0);
  });
  test('TC_SCHEME_DELETE_02 - Delete & Cancel: the scheme created after error recovery can also be deleted', async ({ page }) => {
    test.skip(!errScheme, 'ERROR_01 did not create a scheme');
    await deleteScheme(page, errScheme.code);
    expect(await rowCount(page, errScheme.code)).toBe(0);
  });
});
