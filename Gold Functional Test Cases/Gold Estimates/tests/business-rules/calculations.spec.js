const { test, expect } = require('../../fixtures');
const { expectedNet, round2 } = require('../../pages/GoldEstimatesPage');

// Grid and totals calculations – nothing is saved.
const json = (hits, re) => { const h = hits.filter((x) => re.test(x.url) && x.text).sort((a, b) => b.text.length - a.text.length)[0]; return h ? JSON.parse(h.text) : null; };

test.describe('Gold Estimates – weight, value and LTV rules', () => {
  // [id, gross, stone, band]
  for (const [id, gross, stone, band] of [
    ['TC_GE_034', 10.5, 0.5, 'stone < 5 % → no wastage'],
    ['TC_GE_035', 20, 1, 'stone 5–10 % → 1 % wastage'],
    ['TC_GE_036', 10, 2, 'stone 10–25 % → 2 % wastage'],
    ['TC_GE_037', 10, 3, 'stone 25–40 % → 5 % wastage'],
    ['TC_GE_038', 10, 5, 'stone ≥ 40 % → 8 % wastage'],
  ]) {
    test(`${id} - Net weight for ${gross} g with ${stone} g stone: ${band} @regression`, async ({ geContact, record }) => {
      await geContact.fillRow(0, { type: 'CHAIN', quantity: 1, gross, stone });
      const r = await geContact.readRow(0);
      const exp = expectedNet(gross, stone);
      record(`Net ${r.net} ("${r.wastageText}") – expected ${exp}`);
      expect(r.net).toBeCloseTo(exp, 2);
    });
  }

  test('TC_GE_039 - Row total = pure net weight × gold rate per gram @smoke @regression', async ({ geContact, record }) => {
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    const r = await geContact.readRow(0);
    record(`pure ${r.pureNet} × rate ${r.rate} = ${round2(r.pureNet * r.rate)}; shown ${r.total}`);
    expect(r.total).toBeCloseTo(round2(r.pureNet * r.rate), 1);
  });

  test('TC_GE_040 - A lower purity applies its Purity Deduction % (20K uses the 22K rate tier) @regression', async ({ geContact, apiHits, record }) => {
    await geContact.fillRow(0, { purity: '20K', type: 'CHAIN', quantity: 1, gross: 10, stone: 0 });
    const r = await geContact.readRow(0);
    const ded = (json(apiHits, /puritydeductionmaster\/getlist/i) || []).find((p) => Math.abs(Number(p.ppuritypercent) - 83.3) < 0.01); // 20K row (label may differ)
    record(`20K: net ${r.net}, purity ded ${r.purityDed}% (master ${ded && ded.pdeductionpercent}%), pure ${r.pureNet}, rate ${r.rate}, total ${r.total}`);
    expect(r.purityDed).toBeCloseTo(Number(ded.pdeductionpercent), 1);
    expect(r.pureNet).toBeCloseTo(round2(r.net * (1 - r.purityDed / 100)), 2);
    expect(r.total).toBeCloseTo(round2(r.pureNet * r.rate), 1);
  });

  test('TC_GE_041 - Totals add up pure weight, quantity and value of all rows @regression', async ({ geContact, record }) => {
    const rows = [{ type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 }, { type: 'CHAIN', quantity: 1, gross: 5, stone: 0 }, { type: 'BANGLE', quantity: 2, gross: 20, stone: 1, count: 3 }];
    for (let i = 0; i < rows.length; i++) await geContact.fillRow(i, rows[i]);
    const read = [];
    for (let i = 0; i < rows.length; i++) read.push(await geContact.readRow(i));
    const t = await geContact.totals();
    const pure = round2(read.reduce((s, r) => s + r.pureNet, 0));
    const value = round2(read.reduce((s, r) => s + r.total, 0));
    record(`Totals ${JSON.stringify(t)}; expected pure ${pure}, qty 4, value ${value}`);
    expect(t.pureNet).toBeCloseTo(pure, 2);
    expect(t.quantity).toBe(4);
    expect(t.value).toBeCloseTo(value, 1);
  });

  test('TC_GE_042 - Without a scheme the LTV shows "Not Configured" and the user is told to apply a scheme @regression', async ({ geContact, record }) => {
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    const msg = await geContact.messages();
    const t = await geContact.totals();
    record(`LTV "${t.ltvText}"; message "${msg.slice(0, 200)}"`);
    expect(t.ltvText).toMatch(/Not Configured/);
    expect(msg).toMatch(/No LTV Slab configured.*apply a Scheme/);
  });

  for (const [id, gross, slab, label] of [['TC_GE_043', 10.5, 0, 'under ₹2.5 lakh'], ['TC_GE_044', 25, 1, '₹2.5–5 lakh']]) {
    test(`${id} - Scheme GL-quick, appraisal ${label}: LTV = scheme slab LTV, rate/gram and eligible loan follow it @regression`, async ({ geContact, apiHits, record }) => {
      await geContact.scheme.selectOption({ label: 'GL-quick — 3 mo' });
      await geContact.fillRow(0, { type: 'RING', quantity: 1, gross, stone: 0.5 });
      const t = await geContact.totals();
      const r = await geContact.readRow(0);
      const resolved = (json(apiHits, /getresolvedgoldschemeltv/i) || []).filter((x) => x.pSchemeCode === 'GL-QUICK').sort((a, b) => a.pMinimumAmount - b.pMinimumAmount);
      const s = resolved.find((x) => t.value >= x.pMinimumAmount && (x.pMaximumAmount === null || t.value <= x.pMaximumAmount));
      record(`Value ${t.value} → LTV ${t.ltv}% (API slab ${s && s.pInternalLtv}%), rate/gram ${t.ratePerGram}, eligible ${t.eligible}`);
      expect(t.ltv).toBeCloseTo(Number(s.pInternalLtv), 2);
      expect(t.ratePerGram).toBeCloseTo(round2(r.rate * t.ltv / 100), 1);
      expect(t.eligible).toBeCloseTo(round2(t.value * t.ltv / 100), 0);
      void slab;
    });
  }
});
