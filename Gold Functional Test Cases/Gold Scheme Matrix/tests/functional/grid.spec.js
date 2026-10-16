const { test, expect } = require('../../fixtures');
const { num } = require('../../pages/GoldSchemeMatrixPage');

test.describe('Gold Scheme Matrix – grid', () => {
  test('TC_GS_001 - Admin opens Gold Scheme Matrix from Gold Loan Configuration @smoke @regression', async ({ page, gsm, record }) => {
    await expect(page).toHaveURL(/open=GoldSchemeMatrix/);
    await expect(page.getByText('UNIFIED SCHEME MATRIX FOR THIS COMPANY', { exact: false }).first()).toBeVisible();
    await expect(gsm.newBtn).toBeVisible();
    record(`URL ${page.url()}; New Scheme shown; ${await gsm.totalItems()} schemes`);
  });

  test('TC_GS_002 - Grid shows Scheme, Tenure, Type, Interest %, Paise/mo, Internal LTV by slab, Scheme on, Action @smoke @regression', async ({ page, gsm, record }) => {
    const headers = (await page.locator('th:visible').allInnerTexts()).map((h) => h.trim()).filter(Boolean);
    record(headers.join(' | '));
    for (const h of ['Scheme', 'Tenure', 'Type', 'Interest %', 'Paise/mo', 'Internal LTV by slab', 'Scheme on', 'Action']) expect(headers).toContain(h);
    const [r] = await gsm.rows();
    expect(r, 'at least one scheme').toBeTruthy();
  });

  test('TC_GS_003 - Company selector shows the logged-in company @regression', async ({ gsm, record }) => {
    const opts = await gsm.company.locator('option').allInnerTexts();
    const sel = await gsm.company.locator('option:checked').innerText();
    record(`Selected "${sel}"; options ${opts.join(', ')}`);
    expect(sel).toMatch(/BIJAY FINANCE/i);
  });

  test('TC_GS_004 - Grid pages 10 schemes at a time and the pager moves to the next page @regression', async ({ gsm, record }) => {
    const total = await gsm.totalItems();
    const first = await gsm.rows();
    test.skip(total <= 10, `only ${total} schemes`);
    const info1 = await gsm.pagerInfo.innerText();
    await gsm.nextPage();
    const info2 = await gsm.pagerInfo.innerText();
    const second = await gsm.rows();
    record(`"${info1}" (${first.length} rows) → "${info2}" (${second.length} rows)`);
    expect(first).toHaveLength(10);
    expect(second[0].code).not.toBe(first[0].code);
  });

  test('TC_GS_005 - Sorting by Interest % orders the rows by rate @regression', async ({ page, gsm, record }) => {
    await page.getByRole('columnheader', { name: 'Interest %' }).click();
    await page.waitForTimeout(600);
    const rates = (await gsm.rows()).map((r) => r.rate);
    record(`Rates after sort: ${rates.join(', ')}`);
    const asc = [...rates].sort((a, b) => a - b);
    expect(rates.join() === asc.join() || rates.join() === [...asc].reverse().join()).toBe(true);
  });

  test('TC_GS_006 - Paise/mo of every scheme equals Interest % ÷ 12 @regression', async ({ gsm, record }) => {
    const rows = await gsm.allRows();
    const bad = rows.filter((r) => Math.abs(r.paise - r.rate / 12) > 0.0011);
    record(`${rows.length} schemes; mismatches: ${bad.map((r) => `${r.code} ${r.rate}% → ${r.paiseText} (expected ${(r.rate / 12).toFixed(3)})`).join('; ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GS_007 - Paise/mo is shown with the same precision on every row (HYPOTHESIS) @regression', async ({ gsm, record }) => {
    const rows = await gsm.allRows();
    const decimals = [...new Set(rows.map((r) => (r.paiseText.split('.')[1] || '').length))];
    record(`Decimal places used: ${decimals.join(', ')} (${rows.map((r) => `${r.code}=${r.paiseText}`).slice(0, 8).join(', ')}…)`);
    expect(decimals).toHaveLength(1);
  });

  test('TC_GS_008 - Grid Internal LTV values match the resolved-LTV API for every scheme @regression', async ({ gsm, apiHits, record }) => {
    await expect.poll(() => !!apiHits.find((h) => /getresolvedgoldschemeltv/i.test(h.url) && h.text)).toBe(true);
    const resolved = JSON.parse(apiHits.find((h) => /getresolvedgoldschemeltv/i.test(h.url) && h.text).text);
    const rows = await gsm.allRows();
    const bad = [];
    for (const r of rows) {
      const api = resolved.filter((x) => x.pSchemeCode === r.code && x.pTenureMonths === r.tenure).sort((a, b) => a.pMinimumAmount - b.pMinimumAmount).map((x) => Number(x.pInternalLtv));
      if (api.length && api.join() !== r.ltv.join()) bad.push(`${r.code}: grid ${r.ltv.join('/')} API ${api.join('/')}`);
    }
    record(`${rows.length} schemes compared; differences: ${bad.join('; ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GS_009 - Grid rows match the scheme list API (tenure, type, rate, status) @regression', async ({ gsm, apiHits, record }) => {
    const list = JSON.parse(apiHits.find((h) => /getgoldschemeconfigurationlist/i.test(h.url) && h.text).text);
    const rows = await gsm.allRows();
    const bad = [];
    for (const r of rows) {
      const a = list.find((x) => x.pSchemeCode === r.code && x.pTenureMonths === r.tenure);
      if (!a) { bad.push(`${r.code} missing in API`); continue; }
      const type = a.pSchemeType === 'MONTHLY' ? 'Regular Monthly Repayment' : 'Bullet';
      if (a.pTenureMonths !== r.tenure || type !== r.type || Number(a.pRateOfInterest) !== r.rate || (a.pStatus === 'ACTIVE') !== r.on) bad.push(`${r.code}: grid ${r.tenure}/${r.type}/${r.rate}/${r.on} API ${a.pTenureMonths}/${type}/${a.pRateOfInterest}/${a.pStatus}`);
    }
    record(`${rows.length} rows vs ${list.length} API records; differences: ${bad.join('; ') || 'none'}`);
    expect(rows.length).toBe(list.length);
    expect(bad).toEqual([]);
  });

  test('TC_GS_010 - Tenure shows "<n> mo" and Type shows Bullet or Regular Monthly Repayment @regression', async ({ gsm, record }) => {
    const rows = await gsm.rows();
    const bad = rows.filter((r) => !(r.tenure > 0) || !/^(Bullet|Regular Monthly Repayment)$/.test(r.type));
    record(`${rows.length} rows; unexpected: ${bad.map((r) => r.code).join(', ') || 'none'}`);
    expect(bad).toEqual([]);
    void num;
  });
});
