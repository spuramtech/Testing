const { test, expect, IMAGE, SAVE_API } = require('../../fixtures');
const { round2 } = require('../../pages/GoldEstimatesPage');

// SaveMakerEntry is BLOCKED or SIMULATED in this file – no estimate is created. The image upload runs (stores a file only).
async function prepare(ge, { scheme = 'GL-quick — 3 mo', remarks = 'Automation review check' } = {}) {
  if (scheme) await ge.scheme.selectOption({ label: scheme });
  await ge.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
  await ge.uploadImage(IMAGE);
  await ge.remarks.fill(remarks);
}

test.describe('Gold Estimates – review dialog, payload and failures', () => {
  test('TC_GE_045 - Save opens "Review Gold Estimate" with the same customer, weights, value, eligible loan and articles @smoke @regression', async ({ geContact, blockSave, record }) => {
    await blockSave();
    await prepare(geContact);
    const t = await geContact.totals();
    await geContact.saveBtn.click();
    await expect(geContact.review).toBeVisible();
    const txt = (await geContact.review.innerText()).replace(/\s+/g, ' ');
    record(txt.slice(0, 600));
    expect(txt).toMatch(/nothing is saved until you confirm/i);
    expect(txt).toContain('TOTAL GROSS WEIGHT 10.5 g');
    expect(txt).toContain('TOTAL NET WEIGHT 10 g');
    expect(txt).toContain(`ELIGIBLE LOAN AMOUNT (LTV) ₹ ${t.eligible.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
    expect(txt).toMatch(/RING 22K .* 10\.5 0\.5 10 0% 0% 1/);
  });

  test('TC_GE_046 - Back to Edit closes the review without saving and keeps the entries @regression', async ({ geContact, blockSave, apiHits, record }) => {
    await blockSave();
    await prepare(geContact);
    await geContact.saveBtn.click();
    await expect(geContact.review).toBeVisible();
    await geContact.backBtn.click();
    await expect(geContact.review).toBeHidden();
    const gross = await geContact.cell(0, 4).inputValue();
    record(`After Back: gross "${gross}", save requests ${apiHits.filter((h) => SAVE_API.test(h.url)).length}`);
    expect(gross).toBe('10.5');
    expect(apiHits.filter((h) => SAVE_API.test(h.url))).toHaveLength(0);
  });

  test('TC_GE_047 - Confirm sends the estimate with scheme rate/tenure, rate per gram, eligible value and article lines (blocked) @regression', async ({ geContact, blockSave, apiHits, record }) => {
    await blockSave();
    await prepare(geContact);
    const t = await geContact.totals();
    await geContact.saveBtn.click();
    await geContact.confirmBtn.click();
    await expect.poll(() => apiHits.filter((h) => SAVE_API.test(h.url)).length).toBe(1);
    const b = JSON.parse(apiHits.find((h) => SAVE_API.test(h.url)).body);
    record(JSON.stringify({ ...b, pArticles: b.pArticles.length }).slice(0, 700));
    expect(b).toMatchObject({ pGenumber: null, pLoantypeid: 88, pSchemeid: 1, pInterestrate: 22, pTenure: 3, pGrossweight: 10.5, pNetweight: 10 });
    expect(b.pRategram).toBeCloseTo(t.ratePerGram, 1);
    expect(b.pEstimatedvalue).toBeCloseTo(t.eligible, 0);
    expect(b.pArticles).toHaveLength(1);
    expect(b.pArticles[0]).toMatchObject({ pGoldarticletype: 'RING', pGrossweight: 10.5, pNetweight: 10, pQuantity: 1, pStoneweight: 0.5 });
    expect(b.pGoldArticlesImageName).toMatch(/\.png$/);
  });

  test('TC_GE_048 - Save failure shows "Failed to save the gold estimate." and no success @regression', async ({ geContact, mockWrite, record }) => {
    await mockWrite('SaveMakerEntry', 'abort');
    await prepare(geContact);
    await geContact.saveBtn.click();
    await geContact.clearToasts();
    await geContact.confirmBtn.click();
    const msg = await geContact.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Failed to save the gold estimate/);
    expect(msg).not.toMatch(/success/i);
  });

  test('TC_GE_049 - Server error 500 on save is reported and the entries are kept @regression', async ({ geContact, mockWrite, record }) => {
    await mockWrite('SaveMakerEntry', { message: 'Simulated server error' }, { status: 500 });
    await prepare(geContact);
    await geContact.saveBtn.click();
    await geContact.clearToasts();
    await geContact.confirmBtn.click();
    const msg = await geContact.waitMessage();
    await geContact.page.keyboard.press('Escape');
    const gross = await geContact.cell(0, 4).inputValue().catch(() => '');
    record(`Message "${msg}"; gross still "${gross}"`);
    expect(msg).toMatch(/fail|error/i);
    expect(gross).toBe('10.5');
  });

  test('TC_GE_050 - Double-click on Confirm & Save sends one request (simulated failure response) @regression', async ({ geContact, mockWrite, record }) => {
    const sent = await mockWrite('SaveMakerEntry', { message: 'Simulated – not saved' }, { status: 500 });
    await prepare(geContact);
    await geContact.saveBtn.click();
    await geContact.confirmBtn.dblclick();
    await geContact.page.waitForTimeout(2500);
    record(`SaveMakerEntry requests: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_GE_051 - Estimate without a scheme: what is sent as rate/eligible value when LTV is "Not Configured" (HYPOTHESIS: save refused) @regression', async ({ geContact, blockSave, apiHits, record }) => {
    await blockSave();
    await prepare(geContact, { scheme: null });
    await geContact.clearToasts();
    await geContact.saveBtn.click();
    await geContact.page.waitForTimeout(1500);
    const reviewShown = await geContact.review.isVisible();
    const msg = await geContact.messages();
    let body = null;
    if (reviewShown) {
      await geContact.confirmBtn.click();
      await expect.poll(() => apiHits.filter((h) => SAVE_API.test(h.url)).length).toBe(1);
      body = JSON.parse(apiHits.find((h) => SAVE_API.test(h.url)).body);
    }
    record(`Review shown ${reviewShown}; message "${msg}"; sent ${body ? `pRategram ${body.pRategram}, pEstimatedvalue ${body.pEstimatedvalue}, pSchemeid ${body.pSchemeid}` : 'nothing'}`);
    expect(reviewShown, 'an estimate without any LTV should not reach Confirm').toBe(false);
    void round2;
  });
});
