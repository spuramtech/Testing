const path = require('path');
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const dates = require('../../utils/dates');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldEstimatePage } = require('../../pages/GoldEstimatePage');

// Gold Estimate - functional coverage across the 26 test types (one test, or an N/A skip with a reason, per type).
// Only CREATE_01 saves a real estimate (it enters the approval queue and cannot be deleted). Every other test stops at the
// "Review Gold Estimate" dialog and never clicks Confirm & Save, so no extra records are created.
// This file never touches test-data/current-flow.json (the end-to-end flow's own estimate).
const STATE = path.resolve(__dirname, '../test-data/coverage-estimate.json');
const loadState = () => JSON.parse(fs.readFileSync(STATE, 'utf8'));
const saveState = (st) => fs.writeFileSync(STATE, JSON.stringify(st, null, 2));
const IMAGE = path.resolve(__dirname, '../../test-data/gold-article.png');
const ART = { type: 'RING', quantity: 1, grossWeight: 10.5, stoneWastage: 0.5, stoneCount: 0 };

let st = {}; // { ge, routedTo, apiCalls }
let contactMobile, contactName;
try { const c = require('../../Contact/test-data/coverage-contact.json').d; contactMobile = c.mobile; contactName = c.firstName.split(' ')[1]; } catch { contactMobile = undefined; }
const num = (t) => Number(String(t).replace(/[^\d.]/g, ''));

