const { test, expect, ROLES } = require('../../fixtures');
const { STATUS } = require('../../pages/GoldEstimateApprovalQueuePage');

// Real queue data, read-only (no Approve / Revert is clicked).
const apiList = (hits, re) => { const h = hits.filter((x) => re.test(x.url) && x.text).pop(); return h ? JSON.parse(h.text) : null; };

test.describe('Gold Estimate Approval Queue – queue view (Branch Head)', () => {
  test('TC_EQ_001 - Branch Head opens the queue with GE, customer, value, role, status, token, aging and action columns @smoke @regression', async ({ page, checkerQ, record }) => {
    const heads = (await page.locator('th:visible').allInnerTexts()).map((h) => h.trim()).filter(Boolean);
    record(`URL ${page.url()}; columns ${heads.join(' | ')}`);
    expect(heads).toEqual(['GE NUMBER', 'CUSTOMER', 'MOBILE', 'ESTIMATE DATE', 'APPRAISAL VALUE', 'IMAGES', 'YOUR ROLE', 'STATUS', 'PLEDGE TOKEN', 'AGING', 'ACTION']);
  });

  test('TC_EQ_002 - Status filter lists all 7 workflow statuses @regression', async ({ checkerQ, record }) => {
    const opts = (await checkerQ.statusFilter.locator('option').allInnerTexts()).map((o) => o.trim());
    record(opts.join(' | '));
    expect(opts.slice(1).map((o) => o.replace(/ to edit$/, ''))).toEqual(Object.values(STATUS).map((s) => s.replace(/ to edit$/, '')));
  });

  test('TC_EQ_003 - Filtering by "Approved" shows only Approved estimates @regression', async ({ checkerQ, record }) => {
    await checkerQ.statusFilter.selectOption({ label: 'Approved' });
    await checkerQ.page.waitForTimeout(1500);
    const rows = await checkerQ.rows();
    record(`${rows.length} rows; statuses ${[...new Set(rows.map((r) => r.status))].join(', ')}`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === 'Approved')).toBe(true);
  });

  test('TC_EQ_004 - Queue total equals the queue API for the Branch Head @regression', async ({ checkerQ, apiHits, record }) => {
    await expect.poll(() => !!apiList(apiHits, /GetGoldEstimateQueue/i)).toBe(true);
    const api = apiList(apiHits, /GetGoldEstimateQueue/i);
    const total = await checkerQ.totalItems();
    record(`Pager ${total}; API ${api.length}`);
    expect(total).toBe(api.length);
  });

  test('TC_EQ_005 - Search by GE number shows that estimate only @regression', async ({ checkerQ, record }) => {
    const [first] = await checkerQ.rows();
    await checkerQ.search.fill(first.ge);
    await checkerQ.page.waitForTimeout(1000);
    const rows = await checkerQ.rows();
    record(`Search ${first.ge} → ${rows.map((r) => r.ge).join(', ')}`);
    expect(rows.map((r) => r.ge)).toEqual([first.ge]);
  });

  test('TC_EQ_006 - Search by customer name or mobile finds that customer\'s estimates @regression', async ({ checkerQ, record }) => {
    const [first] = await checkerQ.rows();
    const out = [];
    for (const term of [first.customer.split(' ')[1] || first.customer, first.mobile]) {
      await checkerQ.search.fill(term);
      await checkerQ.page.waitForTimeout(1000);
      const rows = await checkerQ.rows();
      out.push(`"${term}" → ${rows.length}`);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => `${r.customer} ${r.mobile}`.toLowerCase().includes(term.toLowerCase()))).toBe(true);
    }
    record(out.join('; '));
  });

  test('TC_EQ_007 - Search with no match empties the list @regression', async ({ checkerQ, record }) => {
    await checkerQ.search.fill('zzzz-no-such-ge');
    await checkerQ.page.waitForTimeout(1000);
    const n = (await checkerQ.rows()).length;
    record(`${n} rows; pager "${await checkerQ.pagerInfo.innerText().catch(() => '')}"`);
    expect(n).toBe(0);
  });

  test('TC_EQ_008 - Approved estimates show a pledge token; others show "-" @regression', async ({ checkerQ, apiHits, record }) => {
    await expect.poll(() => !!apiList(apiHits, /GetGoldEstimateQueue/i)).toBe(true);
    const api = apiList(apiHits, /GetGoldEstimateQueue/i);
    const rows = await checkerQ.rows();
    const bad = rows.filter((r) => (r.status === 'Approved') !== /^UID\d+$/.test(r.token));
    const apiBad = api.filter((a) => (a.pStatus === 'APPROVED') !== !!a.pResultuniqueid);
    record(`${rows.length} rows checked; UI mismatches ${bad.map((r) => `${r.ge}:${r.status}/${r.token}`).join(', ') || 'none'}; API mismatches ${apiBad.map((a) => a.pGenumber).join(', ') || 'none'}`);
    expect(bad).toEqual([]);
    expect(apiBad).toEqual([]);
  });

  test('TC_EQ_009 - Branch Head sees "Branch Head" as role and View on estimates not waiting for them @regression', async ({ checkerQ, record }) => {
    const rows = (await checkerQ.rows()).filter((r) => r.status !== 'Ready for Approval');
    record(`${rows.length} rows: roles ${[...new Set(rows.map((r) => r.role))].join(', ')}; actions ${[...new Set(rows.map((r) => r.action))].join(', ')}`);
    expect(rows.every((r) => r.role === 'Branch Head' && /View/.test(r.action))).toBe(true);
  });

  test('TC_EQ_010 - Aging is shown as <1h / Nh / Nd @regression', async ({ checkerQ, record }) => {
    const ages = (await checkerQ.rows()).map((r) => r.aging);
    record(ages.join(', '));
    expect(ages.every((a) => /^(<1h|\d+h|\d+d)$/.test(a))).toBe(true);
  });

  test('TC_EQ_011 - Every estimate: appraisals completed never exceed appraisals required; approved ones have a final value @regression', async ({ checkerQ, apiHits, record }) => {
    const api = apiList(apiHits, /GetGoldEstimateQueue/i);
    const bad = api.filter((a) => a.pAppraisalscompletedcount > a.pAppraisersrequired || (a.pStatus === 'APPROVED' && !(a.pFinalapprovedvalue > 0)));
    record(`${api.length} estimates; inconsistent: ${bad.map((a) => `${a.pGenumber} ${a.pAppraisalscompletedcount}/${a.pAppraisersrequired} final ${a.pFinalapprovedvalue}`).join('; ') || 'none'}`);
    expect(bad).toEqual([]);
  });
});

