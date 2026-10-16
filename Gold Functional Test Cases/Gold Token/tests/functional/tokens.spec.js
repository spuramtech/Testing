const { test, expect, SIM } = require('../../fixtures');

const lastJson = (hits, re) => { const h = hits.filter((x) => re.test(x.url) && x.text).pop(); return h ? JSON.parse(h.text) : null; };

test.describe('Gold Token – token lists (real, read-only)', () => {
  test('TC_GT_001 - Gold Token opens with New / Used Tokens and the available-token grid @smoke @regression', async ({ page, gt, record }) => {
    const heads = (await page.locator('th:visible').allInnerTexts()).map((h) => h.trim()).filter(Boolean);
    const c = await gt.tabCounts();
    record(`Counts ${JSON.stringify(c)}; columns ${heads.join(' | ')}`);
    expect(heads).toEqual(['Generate', 'Token Number', 'Customer Name', 'Customer Mobile', 'Customer Type', 'Appraisal Value']);
    expect(Number.isFinite(c.newTokens) && Number.isFinite(c.usedTokens)).toBe(true);
  });

  test('TC_GT_002 - Available tokens = unused tokens from the API; count matches "New Tokens" @regression', async ({ gt, apiHits, record }) => {
    await expect.poll(() => !!lastJson(apiHits, /GetGoldLoanCustomerDetails/i)).toBe(true);
    const api = lastJson(apiHits, /GetGoldLoanCustomerDetails/i).filter((t) => !t.isTokenUsed).map((t) => t.puniqueid).sort();
    const ui = (await gt.tokens()).map((t) => t.token).sort();
    const c = await gt.tabCounts();
    record(`UI ${ui.join(', ') || 'none'}; API unused ${api.join(', ') || 'none'}; New Tokens ${c.newTokens}`);
    expect(ui).toEqual(api);
    expect(c.newTokens).toBe(ui.length);
  });

  test('TC_GT_003 - Every token\'s appraisal value matches its approved estimate @regression', async ({ gt, apiHits, record }) => {
    const api = lastJson(apiHits, /GetGoldLoanCustomerDetails/i) || [];
    const rows = await gt.tokens();
    const bad = rows.filter((r) => { const a = api.find((x) => x.puniqueid === r.token); return !a || Math.abs(a.pAppraisalvalue - r.value) > 0.01; });
    record(`${rows.length} tokens; mismatches ${bad.map((b) => b.token).join(', ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GT_004 - Used Tokens tab lists tokens already turned into loans @regression', async ({ page, gt, apiHits, record }) => {
    await page.getByText(/^\s*Used Tokens/).first().click();
    await page.waitForTimeout(2500);
    const used = lastJson(apiHits, /GetUsedGoldLoanTokensDetails/i) || [];
    const rows = (await page.locator('tr:visible', { hasText: /UID\d+/ }).allInnerTexts()).map((t) => (t.match(/UID\d+/) || [])[0]);
    record(`Used tab rows ${rows.join(', ') || 'none'}; API ${used.map((u) => u.puniqueid).join(', ') || 'none'}`);
    expect(used.every((u) => u.isTokenUsed)).toBe(true);
    expect(rows.sort()).toEqual(used.map((u) => u.puniqueid).sort());
  });
});

test.describe('Gold Token – selected token (simulated UID99999)', () => {
  test('TC_GT_005 - Simulated token is listed with customer, mobile and appraisal value @regression', async ({ simToken, record }) => {
    const { gt, item } = simToken;
    const row = (await gt.tokens()).find((t) => t.token === SIM);
    record(JSON.stringify(row));
    expect(row.customer.trim()).toBe(String(item.pCustomername).trim());
    expect(row.mobile).toBe(String(item.pCustomermobile).trim());
    expect(row.value).toBeCloseTo(Number(item.pAppraisalvalue), 2);
  });

  test('TC_GT_006 - Token Overview shows appraisal value, eligible loan (LTV) and article quantity of the estimate @smoke @regression', async ({ simToken, record }) => {
    const { gt, data } = simToken;
    const o = await gt.overview();
    record(`${JSON.stringify(o)} vs estimate ${data.pAppraisalvalue} / ${data.pGoldEstimateValue} / ${data.goldLoanDetailslist.length}`);
    expect(o).toEqual({ appraisal: data.pAppraisalvalue, eligible: data.pGoldEstimateValue, articleQty: data.goldLoanDetailslist.reduce((s, a) => s + a.pQuantity, 0) });
  });

  test('TC_GT_007 - Member Information shows the estimate\'s customer @regression', async ({ simToken, record }) => {
    const { gt, data } = simToken;
    const info = await gt.memberInfo();
    record(info.slice(0, 200));
    expect(info).toContain(`Name : ${data.pCustomername}`);
    expect(info).toContain(`Contact Number : ${data.pCustomermobile}`);
  });

  test('TC_GT_008 - Token date is read-only @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    const v = await gt.date.inputValue();
    record(`Date "${v}", editable ${await gt.date.isEditable()}`);
    expect(v).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(await gt.date.isEditable()).toBe(false);
  });

  test('TC_GT_009 - "View gold article details" opens the estimate articles @regression', async ({ simToken, record }) => {
    const { gt, data } = simToken;
    await gt.page.locator('a[title="View gold article details"]').first().click();
    const modal = gt.page.locator('#Articles');
    await expect(modal).toBeVisible();
    const text = (await modal.innerText()).replace(/\s+/g, ' ');
    const a = data.goldLoanDetailslist[0];
    record(text.slice(0, 300));
    expect(text).toContain(a.pGoldArticleType);
    expect(text).toContain(String(a.grossweight));
  });
});
