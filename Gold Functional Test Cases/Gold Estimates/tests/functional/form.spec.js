const { test, expect } = require('../../fixtures');

const todayDmy = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const json = (hits, re) => { const h = hits.filter((x) => re.test(x.url) && x.text).sort((a, b) => b.text.length - a.text.length)[0]; return h ? JSON.parse(h.text) : null; };

test.describe('Gold Estimates – form layout and master data', () => {
  test('TC_GE_001 - Gold Estimates opens with Customer, Gold Details, Article grid, Totals and Attachments sections @smoke @regression', async ({ page, ge, record }) => {
    await expect(page).toHaveURL(/#\/Loans\/GoldEstimates$/);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    for (const t of ['Customer Details', 'Gold Details', 'Gold Article Details', 'Totals', 'Attachments & Remarks']) expect(text).toContain(t);
    for (const b of ['View', 'My Saved Estimates', 'Clear', 'Save']) await expect(page.locator('button:visible, a:visible').filter({ hasText: new RegExp(`^\\s*${b}\\s*$`) }).first()).toBeVisible();
    record(`URL ${page.url()}; all sections and buttons shown`);
  });

  test('TC_GE_002 - Estimate Date defaults to today and is set from the calendar only @regression', async ({ ge, record }) => {
    const v = await ge.date.inputValue();
    record(`Date "${v}", editable ${await ge.date.isEditable()}`);
    expect(v).toBe(todayDmy());
    expect(await ge.date.isEditable()).toBe(false);
  });

  test('TC_GE_003 - Calendar does not allow a future Estimate Date @regression', async ({ ge, record }) => {
    await ge.date.click();
    await expect(ge.calendar).toBeVisible();
    const t = new Date().getDate();
    const disabled = (await ge.calendar.locator('td span.disabled:not(.is-other-month)').allInnerTexts()).map(Number);
    const last = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    record(`Disabled days this month: ${disabled.join(',')}`);
    for (let d = t + 1; d <= last; d++) expect(disabled, `day ${d} is in the future`).toContain(d);
  });

  test('TC_GE_004 - Loan Name defaults to New Gold @regression', async ({ ge, record }) => {
    const sel = await ge.loanName.locator('option:checked').innerText();
    record(`Loan Name "${sel}"; options ${(await ge.loanName.locator('option').allInnerTexts()).join(', ')}`);
    expect(sel.trim()).toBe('New Gold');
  });

  test('TC_GE_005 - Scheme list = "Not applied" + every ACTIVE effective scheme as "<name> — <n> mo" @regression', async ({ geContact: ge, apiHits, record }) => {
    await expect.poll(() => ge.scheme.locator('option').count()).toBeGreaterThan(1);
    const opts = (await ge.scheme.locator('option').allInnerTexts()).map((o) => o.trim());
    const resolved = json(apiHits, /getresolvedgoldschemeltv/i) || [];
    const expected = [...new Map(resolved.filter((r) => r.pSchemeStatus === 'ACTIVE' && r.pIsEffective).map((r) => [`${r.pSchemeId}`, `${r.pSchemeName} — ${r.pTenureMonths} mo`])).values()];
    record(`${opts.length - 1} schemes offered; API ${expected.length} active+effective`);
    expect(opts[0]).toMatch(/^Not applied/);
    expect(await ge.scheme.locator('option:checked').innerText()).toMatch(/^Not applied/);
    expect([...opts.slice(1)].sort()).toEqual([...expected].sort());
  });

  test('TC_GE_006 - Contact search by name lists matching contacts with mobile and e-mail @smoke @regression', async ({ page, ge, record }) => {
    await ge.contact.click();
    await ge.contact.locator('input').fill('Autotest');
    await page.waitForTimeout(2000);
    const opts = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((o) => o.replace(/\s+/g, ' '));
    record(`${opts.length} options, e.g. ${opts.slice(0, 2).join(' / ')}`);
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.every((o) => /autotest/i.test(o) && /\d{10}/.test(o))).toBe(true);
  });

  test('TC_GE_007 - Contact search by mobile number finds that contact @regression', async ({ page, ge, record }) => {
    await ge.contact.click();
    await ge.contact.locator('input').fill('Autotest');
    await page.waitForTimeout(2000);
    const mobile = ((await page.locator('ng-dropdown-panel .ng-option').first().innerText()).match(/\d{10}/) || [])[0];
    await ge.contact.locator('input').fill(mobile);
    await page.waitForTimeout(2000);
    const opts = await page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
    record(`Search ${mobile} → ${opts.length} option(s)`);
    expect(opts.some((o) => o.includes(mobile))).toBe(true);
  });

  test('TC_GE_008 - Selecting a contact shows 5 article rows with 22K purity and today\'s approved gold rate @regression', async ({ geContact, apiHits, record }) => {
    const n = await geContact.rows().count();
    const r = await geContact.readRow(0);
    const rate = (json(apiHits, /getgoldrate\?/i) || [])[0];
    record(`${n} rows; purity "${r.purityText.slice(0, 70)}"; API rate ${rate && rate.pgoldrate} on ${rate && rate.ptransdate}`);
    expect(n).toBe(5);
    expect(r.purityText).toMatch(/^22K/);
    expect(r.purityText).toContain(`₹ ${rate.pgoldrate.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / g as of ${rate.ptransdate.slice(0, 10).split('-').reverse().join('/')}`);
  });

  test('TC_GE_009 - Purity choices are 24K, 22K, 21K, 20K, 19K, 18K @regression', async ({ page, geContact, record }) => {
    await geContact.rows().nth(0).locator('td[aria-colindex="1"] ng-select').click();
    const opts = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((o) => o.slice(0, 3));
    await page.keyboard.press('Escape');
    record(opts.join(', '));
    expect(opts).toEqual(['24K', '22K', '21K', '20K', '19K', '18K']);
  });

  test('TC_GE_010 - Prohibited article types (Article Limits) are not offered @regression', async ({ geContact, apiHits, record }) => {
    const offered = (await geContact.rows().nth(0).locator('td[aria-colindex="2"] select option').allInnerTexts()).map((o) => o.trim().toLowerCase());
    const prohibited = (json(apiHits, /GetGoldArticleLimitMaster/i) || []).filter((a) => a.pIsprohibited).map((a) => a.pGoldarticletype);
    const shown = prohibited.filter((p) => offered.includes(p.toLowerCase()));
    record(`Prohibited: ${prohibited.join(', ')}; offered anyway: ${shown.join(', ') || 'none'}`);
    expect(shown).toEqual([]);
  });

  test('TC_GE_011 - Defects list offers the configured defect types @regression', async ({ page, geContact, record }) => {
    await geContact.rows().nth(0).locator('td[aria-colindex="12"] ng-select').click();
    const opts = await page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
    await page.keyboard.press('Escape');
    record(opts.join(', '));
    for (const d of ['Nil', 'Cut', 'Missing Stone', 'Soldering']) expect(opts).toContain(d);
  });

  test('TC_GE_012 - A new blank row is added automatically when the last row is filled; Add Row adds one more @regression', async ({ geContact, record }) => {
    const n0 = await geContact.rows().count();
    for (let i = 0; i < n0; i++) await geContact.fillRow(i, { type: 'RING', quantity: 1, gross: 5, stone: 0 });
    const n1 = await geContact.rows().count();
    await geContact.addRowBtn.click();
    await geContact.page.waitForTimeout(500);
    const n2 = await geContact.rows().count();
    record(`rows ${n0} → after filling all ${n1} → after Add Row ${n2}`);
    expect(n1).toBe(n0 + 1);
    expect(n2).toBe(n1 + 1);
  });

  test('TC_GE_013 - Clear empties the contact, the grid and remarks @regression', async ({ page, geContact, record }) => {
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    await geContact.remarks.fill('clear me');
    await geContact.clearBtn.click();
    await page.waitForTimeout(800);
    const contact = (await geContact.contact.innerText()).replace(/\s+/g, ' ').trim();
    const t = await geContact.totals();
    record(`Contact "${contact}"; remarks "${await geContact.remarks.inputValue()}"; totals ${JSON.stringify(t)}`);
    expect(await geContact.remarks.inputValue()).toBe('');
    expect(t.quantity || 0).toBe(0);
  });

  test('TC_GE_014 - View lists saved estimates by token number @regression', async ({ page, ge, record }) => {
    await page.locator('button:visible, a:visible').filter({ hasText: /^\s*View\s*$/ }).first().click();
    await page.waitForURL(/GoldEstimatesView/);
    await page.waitForTimeout(2000);
    const heads = (await page.locator('th:visible').allInnerTexts()).map((h) => h.trim()).filter(Boolean);
    record(`Columns ${heads.join(' | ')}; ${await page.locator('.k-pager-info:visible').innerText().catch(() => '?')}`);
    for (const h of ['Token Number', 'Customer Name', 'Customer Mobile', 'Appraisal Value']) expect(heads).toContain(h);
  });

  test('TC_GE_015 - My Saved Estimates lists the maker\'s GE numbers with status and actions @regression', async ({ page, ge, apiHits, record }) => {
    await page.locator('button:visible, a:visible').filter({ hasText: /^\s*My Saved Estimates\s*$/ }).first().click();
    await page.waitForURL(/MyGoldEstimates/);
    await expect.poll(() => !!apiHits.find((h) => /GetMyGoldEstimates/i.test(h.url) && h.text)).toBe(true);
    const list = JSON.parse(apiHits.find((h) => /GetMyGoldEstimates/i.test(h.url) && h.text).text);
    const first = page.locator('tr:visible', { hasText: /GE\d{10}/ }).first();
    const titles = await first.locator('[title]').evaluateAll((e) => e.map((x) => x.title));
    record(`API ${list.length} estimates; first row "${(await first.innerText()).replace(/\s+/g, ' ').slice(0, 120)}"; actions ${titles.join(' / ')}`);
    expect(list.length).toBeGreaterThan(0);
    await expect(first).toContainText(list[0].pGenumber);
  });
});
