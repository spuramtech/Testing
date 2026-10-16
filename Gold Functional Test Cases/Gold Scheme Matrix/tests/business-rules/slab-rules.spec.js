const { test, expect } = require('../../fixtures');
const { internalLtv } = require('../../pages/GoldSchemeMatrixPage');

// Form calculations only – nothing is saved.
const round3 = (n) => Math.round(n * 1000) / 1000;

test.describe('Gold Scheme Matrix – slab business rules', () => {
  test('TC_GS_033 - "Apply to all slabs below" copies the default rate to every slab with Paise/mo = rate ÷ 12 @smoke @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.fill({ tenure: 9, type: 'BULLET', rate: 18 });
    await gsm.applyAll.click();
    const slabs = await gsm.slabs();
    record(slabs.map((s) => `${s.range}: ${s.rate}% / ${s.paise}`).join('; '));
    for (const s of slabs) {
      expect(s.rate).toBe(18);
      expect(s.paise).toBeCloseTo(round3(18 / 12), 2);
    }
  });

  for (const [id, type, tenure, rate] of [['TC_GS_034', 'BULLET', 9, 18], ['TC_GS_035', 'BULLET', 3, 22], ['TC_GS_036', 'MONTHLY', 6, 14], ['TC_GS_037', 'MONTHLY', 12, 18]]) {
    test(`${id} - Internal LTV for ${type === 'BULLET' ? 'Bullet' : 'Monthly'} ${tenure} mo at ${rate}% = RBI LTV ÷ (1 + rate × ${type === 'BULLET' ? 'tenure' : '1 month'} ÷ 12) @regression`, async ({ gsm, record }) => {
      await gsm.openNew();
      await gsm.fill({ tenure, type, rate });
      await gsm.applyAll.click();
      const slabs = await gsm.slabs();
      const lines = slabs.map((s) => `${s.range}: RBI ${s.rbi}% → ${s.internal}% (expected ${internalLtv(s.rbi, rate, tenure, type)}%)`);
      record(lines.join('; '));
      for (const s of slabs) expect(s.internal).toBeCloseTo(internalLtv(s.rbi, rate, tenure, type), 2);
    });
  }

  test('TC_GS_038 - Monthly schemes: Internal LTV does not change with tenure @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.fill({ tenure: 3, type: 'MONTHLY', rate: 18 });
    await gsm.applyAll.click();
    const a = (await gsm.slabs()).map((s) => s.internal);
    await gsm.fill({ tenure: 24 });
    const b = (await gsm.slabs()).map((s) => s.internal);
    record(`3 mo ${a.join('/')} vs 24 mo ${b.join('/')}`);
    expect(b).toEqual(a);
  });

  test('TC_GS_039 - Changing one slab\'s rate recalculates only that slab @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.fill({ tenure: 6, type: 'BULLET', rate: 20 });
    await gsm.applyAll.click();
    const before = await gsm.slabs();
    await gsm.setSlabRate(0, 24);
    const after = await gsm.slabs();
    record(`before ${before.map((s) => `${s.rate}/${s.paise}/${s.internal}`).join(' | ')} → after ${after.map((s) => `${s.rate}/${s.paise}/${s.internal}`).join(' | ')}`);
    expect(after[0].paise).toBeCloseTo(2, 2);
    expect(after[0].internal).toBeCloseTo(internalLtv(after[0].rbi, 24, 6, 'BULLET'), 2);
    expect(after.slice(1).map((s) => s.internal)).toEqual(before.slice(1).map((s) => s.internal));
  });

  test('TC_GS_040 - Excluding a slab shows "Not offered"; including it back restores the LTV @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.fill({ tenure: 6, type: 'BULLET', rate: 20 });
    await gsm.applyAll.click();
    const before = (await gsm.slabs())[2];
    await gsm.toggleSlab(2);
    const excluded = (await gsm.slabs())[2];
    const title = await gsm.slabRows().nth(2).locator('[title*="this amount range"]').getAttribute('title');
    await gsm.toggleSlab(2);
    const back = (await gsm.slabs())[2];
    record(`${before.internal} → ${excluded.internal} (button "${title}") → ${back.internal}`);
    expect(excluded.internal).toBe('Not offered');
    expect(title).toMatch(/Include this amount range back/);
    expect(back.internal).toBe(before.internal);
  });

  test('TC_GS_041 - Changing the default rate alone does not overwrite slab rates until "Apply to all slabs" is pressed (HYPOTHESIS) @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.fill({ tenure: 6, type: 'BULLET', rate: 20 });
    await gsm.applyAll.click();
    await gsm.fill({ rate: 15 });
    const slabs = await gsm.slabs();
    record(`Default 15 typed, slab rates ${slabs.map((s) => s.rate).join('/')}`);
    expect(slabs.map((s) => s.rate)).toEqual([20, 20, 20]);
  });
});