test.describe('Gold Estimate Approval Queue – detail (View)', () => {
  test('TC_EQ_012 - View shows estimate header, appraisal entries and status history @smoke @regression', async ({ page, checkerQ, record }) => {
    const [first] = (await checkerQ.rows()).filter((r) => r.status === 'Approved');
    await checkerQ.openAction(first.ge, 'View');
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(text.split('Back').pop().slice(0, 500));
    for (const l of ['GE NUMBER', 'ESTIMATE DATE', 'CUSTOMER', 'SCHEME', 'TENURE', 'ROI', 'APPRAISAL VALUE', 'APPRAISAL STAGES REQUIRED/COMPLETED', 'LTV APPLIED', 'ELIGIBLE LOAN AMOUNT (LTV)', 'STATUS', 'Appraisal Entries', 'Status History']) expect(text).toContain(l);
    await expect(checkerQ.approveBtn).toHaveCount(0);
  });

  test('TC_EQ_013 - Detail: eligible loan = appraisal value × LTV applied; values match the API @regression', async ({ page, checkerQ, apiHits, record }) => {
    const [first] = (await checkerQ.rows()).filter((r) => r.status === 'Approved');
    await checkerQ.openAction(first.ge, 'View');
    const d = apiList(apiHits, /GetGoldEstimateByGeNumber/i);
    const value = Number((await checkerQ.field('APPRAISAL VALUE')).replace(/[^\d.]/g, ''));
    const ltv = Number((await checkerQ.field('LTV APPLIED')).replace(/[^\d.]/g, ''));
    const eligible = Number((await checkerQ.field('ELIGIBLE LOAN AMOUNT (LTV)')).replace(/[^\d.]/g, ''));
    record(`${first.ge}: value ${value} × LTV ${ltv}% = ${(value * ltv / 100).toFixed(2)}; shown ${eligible}; API final ${d.pFinalapprovedvalue}`);
    expect(eligible).toBeCloseTo(value * ltv / 100, -1);
    expect(eligible).toBeCloseTo(d.pFinalapprovedvalue, 0);
    void page;
  });

  test('TC_EQ_014 - Status history is in time order and starts with the maker\'s SUBMIT @regression', async ({ checkerQ, apiHits, record }) => {
    const [first] = (await checkerQ.rows()).filter((r) => r.status === 'Approved');
    await checkerQ.openAction(first.ge, 'View');
    await expect.poll(() => !!apiList(apiHits, /GetGoldEstimateStatusHistory/i)).toBe(true);
    const h = apiList(apiHits, /GetGoldEstimateStatusHistory/i);
    const times = h.map((x) => x.pActiondate);
    record(h.map((x) => `${x.pActiondate} ${x.pActor} ${x.pAction}`).join(' → '));
    expect(h[0].pAction).toBe('SUBMIT');
    expect(times).toEqual([...times].sort());
    expect(h[h.length - 1].pAction).toBe('APPROVE');
  });

  test('TC_EQ_015 - Back returns to the queue @regression', async ({ page, checkerQ, record }) => {
    const [first] = await checkerQ.rows();
    await checkerQ.openAction(first.ge, 'View');
    await checkerQ.backBtn.click();
    await page.waitForURL(/GoldEstimateApprovalQueue/);
    record(`Back → ${page.url()}`);
    await expect(checkerQ.search).toBeVisible();
  });
});

