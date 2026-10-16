const { test, expect } = require('../../fixtures');

// Loan Disbursal list (Approved) as the maker. Read-only; the Actions icon (Revert to Approval) is never clicked.
const listApi = (hits) => JSON.parse(hits.filter((h) => /GetDisbursementViewData/i.test(h.url) && h.text).pop()?.text || '{}').papprovedloanslist || [];

test.describe('Loan Disbursal – approved loans list', () => {
  test('TC_LD_001 - List shows Branch, Show Loans and the Approved columns @smoke @regression', async ({ ld, page, record }) => {
    const th = (await page.locator('th:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    record(th.join(' | '));
    expect(th[0]).toMatch(/Loan Disbursal \(Approved\)/);
    for (const c of ['Application No', 'Branch', 'Loan Type', 'Loan Name', 'Applicant Name', 'Contact No.', 'Sanctioned Amount', 'Actions']) expect(th).toContain(c);
    await expect(ld.showLoans).toBeVisible();
  });

  test('TC_LD_002 - Total and application numbers match the API @smoke @regression', async ({ ld, apiHits, record }) => {
    const api = listApi(apiHits);
    const total = await ld.totalItems();
    const rows = await ld.approvedLoans();
    const apiNos = new Set(api.map((l) => l.pvchapplicationid));
    const missing = rows.filter((r) => !apiNos.has(r.appNo)).map((r) => r.appNo);
    record(`Pager ${total}, API ${api.length}; first page not in API: ${missing.join(', ') || 'none'}`);
    expect(total).toBe(api.length);
    expect(missing).toEqual([]);
  });

  test('TC_LD_003 - Row values (applicant, contact, sanctioned) match the API @regression', async ({ ld, apiHits, record }) => {
    const byNo = Object.fromEntries(listApi(apiHits).map((l) => [l.pvchapplicationid, l]));
    const bad = (await ld.approvedLoans()).filter((r) => {
      const a = byNo[r.appNo];
      return !a || a.papplicantname.replace(/\s+/g, ' ').trim() !== r.applicant || String(a.pcontactno) !== r.contact || Math.round(a.ploanapprovedamount) !== Math.round(r.sanctioned);
    });
    record(`Mismatches: ${bad.map((r) => { const a = byNo[r.appNo] || {}; return `${r.appNo} screen [${r.applicant} / ${r.contact} / ${r.sanctioned}] API [${a.papplicantname} / ${a.pcontactno} / ${a.ploanapprovedamount}]`; }).join('; ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_LD_004 - Branch filter HEAD OFFICE shows only HEAD OFFICE loans @regression', async ({ ld, page, record }) => {
    await page.locator('select:visible').first().selectOption({ label: 'HEAD OFFICE' });
    await ld.showLoans.click();
    await page.waitForTimeout(2500);
    const rows = await ld.approvedLoans();
    record(`${rows.length} rows: ${[...new Set(rows.map((r) => r.branch))].join(', ')}`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.branch === 'HEAD OFFICE')).toBe(true);
  });

  test('TC_LD_005 - Search by application number finds that loan only @regression', async ({ ld, record }) => {
    const first = (await ld.approvedLoans())[0];
    const rows = await ld.approvedLoans(first.appNo);
    record(`"${first.appNo}" → ${rows.map((r) => r.appNo).join(', ')}`);
    expect(rows.map((r) => r.appNo)).toEqual([first.appNo]);
  });

  test('TC_LD_006 - Search by applicant name @regression', async ({ ld, record }) => {
    const rows = await ld.approvedLoans('Autotest');
    record(`${rows.length} rows`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => /autotest/i.test(r.applicant))).toBe(true);
  });

  test('TC_LD_007 - Search with no match shows no rows @regression', async ({ ld, record }) => {
    const rows = await ld.approvedLoans('ZZNOMATCH999');
    record(`${rows.length} rows`);
    expect(rows).toHaveLength(0);
  });

  test('TC_LD_008 - Paging shows 10 rows and page 2 has different loans @regression', async ({ ld, page, record }) => {
    const p1 = (await ld.approvedLoans()).map((r) => r.appNo);
    await page.locator('[title*="next page" i]:visible, [aria-label*="next page" i]:visible').first().click();
    await page.waitForTimeout(1200);
    const p2 = (await ld.approvedLoans()).map((r) => r.appNo);
    record(`Page 1 ${p1.length}, page 2 ${p2.length}`);
    expect(p1.length).toBe(10);
    expect(p2.length).toBeGreaterThan(0);
    expect(p2.some((n) => p1.includes(n))).toBe(false);
  });

  test('TC_LD_009 - Approved loans offered for disbursal have a sanctioned amount above 0 (HYPOTHESIS) @regression', async ({ ld, apiHits, record }) => {
    const zero = listApi(apiHits).filter((l) => !(l.ploanapprovedamount > 0)).map((l) => `${l.pvchapplicationid} (${l.papplicantname})`);
    record(`Loans with sanctioned 0: ${zero.length} – ${zero.join(', ') || 'none'}`);
    expect(zero).toEqual([]);
  });

  test('TC_LD_010 - Clicking the Application No opens the disbursement form @smoke @regression', async ({ ld, page, record }) => {
    const first = (await ld.approvedLoans('Autotest')).find((l) => l.sanctioned > 0);
    test.skip(!first, 'no AUTOTEST loan with a sanctioned amount');
    await ld.openLoan(first.appNo);
    record(page.url());
    expect(page.url()).toMatch(/DisbursementNew/);
    await expect(ld.submit).toBeVisible();
  });
});
