const { test, expect } = require('../../fixtures');

// Inventory Form → View: saved inventories (read-only).
const api = (hits) => JSON.parse(hits.filter((h) => /getloaninventory/i.test(h.url) && h.text).pop()?.text || '[]');

test.describe('Inventory Form – View (saved inventories)', () => {
  test('TC_IF_041 - View lists saved inventories with the expected columns @smoke @regression', async ({ inv, page, record }) => {
    await inv.openView();
    const th = (await page.locator('th:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    record(th.join(' | '));
    for (const c of ['Applicant Name', 'Loan Number', 'Inventory Number', 'Trans Date', 'G.WT (grams)', 'Pure N.WT (grams)', 'Remarks', 'No of Items', 'Actions']) expect(th).toContain(c);
  });

  test('TC_IF_042 - View total and rows match the API @regression', async ({ inv, apiHits, record }) => {
    await inv.openView();
    const rows = await inv.viewRows();
    const all = api(apiHits);
    const byInv = Object.fromEntries(all.map((r) => [r.pGoldloaninventoryid, r]));
    const bad = rows.filter((r) => !byInv[r.inventory] || byInv[r.inventory].pLoanid !== r.loan);
    const m = ((await inv.page.locator('.k-pager-info:visible').first().innerText().catch(() => '')).match(/of (\d+) items/) || [])[1];
    record(`Pager ${m}, API ${all.length}, page rows ${rows.length}, mismatches ${bad.length}`);
    expect(Number(m)).toBe(all.length);
    expect(bad).toEqual([]);
  });

  test('TC_IF_043 - Inventory numbers are INV + 10 digits and unique; one inventory per loan @regression', async ({ inv, apiHits, record }) => {
    await inv.openView();
    const all = api(apiHits);
    const nos = all.map((r) => r.pGoldloaninventoryid);
    const loans = all.map((r) => r.pLoanid);
    const dupNo = nos.filter((n, i) => nos.indexOf(n) !== i);
    const dupLoan = [...new Set(loans.filter((n, i) => loans.indexOf(n) !== i))];
    const bad = nos.filter((n) => !/^INV\d{10}$/.test(n));
    record(`${nos.length} inventories; bad format ${bad.join(', ') || 0}; duplicate numbers ${dupNo.length}; loans with 2+ inventories ${dupLoan.join(', ') || 'none'}`);
    expect(bad).toEqual([]);
    expect(dupNo).toEqual([]);
    expect(dupLoan).toEqual([]);
  });

  test('TC_IF_044 - Every saved inventory\'s BH barcode is Used in the barcode register @regression', async ({ inv, live, record }) => {
    const view = await live.get('loans/Transactions/getloaninventory');
    const usedLoans = new Set(live.register.filter((r) => r.pStatus === 'Used' && r.pType === 'New').map((r) => r.pLoanid));
    const unusedLoans = new Set(live.register.filter((r) => r.pStatus === 'Not Used' && r.pType === 'New').map((r) => r.pLoanid));
    const recent = view.filter((v) => v.pTransdate >= '2026-10-01');
    const missing = recent.filter((v) => !usedLoans.has(v.pLoanid)).map((v) => `${v.pLoanid}${unusedLoans.has(v.pLoanid) ? ' (still Not Used)' : ''}`);
    record(`${recent.length} inventories since 01 Oct; without a Used BH barcode: ${missing.join(', ') || 'none'}`);
    expect(missing).toEqual([]);
  });

  test('TC_IF_045 - Newest inventory is listed first @regression', async ({ inv, record }) => {
    await inv.openView();
    const nos = (await inv.viewRows()).map((r) => r.inventory);
    record(nos.slice(0, 5).join(', '));
    expect(nos).toEqual([...nos].sort().reverse());
  });

  test('TC_IF_046 - Paging shows 10 rows and page 2 has different rows @regression', async ({ inv, page, record }) => {
    await inv.openView();
    const p1 = (await inv.viewRows()).map((r) => r.inventory);
    await page.locator('[title*="next page" i]:visible, [aria-label*="next page" i]:visible').first().click();
    await page.waitForTimeout(1200);
    const p2 = (await inv.viewRows()).map((r) => r.inventory);
    record(`Page 1 ${p1.length}, page 2 ${p2.length}`);
    expect(p1.length).toBe(10);
    expect(p2.length).toBeGreaterThan(0);
    expect(p2.some((n) => p1.includes(n))).toBe(false);
  });

  test('TC_IF_047 - Totals row = sum of gross and pure net weights @regression', async ({ inv, apiHits, page, record }) => {
    await inv.openView();
    const all = api(apiHits);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const m = text.match(/(\d+\.\d{3,}) (\d+\.\d{3,})/);
    const det = all.flatMap((r) => r.inventorydetails || []);
    const g = det.reduce((s, d) => s + Number(d.pGrossweight || 0), 0);
    const n = det.reduce((s, d) => s + Number(d.pPureNetWeight ?? d.pNetWeight ?? 0), 0);
    record(`Shown ${m && m[1]} / ${m && m[2]}; API sum ${g.toFixed(3)} / ${n.toFixed(3)}`);
    expect(m).toBeTruthy();
    expect(Number(m[1])).toBeCloseTo(g, 2);
    expect(Number(m[2])).toBeCloseTo(n, 2);
  });

  test('TC_IF_048 - "New" goes back to an empty Inventory Form @regression', async ({ inv, page, record }) => {
    await inv.openView();
    await page.getByText('New', { exact: true }).first().click();
    await page.waitForURL(/InventoryForm(?!View)/);
    const v = (await inv.loan.locator('.ng-value').allInnerTexts()).join('');
    record(`URL ${page.url()}; loan "${v}"`);
    expect(v).toBe('');
  });
});
