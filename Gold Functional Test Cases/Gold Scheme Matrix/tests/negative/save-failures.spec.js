const { test, expect } = require('../../fixtures');

// Save calls are aborted or answered with SIMULATED responses – nothing reaches the server.
const header = { loan: 'New Gold (GLNG)', code: 'AT-SIM', name: 'AUTOTEST SIMULATED', tenure: 6, type: 'BULLET', rate: 20, active: false };

test.describe('Gold Scheme Matrix – save payload and failures', () => {
  test('TC_GS_042 - Save sends the header with Paise/mo = rate ÷ 12, ISO Effective From and chosen status (simulated server) @regression', async ({ gsm, mockWrite, record }) => {
    const sent = await mockWrite('savegoldschemeconfiguration', 999999999);
    await mockWrite('savegoldschemeslabrates', true);
    await gsm.openNew();
    await gsm.fill(header);
    await gsm.applyAll.click();
    const eff = await gsm.effectiveFrom.inputValue();
    await gsm.saveBtn.click();
    await expect.poll(() => sent.length).toBe(1);
    const b = sent[0];
    record(JSON.stringify(b));
    expect(b).toMatchObject({ precordid: 0, pLoanId: 88, pSchemeCode: 'AT-SIM', pSchemeName: 'AUTOTEST SIMULATED', pTenureMonths: 6, pRateOfInterest: 20, pStatus: 'INACTIVE', pSchemeType: 'BULLET' });
    expect(b.pPaisePerMonth).toBeCloseTo(20 / 12, 2);
    expect(b.pEffectiveFrom.slice(0, 10)).toBe(eff.split('/').reverse().join('-'));
  });

  test('TC_GS_043 - Slab rates are saved for the new scheme id, excluded slabs as INACTIVE (simulated server) @regression', async ({ gsm, mockWrite, record }) => {
    await mockWrite('savegoldschemeconfiguration', 999999999);
    const slabs = await mockWrite('savegoldschemeslabrates', true);
    await gsm.openNew();
    await gsm.fill(header);
    await gsm.applyAll.click();
    await gsm.setSlabRate(0, 19);
    await gsm.toggleSlab(2);
    await gsm.saveBtn.click();
    await expect.poll(() => slabs.length).toBe(1);
    const r = slabs[0].pRates;
    record(JSON.stringify(slabs[0]));
    expect(slabs[0].pSchemeId).toBe(999999999);
    expect(r.map((x) => x.pRateOfInterest)).toEqual([19, 20, 20]);
    expect(r.map((x) => x.pStatus)).toEqual(['ACTIVE', 'ACTIVE', 'INACTIVE']);
    expect(r[0].pPaisePerMonth).toBeCloseTo(19 / 12, 2);
  });

  test('TC_GS_044 - Save during a network failure shows "Unable to save scheme" and no success @regression', async ({ gsm, mockWrite, record }) => {
    await mockWrite('savegoldschemeconfiguration', 'abort');
    await gsm.openNew();
    await gsm.fill(header);
    await gsm.applyAll.click();
    await gsm.saveBtn.click();
    const msg = await gsm.waitMessage();
    record(`Message "${msg}"; panel open ${await gsm.code.isVisible()}`);
    expect(msg).toMatch(/Unable to save scheme/i);
    expect(msg).not.toMatch(/success/i);
  });

  test('TC_GS_045 - Save when the server returns HTTP 500 shows an error and keeps the entered data @regression', async ({ gsm, mockWrite, record }) => {
    await mockWrite('savegoldschemeconfiguration', { message: 'Simulated server error' }, { status: 500 });
    await gsm.openNew();
    await gsm.fill(header);
    await gsm.applyAll.click();
    await gsm.saveBtn.click();
    const msg = await gsm.waitMessage();
    const kept = await gsm.code.inputValue().catch(() => '');
    record(`Message "${msg}"; code still "${kept}"`);
    expect(msg).toMatch(/error|unable/i);
    expect(kept).toBe('AT-SIM');
  });

  test('TC_GS_046 - Header saved but slab save fails – user is told (simulated) (HYPOTHESIS) @regression', async ({ gsm, mockWrite, record }) => {
    await mockWrite('savegoldschemeconfiguration', 999999999);
    await mockWrite('savegoldschemeslabrates', { message: 'Simulated slab failure' }, { status: 500 });
    await gsm.openNew();
    await gsm.fill(header);
    await gsm.applyAll.click();
    await gsm.saveBtn.click();
    const msg = await gsm.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/error|unable|slab/i);
    expect(msg).not.toMatch(/Scheme added successfully/i);
  });

  test('TC_GS_047 - Double-click on Save Scheme sends one save (simulated server) @regression', async ({ gsm, mockWrite, record }) => {
    const sent = await mockWrite('savegoldschemeconfiguration', 999999999);
    await mockWrite('savegoldschemeslabrates', true);
    await gsm.openNew();
    await gsm.fill(header);
    await gsm.applyAll.click();
    await gsm.saveBtn.dblclick();
    await gsm.page.waitForTimeout(2500);
    record(`savegoldschemeconfiguration calls: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });
});
