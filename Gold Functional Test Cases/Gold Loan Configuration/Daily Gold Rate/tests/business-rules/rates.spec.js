const { test, expect } = require('../../fixtures');
const data = require('../../test-data/gold-rate-data');
const { round2, parse } = require('../../pages/DailyGoldRatePage');

test.describe('Daily Gold Rate – business rules', () => {
  test('TC_GR_030 - 22K = 24K × 91.6% and 18K = 24K × 75% (2 decimals) for typical rates @smoke @regression', async ({ grp, record }) => {
    await grp.openNew();
    const out = [];
    for (const v of data.calc) {
      await grp.type24k(v);
      const r = await grp.values();
      out.push(`${v} → ${r.r22} / ${r.r18}`);
      expect.soft(Number(r.r22), `22K for ${v}`).toBeCloseTo(round2(v * data.ratio22), 2);
      expect.soft(Number(r.r18), `18K for ${v}`).toBeCloseTo(round2(v * data.ratio18), 2);
    }
    record(out.join('; '));
  });

  test('TC_GR_031 - 22K and 18K rates cannot be edited by the user @regression', async ({ grp, record }) => {
    await grp.openNew();
    await grp.type24k('15000');
    const before = await grp.values();
    expect(await grp.rate22k.isEditable()).toBe(false);
    expect(await grp.rate18k.isEditable()).toBe(false);
    await grp.rate22k.click({ force: true });
    await grp.page.keyboard.type('1');
    const after = await grp.values();
    record(`22K ${before.r22} → ${after.r22}, 18K ${before.r18} → ${after.r18}`);
    expect(after.r22).toBe(before.r22);
  });

  test('TC_GR_032 - Every saved rate in the grid follows the 22K / 18K ratio to 24K @regression', async ({ grp, record }) => {
    await grp.setRange('All');
    const rows = await grp.allRows();
    const bad = rows.filter((r) => Math.abs(r.r22 - round2(r.r24 * data.ratio22)) > 0.011 || Math.abs(r.r18 - round2(r.r24 * data.ratio18)) > 0.011);
    record(`${rows.length} rows checked; mismatches: ${bad.map((r) => `${r.date} ${r.r24}/${r.r22}/${r.r18}`).join(', ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GR_033 - Internal Rate for the day = lower of 30-day average (A) and previous closing (B) @regression', async ({ grp, record }) => {
    await grp.tab('Internal Rate');
    const rows = await grp.internalRows();
    expect(rows.length).toBeGreaterThan(0);
    const bad = rows.filter((r) => Math.abs(r.rate - Math.min(r.avg30, r.prevClosing)) > 0.011);
    record(`${rows.length} rows; ${bad.length} where rate ≠ min(A,B): ${bad.slice(0, 8).map((r) => `${r.date} A ${r.avg30} B ${r.prevClosing} rate ${r.rate}`).join('; ')}`);
    expect(bad).toEqual([]);
  });

  test('TC_GR_034 - Internal Rate "Previous Closing (B)" equals the Online 24K rate of the previous rate date @regression', async ({ grp, record }) => {
    await grp.setRange('All');
    const online = (await grp.allRows()).map((r) => ({ ...r, t: parse(r.date).getTime() })).sort((a, b) => a.t - b.t);
    await grp.tab('Internal Rate');
    const internal = (await grp.internalRows()).slice(0, 20);
    const bad = [];
    for (const r of internal) {
      const t = parse(r.date).getTime();
      const prev = online.filter((o) => o.t < t).pop();
      if (prev && Math.abs(prev.r24 - r.prevClosing) > 0.011) bad.push(`${r.date}: B ${r.prevClosing} vs online ${prev.date} ${prev.r24}`);
    }
    record(`${internal.length} internal rows checked; mismatches: ${bad.join('; ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GR_035 - Online rate is editable/deletable only until its derived Internal Rate is Approved (lock + tooltip after) @regression', async ({ grp, record }) => {
    const online = await grp.rows();
    await grp.tab('Internal Rate');
    const internal = (await grp.internalRows()).map((r) => ({ ...r, t: parse(r.date).getTime() })).sort((a, b) => a.t - b.t);
    const bad = [];
    let checked = 0;
    for (const o of online) {
      const derived = internal.find((i) => i.t > parse(o.date).getTime());
      if (!derived) continue;
      checked++;
      const approved = /APPROVED/i.test(derived.status);
      if (approved && (o.editable || o.deletable || o.lockTitle !== data.lockTitle)) bad.push(`${o.date} should be locked (internal ${derived.date} APPROVED)`);
      if (!approved && !(o.editable && o.deletable)) bad.push(`${o.date} should be editable (internal ${derived.date} ${derived.status})`);
    }
    record(`${checked} rows checked; violations: ${bad.join('; ') || 'none'}`);
    expect(checked).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });

  test('TC_GR_036 - "Manual Gold Rate Entry in Gold Estimates" switch reflects the company feature setting @regression', async ({ page, grp, apiHits, record }) => {
    const hit = apiHits.find((h) => /getcompanyfeatureconfig/i.test(h.url) && h.text);
    expect(hit, 'getcompanyfeatureconfig was not called').toBeTruthy();
    const status = JSON.parse(hit.text).pStatus;
    const label = (await page.getByText('MANUAL GOLD RATE ENTRY IN GOLD ESTIMATES').locator('xpath=..').innerText()).replace(/\s+/g, ' ');
    record(`API pStatus ${status}; screen "${label}"`);
    expect(label).toMatch(status === 'ACTIVE' ? /\bOn\b/ : /\bOff\b/);
  });
});