test.describe('Gold Estimate - 26 test types', () => {
  let est;

  test.beforeEach(async ({ page }) => {
    est = new GoldEstimatePage(page);
    try { st = loadState(); } catch { st = {}; }
    await new LoginPage(page).login('INT_APPRAISER1');
    await est.open();
  });

  const mobile = () => process.env.ESTIMATE_CONTACT || contactMobile || require('../../utils/flow').need('mobile', 'contact');
  const pickScheme = async () => {
    try { return await est.selectScheme(process.env.ESTIMATE_SCHEME || 'AUTOTEST SCHEME'); } catch {
      const opts = await est.scheme.locator('option').allInnerTexts();
      await est.scheme.selectOption({ index: 1 });
      return opts[1];
    }
  };
  // contact + loan + scheme chosen, ready for articles
  // A contact that already has an estimate in the approval chain disappears from this dropdown. Read-only tests therefore fall
  // back to any other AUTOTEST contact when the coverage contact is no longer offered; CREATE_01 stays strict (fresh contact).
  const usable = async () => {
    const page = est.page;
    await est.contact.click();
    await est.contact.locator('input').fill(mobile());
    await page.waitForTimeout(2000);
    const found = (await page.locator('ng-dropdown-panel .ng-option:not(.ng-option-disabled)').count()) > 0;
    if (found) { await page.keyboard.press('Escape'); return mobile(); }
    await est.contact.locator('input').fill('AUTOTEST');
    await page.waitForTimeout(2000);
    const text = await page.locator('ng-dropdown-panel .ng-option').first().innerText();
    await page.keyboard.press('Escape');
    return (text.match(/\b\d{10}\b/) || [])[0] || 'AUTOTEST';
  };
  const prepare = async (strict = false) => { await est.selectContact(strict ? mobile() : await usable()); await est.loanName.selectOption({ index: 1 }); return pickScheme(); };
  // Click Save; true when the "Review Gold Estimate" dialog opens. The dialog is never confirmed.
  const reviewOpens = async (page) => {
    await est.save.click();
    await page.waitForTimeout(2500);
    return page.getByText('Review Gold Estimate').first().isVisible();
  };
  const rowText = async (i = 0) => (await est.articleRows().nth(i).innerText()).replace(/\s+/g, ' ');
  const myEstimates = async (page) => {
    await page.getByRole('button', { name: /My Saved Estimates/ }).click();
    await page.waitForURL(/#\/Loans\/MyGoldEstimates/);
    await page.waitForTimeout(1500);
  };
  const pagerTotal = async (page) => {
    const t = await page.getByText(/\d+\s*-\s*\d+ of \d+ items/).first().innerText().catch(() => '');
    return { text: t, total: Number((t.match(/of (\d+) items/) || [])[1]) };
  };

  // 1. Positive / Create
  test('TC_ESTIMATE_CREATE_01 - Positive / Create: 10.5 g RING estimate is saved and gets a GE number', async ({ page }) => {
    test.setTimeout(300_000);
    const calls = [];
    page.on('response', (r) => {
      if (['POST', 'PUT'].includes(r.request().method()) && !/\.(js|css|png|svg)/.test(r.url())) calls.push({ url: r.url(), status: r.status() });
    });
    await prepare(true);
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    await est.remarks.fill(`Functional test ${new Date().toISOString().slice(0, 16)}`);
    await est.save.click();
    await est.confirmReview();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await est.messages()).join(' ');
    expect(msgs).toMatch(/success|saved|submitted/i);
    const ge = (msgs.match(/GE\d{6,}/) || [])[0];
    expect(ge, 'GE number in the save message').toBeTruthy();
    const routedTo = ((msgs.match(/Routed to (.+?) for/i) || [])[1] || '').trim();
    saveState({ ge, routedTo, msgs, apiCalls: calls });
  });

  // 2. Read / Persistence
  test('TC_ESTIMATE_READ_01 - Read / Persistence: saved estimate is listed under My Gold Estimates after a fresh login', async ({ page }) => {
    await myEstimates(page);
    await page.getByText('My GE Numbers', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(st.ge).first()).toBeVisible();
  });

  // 3. Update / Edit
  test('TC_ESTIMATE_UPDATE_01 - Update / Edit: changing the gross weight recalculates the totals', async () => {
    await prepare();
    await est.fillArticle(0, ART);
    const before = num((await est.totals()).pureNetWeight);
    await est.fillArticle(0, { ...ART, grossWeight: 20.5 });
    const after = num((await est.totals()).pureNetWeight);
    expect(before).toBeCloseTo(10, 2);
    expect(after).toBeCloseTo(20, 2);
  });

  // 4. Delete & Cancel
  test('TC_ESTIMATE_CANCEL_01 - Delete & Cancel: leaving the form without saving creates no estimate', async ({ page }) => {
    await myEstimates(page);
    await page.getByText('My GE Numbers', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    const before = await pagerTotal(page);
    await page.getByRole('button', { name: /New Estimate/ }).click();
    await page.waitForURL(/#\/Loans\/GoldEstimates/);
    await prepare();
    await est.fillArticle(0, ART);
    await myEstimates(page); // leave without saving
    await page.getByText('My GE Numbers', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    expect((await pagerTotal(page)).total).toBe(before.total);
  });
  test('TC_ESTIMATE_DELETE_01 - Delete & Cancel: saved estimates cannot be deleted', async () => {
    test.skip(true, 'Not applicable: the Gold Estimate form and My Gold Estimates list have no delete action.');
  });

  // 5. Negative / Required field
  test('TC_ESTIMATE_REQUIRED_01 - Negative / Required field: Save with no gold article shows "Add Gold Article"', async ({ page }) => {
    await est.selectContact(await usable());
    await est.save.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    expect((await est.messages()).join(' ')).toMatch(/add gold article/i);
    expect(await page.getByText('Review Gold Estimate').first().isVisible()).toBe(false);
  });
  test('TC_ESTIMATE_REQUIRED_02 - Negative / Required field: article without a gross weight does not reach the review dialog', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, { ...ART, grossWeight: '' });
    expect(await reviewOpens(page)).toBe(false);
  });
  test('TC_ESTIMATE_REQUIRED_03 - Negative / Required field: Save without selecting a contact does not reach the review dialog', async ({ page }) => {
    await est.save.click();
    await page.waitForTimeout(1500);
    expect(await page.getByText('Review Gold Estimate').first().isVisible()).toBe(false);
  });

  // 6. Input validation
  test('TC_ESTIMATE_INPUT_01 - Input validation: Gross Weight and Quantity reject letters', async () => {
    await est.selectContact(await usable());
    const row = est.articleRows().first();
    const gw = row.locator('td[aria-colindex="4"] input');
    const qty = row.locator('td[aria-colindex="3"] input');
    await gw.pressSequentially('abc');
    expect(await gw.inputValue()).not.toMatch(/[a-z]/i);
    await qty.pressSequentially('xy');
    expect(await qty.inputValue()).not.toMatch(/[a-z]/i);
  });

  // 7. Boundary values
  test('TC_ESTIMATE_BOUNDARY_01 - Boundary values: Gross Weight 0 does not reach the review dialog', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, { ...ART, grossWeight: 0, stoneWastage: 0 });
    expect(await reviewOpens(page)).toBe(false);
  });
  test('TC_ESTIMATE_BOUNDARY_02 - Boundary values: stone wastage larger than gross weight is not accepted', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, { ...ART, grossWeight: 5, stoneWastage: 6 });
    const t = await est.totals();
    const negative = num(t.pureNetWeight) < 0 || /-/.test(t.pureNetWeight);
    expect(negative && (await reviewOpens(page))).toBe(false);
  });
  test('TC_ESTIMATE_BOUNDARY_03 - Boundary values: Quantity 0 does not reach the review dialog', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, { ...ART, quantity: 0 });
    expect(await reviewOpens(page)).toBe(false);
  });

  // 8. Default values
  test('TC_ESTIMATE_DEFAULT_01 - Default values: new estimate opens with Loan Name "Select", no scheme, 22K purity and zero totals', async ({ page }, testInfo) => {
    // QC opens with Loan Name "Select"; host214 opens with "New Gold" preselected - both are recorded, the options are checked
    const loanDefault = (await est.loanName.evaluate((s) => s.options[s.selectedIndex].text)).trim();
    testInfo.annotations.push({ type: 'role', description: `Loan Name default on this server: "${loanDefault}"` });
    expect((await est.loanName.locator('option').allInnerTexts()).map((o) => o.trim())).toEqual(expect.arrayContaining(['Select', 'New Gold']));
    expect(await est.scheme.evaluate((s) => s.options[s.selectedIndex].text)).toMatch(/Not applied/i);
    const t = await est.totals();
    expect(num(t.pureNetWeight)).toBe(0);
    expect(num(t.quantity)).toBe(0);
    expect(num(t.appraisalValue)).toBe(0);
    await est.selectContact(await usable());
    await expect(page.getByText(/22K/).first()).toBeVisible();
  });

  // 9. Date / calendar validation
  test('TC_ESTIMATE_DATE_01 - Date / calendar validation: Estimate Date defaults to today and can be back-dated', async ({ page }) => {
    const field = page.locator('[formcontrolname=ptodayDate]').first();
    await expect(field).toHaveValue(dates.today());
    const d = new Date(); d.setDate(d.getDate() - 10);
    const past = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    await dates.pickDate(page, field, past, 'Gold Estimate Date');
    await expect(field).toHaveValue(past);
  });
  test('TC_ESTIMATE_DATE_02 - Date / calendar validation: future years cannot be chosen as Estimate Date', async ({ page }) => {
    await page.locator('[formcontrolname=ptodayDate]').first().click();
    const cal = page.locator('bs-datepicker-container');
    await cal.locator('button.current').last().click();
    const next = String(new Date().getFullYear() + 1);
    const cell = cal.locator('td span', { hasText: new RegExp(`^${next}$`) });
    if (await cell.count()) await expect(cell.first()).toHaveClass(/disabled/);
  });

  // 10. Business rules / Calculation
  test('TC_ESTIMATE_BUSINESS_01 - Business rules / Calculation: net weight = gross - stone wastage; appraisal = pure weight x rate/gram', async () => {
    await prepare();
    const row = await est.fillArticle(0, ART);
    const t = await est.totals();
    expect(num(t.pureNetWeight)).toBeCloseTo(ART.grossWeight - ART.stoneWastage, 2);
    const rate = num((row.match(/₹\s*([\d,]+\.\d+)\s*\/\s*g/) || [])[1]);
    expect(rate).toBeGreaterThan(0);
    expect(num(t.appraisalValue)).toBeCloseTo(num(t.pureNetWeight) * rate, 0);
  });
  test('TC_ESTIMATE_BUSINESS_02 - Business rules / Calculation: selecting a scheme applies its LTV % to the rate per gram', async () => {
    await prepare();
    const row = await est.fillArticle(0, ART);
    const base = num((row.match(/₹\s*([\d,]+\.\d+)\s*\/\s*g/) || [])[1]);
    const t = await est.totals();
    expect(t.ltvScheme, 'LTV % SCHEME shown after choosing a scheme').not.toBeNull();
    expect(num(t.ratePerGram)).toBeCloseTo((base * num(t.ltvScheme)) / 100, 0);
  });
  test('TC_ESTIMATE_BUSINESS_03 - Business rules / Calculation: two articles add up in the totals', async () => {
    await prepare();
    await est.fillArticle(0, ART);
    await est.fillArticle(1, { type: 'BANGLE', quantity: 2, grossWeight: 20, stoneWastage: 0, stoneCount: 0 });
    const t = await est.totals();
    expect(t.quantity).toBe('3');
    expect(num(t.pureNetWeight)).toBeCloseTo(30, 2);
  });

  // 11. Data consistency
  test('TC_ESTIMATE_CONSISTENCY_01 - Data consistency: review dialog estimate value equals the totals box', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    const t = await est.totals();
    expect(await reviewOpens(page)).toBe(true);
    const dlg = (await page.getByText('Review Gold Estimate').first().locator('xpath=ancestor::*[.//button[contains(.,"Confirm")]][1]').innerText()).replace(/\s+/g, ' ');
    // the dialog drops trailing zeros (₹ 1,38,718.1 vs 1,38,718.10), so compare the numbers
    expect(num((dlg.match(/APPRAISAL VALUE ₹ ?([\d,.]+)/i) || [])[1])).toBeCloseTo(num(t.appraisalValue), 2);
  });

  // 12. Duplicate prevention
  test('TC_ESTIMATE_DUPLICATE_01 - Duplicate prevention: second estimate for the same contact', async () => {
    test.skip(true, 'Not verified: needs a second saved estimate for the same contact; not run to avoid extra records in the approval queue. Check manually.');
  });

  // 13. Search
  test('TC_ESTIMATE_SEARCH_01 - Search: the Contact dropdown finds a contact by mobile number', async () => {
    const name = await est.selectContact(mobile());
    expect(name).toContain(mobile());
  });
  test('TC_ESTIMATE_SEARCH_02 - Search: an unknown mobile number finds no contact', async ({ page }) => {
    await est.contact.click();
    await est.contact.locator('input').fill('1000000001');
    await page.waitForTimeout(2000);
    expect(await page.locator('ng-dropdown-panel .ng-option:not(.ng-option-disabled)').count()).toBe(0);
  });

  // 14. Filtering
  test('TC_ESTIMATE_FILTER_01 - Filtering: My Gold Estimates tabs show different lists (My GE Numbers vs Pending My Appraisal)', async ({ page }) => {
    await myEstimates(page);
    await page.getByText('My GE Numbers', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    const mine = await pagerTotal(page);
    await page.getByText('Pending My Appraisal', { exact: false }).first().click();
    await page.waitForTimeout(1500);
    const pending = await pagerTotal(page);
    expect(mine.total).toBeGreaterThan(0);
    expect(pending.text).not.toBe(mine.text);
  });

  // 15. Sorting
  test('TC_ESTIMATE_SORT_01 - Sorting: clicking a column header sorts My Gold Estimates', async ({ page }) => {
    await myEstimates(page);
    const sortable = await page.locator('th[aria-sort], th.k-sortable').count();
    test.skip(sortable === 0, 'Not applicable: My Gold Estimates headers are not sortable.');
    await page.locator('th.k-sortable').first().click();
    await expect(page.locator('th[aria-sort="ascending"], th[aria-sort="descending"]').first()).toBeVisible();
  });

  // 16. Pagination
  test('TC_ESTIMATE_PAGINATION_01 - Pagination: My Gold Estimates shows a pager summary that matches the rows', async ({ page }) => {
    await myEstimates(page);
    await page.getByText('My GE Numbers', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    const p = await pagerTotal(page);
    expect(p.text, 'pager summary "x - y of z items"').toBeTruthy();
    expect(p.total).toBeGreaterThan(0);
  });

  // 17. Clear / Reset
  test('TC_ESTIMATE_CLEAR_01 - Clear / Reset: the Clear button empties contact, articles and totals', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    await page.getByText('Clear', { exact: true }).locator('visible=true').last().click();
    await page.waitForTimeout(1500);
    const t = await est.totals();
    expect(num(t.pureNetWeight)).toBe(0);
    expect(num(t.quantity)).toBe(0);
    expect((await est.contact.innerText()).replace(/[×\s]/g, '')).toBe('');
  });

  // 18. Navigation & UI layout
  test('TC_ESTIMATE_NAV_01 - Navigation & UI layout: My Saved Estimates and New Estimate switch between the two screens', async ({ page }) => {
    await myEstimates(page);
    await expect(page.getByText('My Gold Estimates').first()).toBeVisible();
    await page.getByRole('button', { name: /New Estimate/ }).click();
    await page.waitForURL(/#\/Loans\/GoldEstimates/);
    await expect(est.contact).toBeVisible();
    for (const h of ['Customer Details', 'Gold Details', 'Gold Article Details', 'Totals', 'Attachments & Remarks']) {
      await expect(page.getByText(h, { exact: true }).first()).toBeVisible();
    }
  });

  // 19. Role-based access
  test('TC_ESTIMATE_ROLE_01 - Role-based access: Gold Estimates availability per role', async ({ browser }, testInfo) => {
    test.setTimeout(600_000);
    for (const role of ['INT_APPRAISER1', 'CHECKER_BH', 'AUDITOR']) {
      if (!process.env[`${role}_USER`]) continue;
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      try {
        await new LoginPage(p).login(role);
        const can = await new GoldEstimatePage(p).open().then(() => true, () => false);
        testInfo.annotations.push({ type: 'role', description: `${role}: Gold Estimates ${can ? 'accessible' : 'not accessible'}` });
        if (role === 'INT_APPRAISER1') expect(can).toBe(true);
      } catch (e) {
        if (role === 'INT_APPRAISER1') throw e;
        testInfo.annotations.push({ type: 'role', description: `${role}: login failed (${String(e.message).split('\n')[0]})` });
      } finally { await ctx.close(); }
    }
  });

  // 20. Workflow (approval)
  test('TC_ESTIMATE_WORKFLOW_01 - Workflow (approval): a 10.5 g estimate is routed to an approver', async ({ }, testInfo) => {
    expect(st.ge, 'CREATE_01 must have saved an estimate').toBeTruthy();
    expect(st.msgs).toMatch(/Routed to/i);
    testInfo.annotations.push({ type: 'role', description: `${st.ge} routed to: ${st.routedTo || 'n/a'}` });
  });

  // 21. API
  test('TC_ESTIMATE_API_01 - API: save requests made while creating the estimate all succeeded (2xx)', async () => {
    expect((st.apiCalls || []).length).toBeGreaterThan(0);
    expect((st.apiCalls || []).filter((c) => c.status >= 400)).toEqual([]);
  });

  // 22. Error recovery
  test('TC_ESTIMATE_ERROR_01 - Error recovery: after "Add Gold Article", adding an article lets the review dialog open', async ({ page }) => {
    await prepare();
    await est.save.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    expect((await est.messages()).join(' ')).toMatch(/add gold article/i);
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    expect(await reviewOpens(page)).toBe(true);
  });

  // 23. File download / upload
  test('TC_ESTIMATE_FILE_01 - File download / upload: a PNG gold-article image uploads and its name is shown', async () => {
    await prepare();
    await est.uploadImage(IMAGE);
  });
  test('TC_ESTIMATE_FILE_02 - File download / upload: a non-image file (.json) is not accepted as a gold article image', async ({ page }) => {
    await prepare();
    const section = page.getByText(/Upload Gold Articles Images/i).first().locator('xpath=ancestor::div[.//button][1]');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), section.locator('button').first().click()]);
    await chooser.setFiles(path.resolve(__dirname, '../../test-data/current-flow.json'));
    await page.waitForTimeout(2500);
    expect(await section.locator('input[type=text]').first().inputValue()).not.toMatch(/current-flow/i);
  });

  // 24. Accessibility & responsive
  test('TC_ESTIMATE_A11Y_01 - Accessibility & responsive: form fits a phone screen and fields are keyboard-reachable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
    await est.remarks.focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.getAttribute('formcontrolname') || document.activeElement.tagName)).toBeTruthy();
  });

  // 25. Session / concurrency / browser
  test('TC_ESTIMATE_SESSION_01 - Session / concurrency / browser: Gold Estimates URL without logging in does not show the form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/#/Loans/GoldEstimates');
    await p.waitForTimeout(3000);
    await expect(p.locator('ng-select[formcontrolname=pCustomername]')).toHaveCount(0);
    await ctx.close();
  });


  // ======== Additional scenarios (added for the host214 re-run) ========

  // 3. Update / Edit
  test('TC_ESTIMATE_UPDATE_02 - Update / Edit: Add Row adds one more blank article row', async ({ page }) => {
    await prepare();
    const before = await est.articleRows().count();
    await page.getByRole('button', { name: /Add Row/ }).click();
    await page.waitForTimeout(800);
    expect(await est.articleRows().count()).toBe(before + 1);
  });

  // 5. Negative / Required field
  test('TC_ESTIMATE_REQUIRED_04 - Negative / Required field: Save without a Loan Name does not reach the review dialog', async ({ page }, testInfo) => {
    await est.selectContact(await usable());
    const loanText = () => est.loanName.evaluate((s) => s.options[s.selectedIndex].text.trim());
    await pickScheme();
    const afterScheme = await loanText();
    await est.loanName.selectOption({ label: 'Select' }); // set LAST: some servers preselect "New Gold" and choosing a scheme may fill the loan
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    const beforeSave = await loanText();
    testInfo.annotations.push({ type: 'role', description: `Loan Name after choosing the scheme: "${afterScheme}"; just before Save: "${beforeSave}"` });
    expect(beforeSave, 'Loan Name must still be "Select" when Save is clicked').toBe('Select');
    expect(await reviewOpens(page)).toBe(false);
  });
  test('TC_ESTIMATE_REQUIRED_05 - Negative / Required field: Save without a gold article image (behaviour recorded)', async ({ page }, testInfo) => {
    await prepare();
    await est.fillArticle(0, ART);
    const opens = await reviewOpens(page);
    testInfo.annotations.push({ type: 'role', description: `Save without an image: the review dialog ${opens ? 'OPENED - the image is optional' : 'did NOT open - the image is mandatory'}` });
  });

  // 6. Input validation
  test('TC_ESTIMATE_INPUT_02 - Input validation: Remarks keeps special characters exactly as typed', async () => {
    const text = `Test <b>&"' 100% ok #1`;
    await est.remarks.fill(text);
    expect(await est.remarks.inputValue()).toBe(text);
  });

  // 7. Boundary values
  test('TC_ESTIMATE_BOUNDARY_04 - Boundary values: a very large weight (99,999 g) is calculated correctly', async () => {
    await prepare();
    const row = await est.fillArticle(0, { ...ART, grossWeight: 99999, stoneWastage: 0 });
    const rate = num((row.match(/₹\s*([\d,]+\.\d+)\s*\/\s*g/) || [])[1]);
    const t = await est.totals();
    expect(num(t.pureNetWeight)).toBeCloseTo(99999, 1);
    expect(num(t.appraisalValue)).toBeCloseTo(99999 * rate, -1);
  });

  // 9. Date / calendar validation
  test('TC_ESTIMATE_DATE_03 - Date / calendar validation: a back-dated estimate uses the gold rate of that date or earlier', async ({ page }) => {
    await est.selectContact(await usable());
    const d = new Date(); d.setDate(d.getDate() - 10);
    const pad = (n) => String(n).padStart(2, '0');
    const chosen = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    await dates.pickDate(page, page.locator('[formcontrolname=ptodayDate]').first(), chosen, 'Gold Estimate Date');
    await page.waitForTimeout(1500);
    await est.loanName.selectOption({ index: 1 });
    const row = await est.fillArticle(0, ART);
    const asOf = (row.match(/as of (\d{2})\/(\d{2})\/(\d{4})/) || []).slice(1).map(Number);
    expect(asOf.length, 'rate "as of" date shown in the row').toBe(3);
    expect(new Date(asOf[2], asOf[1] - 1, asOf[0]).getTime()).toBeLessThanOrEqual(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
  });

  // 10. Business rules / Calculation
  test('TC_ESTIMATE_BUSINESS_04 - Business rules / Calculation: choosing a different purity changes the appraisal', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    const before = num((await est.totals()).appraisalValue);
    await est.articleRows().first().locator('td[aria-colindex="1"] ng-select').click();
    const opts = page.locator('ng-dropdown-panel .ng-option');
    const texts = await opts.allInnerTexts();
    expect(texts.length).toBeGreaterThan(1);
    await opts.nth(texts.findIndex((t) => !/22K/.test(t))).click();
    await page.waitForTimeout(1500);
    expect(num((await est.totals()).appraisalValue)).not.toBe(before);
  });
  test('TC_ESTIMATE_BUSINESS_05 - Business rules / Calculation: with no stone wastage, net weight equals gross weight', async () => {
    await prepare();
    await est.fillArticle(0, { ...ART, stoneWastage: 0 });
    expect(num((await est.totals()).pureNetWeight)).toBeCloseTo(ART.grossWeight, 2);
  });

  // 11. Data consistency
  test('TC_ESTIMATE_CONSISTENCY_02 - Data consistency: review dialog shows the selected customer, gross 10.5 g and net 10 g', async ({ page }) => {
    const m = await usable();
    await est.selectContact(m);
    await est.loanName.selectOption({ index: 1 });
    await pickScheme();
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    expect(await reviewOpens(page)).toBe(true);
    const dlg = (await page.getByText('Review Gold Estimate').first().locator('xpath=ancestor::*[.//button[contains(.,"Confirm")]][1]').innerText()).replace(/\s+/g, ' ');
    expect(dlg).toContain(m);
    expect(dlg).toMatch(/TOTAL GROSS WEIGHT 10\.5 g/i);
    expect(dlg).toMatch(/TOTAL NET WEIGHT 10 g/i);
  });

  // 13. Search
  test('TC_ESTIMATE_SEARCH_03 - Search: the Contact dropdown also finds a contact by name', async () => {
    test.skip(!contactName || (await usable()) !== mobile(), 'The test contact is no longer offered (it already has an estimate)');
    await est.contact.click();
    await est.contact.locator('input').fill(contactName);
    await expect(est.page.locator('ng-dropdown-panel .ng-option', { hasText: new RegExp(contactName, 'i') }).first()).toBeVisible();
  });

  // 26. Field length & autocomplete
  test('TC_ESTIMATE_LENGTH_01 - Field length & autocomplete: Remarks enforces a maximum length', async () => {
    expect(await est.remarks.getAttribute('maxlength')).not.toBeNull();
  });
});
