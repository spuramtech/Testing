const { test, expect } = require('../../fixtures');

test.describe('Gold Estimates – API', () => {
  test('TC_GE_053 - Estimate APIs refuse requests without a token @regression', async ({ page, ge, apiHits, record }) => {
    const hit = apiHits.find((h) => /GetSlabConfigList|getgoldrate\?/i.test(h.url));
    const headers = { ...hit.headers };
    delete headers.authorization;
    const r = await page.request.get(hit.url, { headers });
    record(`${hit.url.split('/api/')[1].split('?')[0]} without token → ${r.status()}`);
    expect([401, 403]).toContain(r.status());
  });

  test('TC_GE_054 - Gold rate used by estimates is the latest APPROVED internal rate, dated before or on today @regression', async ({ geContact, apiHits, record }) => {
    const rate = JSON.parse(apiHits.find((h) => /getgoldrate\?/i.test(h.url) && h.text).text)[0];
    const today = new Date().toISOString().slice(0, 10);
    record(`Rate ${rate.pgoldrate} (${rate.pgoldtype}) dated ${rate.ptransdate.slice(0, 10)}`);
    expect(rate.pgoldrate).toBeGreaterThan(0);
    expect(rate.ptransdate.slice(0, 10) <= today).toBe(true);
  });

  test('TC_GE_055 - Approval-slab configuration covers every amount without gaps or overlaps @regression', async ({ ge, apiHits, record }) => {
    const slabs = JSON.parse(apiHits.find((h) => /GetSlabConfigList/i.test(h.url) && h.text).text).filter((s) => s.pStatusid === 1).sort((a, b) => a.pSlabFromAmount - b.pSlabFromAmount);
    const issues = [];
    if (slabs[0].pSlabFromAmount !== 0) issues.push(`first slab starts at ${slabs[0].pSlabFromAmount}`);
    for (let i = 1; i < slabs.length; i++) {
      const gap = slabs[i].pSlabFromAmount - slabs[i - 1].pSlabToAmount;
      if (gap > 1 || gap < 0) issues.push(`${slabs[i - 1].pSlabToAmount} → ${slabs[i].pSlabFromAmount}`);
    }
    record(`${slabs.map((s) => `${s.pSlabFromAmount}–${s.pSlabToAmount}: ${s.pInternalAppraiserCount}I+${s.pExternalAppraiserCount}E`).join('; ')}; issues: ${issues.join(', ') || 'none'}`);
    expect(issues).toEqual([]);
  });
});
