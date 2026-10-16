const { test, expect } = require('../../fixtures');
const { replay } = require('../../../../common/utils/api');
const { round2 } = require('../../pages/DailyGoldRatePage');

test.describe('Daily Gold Rate – API', () => {
  test('TC_GR_050 - Gold rate list API refuses requests without a valid token @regression', async ({ page, grp, apiHits, record }) => {
    const hit = apiHits.find((h) => /getonlinegoldrateView/i.test(h.url));
    expect(hit, 'getonlinegoldrateView was not called').toBeTruthy();
    const ok = await replay(page, hit, hit.headers.authorization);
    const none = await replay(page, hit, '');
    const bad = await replay(page, hit, 'Bearer invalid.token.value');
    record(`with token ${ok.status}; no token ${none.status}; invalid token ${bad.status}`);
    expect(ok.status).toBe(200);
    expect([401, 403]).toContain(none.status);
    expect([401, 403]).toContain(bad.status);
  });

  test('TC_GR_051 - Gold rate list API returns well-formed records that match the grid @regression', async ({ grp, apiHits, record }) => {
    await expect.poll(() => !!apiHits.find((h) => /getonlinegoldrateView/i.test(h.url) && h.text), { timeout: 15_000 }).toBe(true);
    const hit = apiHits.find((h) => /getonlinegoldrateView/i.test(h.url) && h.text);
    const list = JSON.parse(hit.text);
    expect(Array.isArray(list)).toBe(true);
    const malformed = list.filter((r) => !/^\d{4}-\d{2}-\d{2}/.test(r.ptransdate) || typeof r.pgoldrate !== 'number' || !/\d+K/.test(r.pgoldtype) || r.pgoldrate <= 0);
    const [first] = await grp.rows();
    const iso = first.date.split('/').reverse().join('-');
    const api24 = list.find((r) => r.ptransdate.startsWith(iso) && /^24K/.test(r.pgoldtype));
    record(`${list.length} records; malformed ${malformed.length}; grid ${first.date} 24K ${first.r24} vs API ${api24 && api24.pgoldrate}`);
    expect(malformed).toEqual([]);
    expect(api24, `API has no 24K record for ${first.date}`).toBeTruthy();
    expect(round2(api24.pgoldrate)).toBeCloseTo(first.r24, 2);
  });
});
