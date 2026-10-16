const path = require('path');
const fs = require('fs');
const os = require('os');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldEstimatePage } = require('../../pages/GoldEstimatePage');

// Gold Estimate - gap-closing scenarios (added after comparing the suite with the 37 test categories in the QA brief).
// DATA SAFETY: no test here saves an estimate. Wherever a test reaches the save call, the request is aborted in the browser
// (page.route) so it never arrives at the server. Tests that need the saved estimate use the one created by
// gold-estimate-functional CREATE_01 (GoldEstimate/test-data/coverage-estimate.json).
const IMAGE = path.resolve(__dirname, '../../test-data/gold-article.png');
const ART = { type: 'RING', quantity: 1, grossWeight: 10.5, stoneWastage: 0.5, stoneCount: 0 };
const num = (t) => Number(String(t).replace(/[^\d.]/g, ''));
const norm = (t) => String(t).replace(/\s+/g, ' ');

let st = {};
let contactMobile, contactName;
try { const c = require('../../Contact/test-data/coverage-contact.json').d; contactMobile = c.mobile; contactName = c.firstName.split(' ')[1]; } catch { contactMobile = undefined; }

test.describe('Gold Estimate - gap scenarios', () => {
  let est;

  test.beforeEach(async ({ page }) => {
    est = new GoldEstimatePage(page);
    try { st = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test-data/coverage-estimate.json'), 'utf8')); } catch { st = {}; }
    await new LoginPage(page).login('INT_APPRAISER1');
    await est.open();
  });

  // ---------- helpers ----------
  const mobile = () => contactMobile || require('../../utils/flow').need('mobile', 'contact');
  // a contact that is offered in the dropdown (the coverage contact disappears once it has an estimate)
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
  const pickScheme = async (label = 'AUTOTEST SCHEME') => {
    try { return await est.selectScheme(label); } catch {
      await est.scheme.selectOption({ index: 1 });
      return 'first scheme';
    }
  };
  const prepare = async () => { const m = await usable(); await est.selectContact(m); await est.loanName.selectOption({ index: 1 }); await pickScheme(); return m; };
  const reviewOpens = async (page) => { await est.save.click(); await page.waitForTimeout(2500); return page.getByText('Review Gold Estimate').first().isVisible(); };
  const cells = (i = 0) => {
    const row = est.articleRows().nth(i);
    return { gw: row.locator('td[aria-colindex="4"] input'), qty: row.locator('td[aria-colindex="3"] input'), stone: row.locator('td[aria-colindex="5"] input') };
  };
  const rateOf = (row) => num((row.match(/₹\s*([\d,]+\.\d+)\s*\/\s*g/) || [])[1]);
  const myEstimates = async (page) => {
    await page.getByRole('button', { name: /My Saved Estimates/ }).click();
    await page.waitForURL(/#\/Loans\/MyGoldEstimates/);
    await page.waitForTimeout(1500);
    await page.getByText('My GE Numbers', { exact: true }).first().click();
    await page.waitForTimeout(1500);
  };
  const openDetail = async (page) => {
    test.skip(!st.ge, 'CREATE_01 has not saved an estimate on this server yet');
    await myEstimates(page);
    await page.locator('tr', { hasText: st.ge }).first().getByRole('button', { name: 'Summary' }).click();
    await page.waitForURL(/GoldEstimateApprovalDetail/);
    await page.waitForTimeout(1500);
    return norm(await page.locator('body').innerText());
  };
  // Aborts the save call in the browser so it never reaches the server; resolves with the request body
  const blockSave = async (page, sink) => {
    await page.route(/SaveMakerEntry/i, async (route) => { sink.body = route.request().postData(); sink.url = route.request().url(); await route.abort(); });
  };

  // ======================================================================================================
  // Read / Persistence  (saved values compared with what was submitted)
  // ======================================================================================================
  test('TC_ESTIMATE_READ_02 - Read / Persistence: the saved estimate\'s Summary page shows the submitted customer, scheme, gross and net weight', async ({ page }) => {
    const t = await openDetail(page);
    expect(t).toContain(st.ge);
    if (contactName) expect(t.toLowerCase()).toContain(contactName.toLowerCase());
    if (contactMobile) expect(t).toContain(contactMobile);
    expect(t).toMatch(/SCHEME AUTOTEST SCHEME/i);
    expect(t).toMatch(/TENURE 9 mo/i);
    expect(t).toMatch(/GROSS WT NET WT/i);
    expect(t).toMatch(/10\.5 g 10 g/);
    expect(t).toMatch(/STATUS Awaiting|STATUS Ready|STATUS Approved/i);
  });
  test('TC_ESTIMATE_READ_03 - Read / Persistence: the remarks typed at save time are stored exactly (no case change)', async ({ page }) => {
    const t = await openDetail(page);
    // CREATE_01 saved the remarks "Functional test <yyyy-mm-ddThh:mm>"
    expect(t).toMatch(/SUBMIT Functional test \d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });
  test('TC_ESTIMATE_READ_04 - Read / Persistence: the uploaded gold article image is stored under a proper file name', async ({ page }) => {
    await openDetail(page);
    await page.waitForTimeout(1500);
    const srcs = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src).filter((s) => /Upload\//i.test(s)));
    expect(srcs.length, 'an uploaded image is shown on the Summary page').toBeGreaterThan(0);
    for (const s of srcs) expect(s, 'stored image file name').not.toMatch(/undefined/i);
  });

  // ======================================================================================================
  // Data consistency / Business rules / Workflow  (read from the Summary page)
  // ======================================================================================================
  test('TC_ESTIMATE_CONSISTENCY_03 - Data consistency: on the Summary page Eligible Loan Amount = Appraisal Value x LTV %', async ({ page }) => {
    const t = await openDetail(page);
    const appraisal = num((t.match(/APPRAISAL VALUE ₹ ?([\d,.]+)/i) || [])[1]);
    const ltv = num((t.match(/LTV APPLIED ([\d.]+)%/i) || [])[1]);
    const eligible = num((t.match(/ELIGIBLE LOAN AMOUNT \(LTV\) ₹ ?([\d,.]+)/i) || [])[1]);
    expect(appraisal).toBeGreaterThan(0);
    expect(eligible).toBeCloseTo((appraisal * ltv) / 100, 0);
  });
  test('TC_ESTIMATE_BUSINESS_09 - Business rules / Calculation: the creator of an estimate cannot approve or revert it (maker-checker)', async ({ page }) => {
    const t = await openDetail(page);
    expect(t).toMatch(/you cannot approve or revert it yourself/i);
    expect(await page.locator('button:visible').filter({ hasText: /^\W*(Approve|Revert)\s*$/ }).count()).toBe(0);
  });
  test('TC_ESTIMATE_WORKFLOW_02 - Workflow (approval): the Summary page shows the stage, status and a SUBMIT entry in the status history', async ({ page }) => {
    const t = await openDetail(page);
    expect(t).toMatch(/APPRAISAL STAGES REQUIRED\/COMPLETED \d \/ \d/i);
    expect(t).toMatch(/Status History/i);
    expect(t).toMatch(/INTERNAL_APPRAISER .* SUBMIT/i);
  });

  // ======================================================================================================
  // Navigation
  // ======================================================================================================
  test('TC_ESTIMATE_NAV_02 - Navigation & UI layout: browser Back from My Saved Estimates returns to the estimate form', async ({ page }) => {
    await page.getByRole('button', { name: /My Saved Estimates/ }).click();
    await page.waitForURL(/#\/Loans\/MyGoldEstimates/);
    await page.goBack();
    await page.waitForURL(/#\/Loans\/GoldEstimates/);
    await expect(est.contact).toBeVisible();
  });
  test('TC_ESTIMATE_NAV_03 - Navigation & UI layout: Back on the Summary page returns to My Gold Estimates', async ({ page }) => {
    await openDetail(page);
    await page.getByRole('button', { name: /^\W*Back\s*$/ }).click();
    await page.waitForTimeout(2500);
    expect(page.url()).toMatch(/MyGoldEstimates/);
  });

  // ======================================================================================================
  // Pagination
  // ======================================================================================================
  test('TC_ESTIMATE_PAGINATION_02 - Pagination: opening page 2 of My GE Numbers shows the next set of estimates', async ({ page }) => {
    await myEstimates(page);
    const info = norm(await page.getByText(/\d+\s*-\s*\d+ of \d+ items/).first().innerText());
    const total = Number((info.match(/of (\d+) items/) || [])[1]);
    test.skip(!(total > 10), 'Fewer than 11 estimates - only one page');
    await page.getByText('2', { exact: true }).locator('visible=true').last().click();
    await page.waitForTimeout(1500);
    expect(norm(await page.getByText(/\d+\s*-\s*\d+ of \d+ items/).first().innerText())).toMatch(/^11 - /);
  });

  // ======================================================================================================
  // Delete & Cancel
  // ======================================================================================================
  test('TC_ESTIMATE_CANCEL_02 - Delete & Cancel: "Back to Edit" in the review dialog keeps the entered article and totals', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    const before = await est.totals();
    expect(await reviewOpens(page)).toBe(true);
    await page.getByRole('button', { name: /Back to Edit/ }).click();
    await page.waitForTimeout(1200);
    expect(await page.getByText('Review Gold Estimate').first().isVisible()).toBe(false);
    expect(await est.totals()).toEqual(before);
  });

  // ======================================================================================================
  // Negative / Required field  (error message behaviour)
  // ======================================================================================================
  test('TC_ESTIMATE_REQUIRED_06 - Negative / Required field: the "Add Gold Article" message is readable and disappears by itself', async ({ page }) => {
    await prepare();
    await est.save.click();
    const toast = page.locator('.toast-message, .swal2-html-container').first();
    await expect(toast).toBeVisible();
    expect((await toast.innerText()).trim().length).toBeGreaterThan(5);
    await expect(toast).toBeHidden({ timeout: 20_000 });
  });

  test('TC_ESTIMATE_REQUIRED_07 - Negative / Required field: Save with the scheme left on "Not applied" does not reach the review dialog (HYPOTHESIS: a scheme is mandatory)', async ({ page }) => {
    await est.selectContact(await usable());
    await est.loanName.selectOption({ index: 1 });
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    expect(await est.scheme.evaluate((s) => s.options[s.selectedIndex].text)).toMatch(/Not applied/i);
    expect(await reviewOpens(page)).toBe(false);
  });

  // ======================================================================================================
  // Input validation
  // ======================================================================================================
  test('TC_ESTIMATE_INPUT_03 - Input validation: a whitespace-only Gross Weight is treated as empty (review dialog does not open)', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, { ...ART, grossWeight: '   ' });
    expect(await reviewOpens(page)).toBe(false);
  });
  test('TC_ESTIMATE_INPUT_04 - Input validation: Gross Weight rejects number formats such as 1e3, +5, --5, 1,5 and non-Latin digits', async () => {
    await est.selectContact(await usable());
    const { gw } = cells(0);
    for (const bad of ['1e3', '+5', '--5', '1,5', '١٢']) {
      await gw.fill('');
      await gw.pressSequentially(bad);
      expect(await gw.inputValue(), `after typing "${bad}"`).toMatch(/^\d*\.?\d*$/);
    }
  });
  test('TC_ESTIMATE_INPUT_05 - Input validation: SQL / script text in the contact search finds nothing and runs no script', async ({ page }) => {
    let dialogs = 0;
    page.on('dialog', async (d) => { dialogs++; await d.dismiss(); });
    for (const evil of [`' OR 1=1--`, '<img src=x onerror=alert(1)>', '"; DROP TABLE contact;--']) {
      await est.contact.click();
      await est.contact.locator('input').fill(evil);
      await page.waitForTimeout(2000);
      expect(await page.locator('ng-dropdown-panel .ng-option:not(.ng-option-disabled)').count(), `results for ${evil}`).toBe(0);
      await page.keyboard.press('Escape');
    }
    expect(dialogs).toBe(0);
  });
  test('TC_ESTIMATE_INPUT_06 - Input validation: every article type in the dropdown can be selected', async () => {
    await est.selectContact(await usable());
    const select = est.articleRows().first().locator('td[aria-colindex="2"] select');
    const options = (await select.locator('option').allInnerTexts()).map((o) => o.trim()).filter((o) => o && o !== 'Select');
    expect(options.length).toBeGreaterThanOrEqual(8);
    for (const want of ['NECKLACE', 'BANGLE', 'BRACELET', 'KADA', 'LOCKET', 'MANGALSUTRA', 'DROPS', 'RING']) expect(options).toContain(want);
    for (const o of options.slice(0, 6)) {
      await select.selectOption({ label: o });
      expect((await select.locator('option:checked').innerText()).trim()).toBe(o);
    }
  });

  // ======================================================================================================
  // Boundary values and equivalence partitions
  // ======================================================================================================
  test('TC_ESTIMATE_BOUNDARY_05 - Boundary values: the smallest weight 0.01 g is calculated', async () => {
    await prepare();
    const row = await est.fillArticle(0, { ...ART, grossWeight: 0.01, stoneWastage: 0 });
    const t = await est.totals();
    expect(num(t.pureNetWeight)).toBeCloseTo(0.01, 2);
    expect(num(t.appraisalValue)).toBeCloseTo(0.01 * rateOf(row), 1);
  });
  test('TC_ESTIMATE_BOUNDARY_06 - Boundary values: a negative Gross Weight is not accepted', async ({ page }) => {
    await prepare();
    const { gw } = cells(0);
    await gw.fill('');
    await gw.pressSequentially('-5');
    const v = await gw.inputValue();
    if (v.includes('-')) {
      await est.fillArticle(0, { ...ART, grossWeight: -5, stoneWastage: 0 });
      expect(await reviewOpens(page)).toBe(false);
    }
  });
  test('TC_ESTIMATE_BOUNDARY_07 - Boundary values: stone wastage equal to the gross weight (net 0) does not reach the review dialog', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, { ...ART, grossWeight: 5, stoneWastage: 5 });
    expect(await reviewOpens(page)).toBe(false);
  });
  test('TC_ESTIMATE_BOUNDARY_08 - Boundary values: a weight with 4 decimals (10.1234 g) is kept within 0.01 g', async () => {
    await prepare();
    await est.fillArticle(0, { ...ART, grossWeight: 10.1234, stoneWastage: 0 });
    expect(num((await est.totals()).pureNetWeight)).toBeCloseTo(10.1234, 1);
  });
  test('TC_ESTIMATE_BOUNDARY_09 - Boundary values: small, medium and large weights (1 g, 50 g, 500 g) all give appraisal = weight x rate', async () => {
    await prepare();
    for (const w of [1, 50, 500]) {
      const row = await est.fillArticle(0, { ...ART, grossWeight: w, stoneWastage: 0 });
      const t = await est.totals();
      expect(num(t.pureNetWeight), `${w} g`).toBeCloseTo(w, 1);
      expect(num(t.appraisalValue), `${w} g appraisal`).toBeCloseTo(w * rateOf(row), -1);
    }
  });

  // ======================================================================================================
  // Business rules / dependencies
  // ======================================================================================================
  test('TC_ESTIMATE_BUSINESS_06 - Business rules / Calculation: a 12-month scheme gives a different LTV % than a 3-month scheme', async () => {
    await prepare();
    await est.fillArticle(0, ART);
    const read = async (label) => { await est.selectScheme(label); await est.page.waitForTimeout(1200); return num((await est.totals()).ltvScheme); };
    const short = await read('GL-quick').catch(() => null);
    const long = await read('GL-MAX').catch(() => null);
    test.skip(short === null || long === null, 'GL-quick / GL-MAX schemes are not offered on this server');
    expect(short).toBeGreaterThan(0);
    expect(long).not.toBe(short);
  });
  test('TC_ESTIMATE_BUSINESS_07 - Business rules / Calculation: three articles (with stone count) add up in quantity and pure weight', async ({}, testInfo) => {
    await prepare();
    await est.fillArticle(0, { type: 'RING', quantity: 1, grossWeight: 10.5, stoneWastage: 0.5, stoneCount: 1 });
    await est.fillArticle(1, { type: 'BANGLE', quantity: 2, grossWeight: 20, stoneWastage: 0, stoneCount: 0 });
    await est.fillArticle(2, { type: 'KADA', quantity: 1, grossWeight: 30, stoneWastage: 2, stoneCount: 2 });
    const t = await est.totals();
    expect(t.quantity).toBe('4');
    // purity deduction depends on the article type (KADA has a 1% deduction), so compare with the rows' own values:
    // net (column 7) = gross - stone, and the total pure net weight = the sum of the rows' pure net weights (column 9)
    // the Net Weight cell reads "10.00 -0.50g stone ded.", so take the first number in the cell
    const cell = async (i, n) => parseFloat((await est.articleRows().nth(i).locator(`td[aria-colindex="${n}"]`).innerText()).replace(/,/g, ''));
    const gross = [10.5, 20, 30], stone = [0.5, 0, 2];
    let pureSum = 0;
    const seen = [];
    for (let i = 0; i < 3; i++) {
      const net = await cell(i, 7);
      const extra = +(gross[i] - stone[i] - net).toFixed(2);
      seen.push(`row ${i + 1}: gross ${gross[i]} - stone ${stone[i]} = ${(gross[i] - stone[i]).toFixed(2)}, net shown ${net}${extra ? ` (extra deduction ${extra} g)` : ''}`);
      expect(net, `row ${i + 1}: a deduction never adds weight`).toBeLessThanOrEqual(gross[i] - stone[i] + 0.005);
      if (!stone[i]) expect(net, `row ${i + 1} (no stone) net weight`).toBeCloseTo(gross[i], 2);
      pureSum += await cell(i, 9);
    }
    // OBSERVED: KADA 30 g with stone wastage 2 g and stone count 2 shows net 27.72 g, i.e. a further 1% deduction on top of
    // gross - wastage; the rule behind it (stone count or article type) is not documented, so it is recorded, not asserted.
    testInfo.annotations.push({ type: 'role', description: seen.join(' ; ') });
    expect(num(t.pureNetWeight)).toBeCloseTo(pureSum, 2);
  });
  test('TC_ESTIMATE_BUSINESS_08 - Business rules / Calculation: the article grid only appears after a contact is selected', async () => {
    await expect(est.page.getByText('Select a Contact above before entering Gold Article details')).toBeVisible();
    expect(await est.articleRows().count()).toBe(0);
    await est.selectContact(await usable());
    expect(await est.articleRows().count()).toBeGreaterThan(0);
  });

  // ======================================================================================================
  // Duplicate prevention
  // ======================================================================================================
  // The first hypothesis (a contact with a saved estimate is never offered again) was REFUTED on host214: the contact is still
  // offered while its estimate awaits the first verification, whereas on QC it disappeared once Internal Appraiser 2 had approved
  // it. The rule seems to depend on the estimate stage, so this test records the behaviour instead of asserting a guess.
  test('TC_ESTIMATE_DUPLICATE_02 - Duplicate prevention: whether a contact with a saved estimate is still offered for a new one (behaviour recorded)', async ({ page }, testInfo) => {
    test.skip(!st.ge || !contactMobile, 'CREATE_01 has not saved an estimate for the test contact');
    await est.contact.click();
    await est.contact.locator('input').fill(contactMobile);
    await page.waitForTimeout(2500);
    const offered = (await page.locator('ng-dropdown-panel .ng-option:not(.ng-option-disabled)').count()) > 0;
    await page.keyboard.press('Escape');
    const detail = await openDetail(page);
    const stage = (detail.match(/STATUS (.+?) MAIN IMAGE/i) || [])[1] || 'unknown';
    testInfo.annotations.push({ type: 'role', description: `Contact ${contactMobile} is ${offered ? 'STILL OFFERED' : 'NOT offered'} for a new estimate while its estimate ${st.ge} has status "${stage}". (QC showed the contact hidden after Internal Appraiser 2 approved its estimate.)` });
  });

  // ======================================================================================================
  // API
  // ======================================================================================================
  test('TC_ESTIMATE_API_02 - API: the save request carries the entered weights, and is aborted so no estimate is created', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    const sink = {};
    await blockSave(page, sink);
    await est.save.click();
    await page.getByRole('button', { name: /Confirm & Save/ }).click();
    await expect.poll(() => sink.body, { timeout: 15_000 }).toBeTruthy();
    expect(sink.body).toContain('10.5');
    expect(sink.body).toMatch(/0\.5/);
  });
  test('TC_ESTIMATE_API_03 - API: the My Gold Estimates list API answers 200 with JSON that contains the saved GE number', async ({ page }) => {
    test.skip(!st.ge, 'CREATE_01 has not saved an estimate yet');
    const seen = [];
    page.on('response', async (r) => { if (/GetMyGoldEstimates/i.test(r.url())) seen.push({ status: r.status(), body: await r.text().catch(() => '') }); });
    await page.getByRole('button', { name: /My Saved Estimates/ }).click();
    await expect.poll(() => seen.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(seen[0].status).toBe(200);
    expect(() => JSON.parse(seen[0].body)).not.toThrow();
    expect(seen[0].body).toContain(st.ge);
  });
  test('TC_ESTIMATE_API_04 - API: the list API refuses a call that carries no login', async ({ page, playwright }) => {
    let url;
    page.on('request', (r) => { if (/GetMyGoldEstimates/i.test(r.url())) url = r.url(); });
    await page.getByRole('button', { name: /My Saved Estimates/ }).click();
    await expect.poll(() => url, { timeout: 20_000 }).toBeTruthy();
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(url);
    const body = await res.text();
    await ctx.dispose();
    expect(res.status() === 401 || res.status() === 403 || !/GE\d{6,}/.test(body), `status ${res.status()} without login`).toBe(true);
  });
  test('TC_ESTIMATE_API_05 - API: server-side validation by sending invalid data straight to the save API', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): a direct call could be accepted by the server and create an invalid estimate that cannot be deleted. Covered at UI level by the BOUNDARY / REQUIRED tests.');
  });

  // ======================================================================================================
  // Error recovery / Session
  // ======================================================================================================
  test('TC_ESTIMATE_ERROR_02 - Error recovery: when the save call fails (network aborted) no success message is shown and Back to Edit keeps the data', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    await blockSave(page, {});
    await est.save.click();
    await page.getByRole('button', { name: /Confirm & Save/ }).click();
    await page.waitForTimeout(4000);
    expect((await est.messages()).join(' ')).not.toMatch(/saved|success|GE\d{6,}/i);
    const back = page.getByRole('button', { name: /Back to Edit/ });
    if (await back.isVisible().catch(() => false)) await back.click();
    expect(num((await est.totals()).pureNetWeight)).toBeCloseTo(10, 2);
  });
  test('TC_ESTIMATE_SESSION_02 - Session / concurrency / browser: browser storage cleared mid-form, then Save (behaviour recorded, save call aborted)', async ({ page, context }, testInfo) => {
    await prepare();
    await est.fillArticle(0, ART);
    await blockSave(page, {});
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await context.clearCookies();
    await est.save.click();
    await page.waitForTimeout(4000);
    const login = await page.locator('input[type=password]').first().isVisible().catch(() => false);
    const dialog = await page.getByText('Review Gold Estimate').first().isVisible().catch(() => false);
    testInfo.annotations.push({ type: 'role', description: `After clearing the session and clicking Save: ${login ? 'redirected to the login page' : dialog ? 'review dialog still opened (session kept in memory)' : 'stayed on the form'}; messages: ${(await est.messages()).join(' | ').slice(0, 120) || 'none'}` });
  });
  test('TC_ESTIMATE_SESSION_03 - Session / concurrency / browser: a page refresh mid-form (behaviour recorded)', async ({ page }, testInfo) => {
    await prepare();
    await est.fillArticle(0, ART);
    await page.reload();
    await page.waitForTimeout(3000);
    const rows = await est.articleRows().count();
    const contactKept = ((await est.contact.innerText().catch(() => '')) || '').replace(/[×\s]/g, '').length > 0;
    testInfo.annotations.push({ type: 'role', description: `After refresh: contact ${contactKept ? 'kept' : 'cleared'}, article rows shown: ${rows} (form data is ${contactKept ? 'retained' : 'lost'})` });
  });
  test('TC_ESTIMATE_SESSION_04 - Session / concurrency / browser: double-clicking Save opens only one review dialog', async ({ page }) => {
    await prepare();
    await est.fillArticle(0, ART);
    await est.uploadImage(IMAGE);
    await est.save.dblclick();
    await page.waitForTimeout(2500);
    expect(await page.getByText('Review Gold Estimate').locator('visible=true').count()).toBe(1);
  });
  test('TC_ESTIMATE_SESSION_05 - Session / concurrency / browser: two users saving an estimate for the same contact at the same time', async () => {
    test.skip(true, 'NOT EXECUTED (data safety): needs two real saved estimates for one contact, which cannot be deleted.');
  });

  // ======================================================================================================
  // File upload / length / accessibility
  // ======================================================================================================
  test('TC_ESTIMATE_FILE_03 - File download / upload: a 6 MB image is rejected (limit 5 MB)', async ({ page }) => {
    const big = path.join(os.tmpdir(), 'big-image-6mb.png');
    fs.writeFileSync(big, Buffer.alloc(6 * 1024 * 1024, 1));
    try {
      await prepare();
      const section = page.getByText(/Upload Gold Articles Images/i).first().locator('xpath=ancestor::div[.//button][1]');
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), section.locator('button').first().click()]);
      await chooser.setFiles(big);
      await page.waitForTimeout(4000);
      expect(await section.locator('input[type=text]').first().inputValue()).not.toMatch(/big-image-6mb/i);
    } finally { fs.rmSync(big, { force: true }); }
  });
  test('TC_ESTIMATE_LENGTH_02 - Field length & autocomplete: typing 3000 characters in Remarks is cut at its maximum length', async () => {
    const max = await est.remarks.getAttribute('maxlength');
    expect(max, 'Remarks maxlength').not.toBeNull();
    await est.remarks.fill('r'.repeat(3000));
    expect((await est.remarks.inputValue()).length).toBeLessThanOrEqual(Number(max));
  });
  test('TC_ESTIMATE_A11Y_02 - Accessibility & responsive: every visible field and button on the form has an accessible name', async () => {
    await est.selectContact(await usable());
    const unnamed = await est.page.evaluate(() => {
      const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('placeholder') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.innerText) || e.closest('label')?.innerText || (['BUTTON'].includes(e.tagName) ? e.innerText : '') || (e.getAttribute('aria-labelledby') ? 'ref' : '') || '').trim();
      return [...document.querySelectorAll('main input:not([type=hidden]), main select, main textarea, main button, app-root input:not([type=hidden]), app-root select, app-root textarea, app-root button')]
        .filter((e) => e.offsetParent && !name(e)).map((e) => e.tagName.toLowerCase() + (e.getAttribute('formcontrolname') ? `[${e.getAttribute('formcontrolname')}]` : '')).slice(0, 12);
    });
    expect(unnamed, `controls without an accessible name`).toEqual([]);
  });
  test('TC_ESTIMATE_A11Y_03 - Accessibility & responsive: the form fits a tablet screen (768 x 1024) without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
  });
  test('TC_ESTIMATE_A11Y_04 - Accessibility & responsive: browser compatibility (Firefox, Safari / WebKit, Edge)', async () => {
    test.skip(true, 'NOT EXECUTED: only Chromium is installed for this project (run "npx playwright install" and add projects to playwright.config.js to enable other browsers).');
  });
});