test.describe('Gold Estimate Approval Queue – role inboxes', () => {
  for (const [id, role, api, statuses] of [
    ['TC_EQ_016', 'IA2', /GetPendingInternalApprovalForUser/i, ['Awaiting Internal Appraiser 2 verification']],
    ['TC_EQ_017', 'EXT1', /GetPendingExternal1ForUser/i, ['Awaiting External Appraiser 1']],
    ['TC_EQ_018', 'IA1', /GetPendingIaEntryForUser|GetPendingForMaker/i, ['Awaiting Internal Appraiser', 'Sent back to Internal Appraiser to edit']],
  ]) {
    test(`${id} - ${ROLES[role]} sees only the estimates waiting for them @regression`, async ({ q, loginAs, apiHits, record }) => {
      await loginAs(ROLES[role]);
      await q.open();
      const rows = await q.rows();
      const expected = apiHits.filter((h) => api.test(h.url) && h.text).flatMap((h) => JSON.parse(h.text)).map((x) => x.pGenumber);
      record(`${rows.length} rows (${rows.map((r) => `${r.ge}:${r.status}`).join(', ') || 'none'}); inbox API ${[...new Set(expected)].join(', ') || 'none'}`);
      expect(rows.map((r) => r.ge).sort()).toEqual([...new Set(expected)].sort());
      expect(rows.every((r) => statuses.includes(r.status))).toBe(true);
    });
  }

  test('TC_EQ_019 - Status filter is not labelled "as Branch Head" for users who are not Branch Head (HYPOTHESIS) @regression', async ({ q, loginAs, record }) => {
    await loginAs(ROLES.IA2);
    await q.open();
    const first = (await q.statusFilter.locator('option').first().innerText()).trim();
    record(`IA2 sees first option "${first}"`);
    expect(first).not.toMatch(/as Branch Head/);
  });
});
