const { test, expect, IMAGE, SAVE_API } = require('../../fixtures');

// Typed like a user into row 1; nothing is saved.
const MASKS = [
  ['TC_GE_016', 3, 'Quantity', 'abc', '', 'letters rejected'],
  ['TC_GE_017', 3, 'Quantity', '-2', '2', 'minus stripped'],
  ['TC_GE_018', 3, 'Quantity', '1.5', '!15', 'decimal quantity not silently turned into 15 (HYPOTHESIS)'],
  ['TC_GE_019', 3, 'Quantity', '999', '99', 'max 2 digits'],
  ['TC_GE_020', 4, 'Gross weight', 'abc', '', 'letters rejected'],
  ['TC_GE_021', 4, 'Gross weight', '-5', '5', 'minus stripped'],
  ['TC_GE_022', 4, 'Gross weight', '10.12345', '10.12', 'max 2 decimals'],
  ['TC_GE_023', 5, 'Stone/Wastage', 'abc', '', 'letters rejected'],
];

test.describe('Gold Estimates – input validation', () => {
  for (const [id, col, name, typed, exp, desc] of MASKS) {
    test(`${id} - ${name} "${typed}" → ${exp.startsWith('!') ? `not "${exp.slice(1)}"` : `"${exp}"`} (${desc}) @regression`, async ({ geContact, record }) => {
      await geContact.rows().nth(0).locator('td[aria-colindex="2"] select').selectOption({ label: 'RING' });
      await geContact.typeCell(0, col, typed);
      const v = await geContact.cell(0, col).inputValue();
      record(`Typed "${typed}" → "${v}"`);
      if (exp.startsWith('!')) expect(v).not.toBe(exp.slice(1));
      else expect(v).toBe(exp);
    });
  }

  test('TC_GE_024 - Quantity 0 is refused with a message about the quantity @regression', async ({ geContact, record }) => {
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 5, stone: 0 });
    await geContact.clearToasts();
    await geContact.typeCell(0, 3, '0');
    const msg = await geContact.waitMessage();
    record(`Message "${msg}"; quantity now "${await geContact.cell(0, 3).inputValue()}"`);
    expect(msg).toMatch(/quantity/i);
  });

  test('TC_GE_025 - Gross weight 0 is refused ("Gross weight Can Not Be Zero") @regression', async ({ geContact, record }) => {
    await geContact.rows().nth(0).locator('td[aria-colindex="2"] select').selectOption({ label: 'RING' });
    await geContact.typeCell(0, 3, '1');
    await geContact.cell(0, 4).fill('0');
    await geContact.cell(0, 4).press('Tab');
    const msg = await geContact.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Gross weight Can Not Be Zero/i);
  });

  test('TC_GE_026 - Stone/Wastage greater than gross weight is refused and cleared @smoke @regression', async ({ geContact, record }) => {
    await geContact.fillRow(0, { type: 'CHAIN', quantity: 1, gross: 5, stone: 6 });
    const msg = await geContact.messages();
    const r = await geContact.readRow(0);
    record(`Message "${msg}"; stone "${await geContact.cell(0, 5).inputValue()}"; net ${r.net}`);
    expect(msg).toMatch(/Stone\/Wastage weight can not be greater than Gross weight/);
    expect(r.total || 0).toBe(0);
  });

  test('TC_GE_027 - Stone/Wastage equal to gross weight (net 0) is refused (HYPOTHESIS) @regression', async ({ geContact, record }) => {
    await geContact.fillRow(0, { type: 'CHAIN', quantity: 1, gross: 5, stone: 5 });
    const msg = await geContact.messages();
    const r = await geContact.readRow(0);
    record(`Message "${msg || 'none'}"; net ${r.net}; total ${r.total}`);
    expect(msg).toMatch(/stone|net|weight/i);
  });

  test('TC_GE_028 - Remarks are limited to 90 characters @regression', async ({ geContact, record }) => {
    await geContact.remarks.fill('R'.repeat(120));
    const v = await geContact.remarks.inputValue();
    record(`120 typed → ${v.length} kept`);
    expect(v.length).toBe(90);
  });

  test('TC_GE_029 - Save with no article shows "Add Gold Article" @smoke @regression', async ({ ge, apiHits, record }) => {
    await ge.saveBtn.click();
    const msg = await ge.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Add Gold Article/);
    await expect(ge.review).toBeHidden();
    expect(apiHits.filter((h) => SAVE_API.test(h.url))).toHaveLength(0);
  });

  test('TC_GE_030 - Save without an image shows "Please Upload Gold Articles Images" @regression', async ({ geContact, record }) => {
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    await geContact.saveBtn.click();
    const msg = await geContact.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Please Upload Gold Articles Images/);
    await expect(geContact.review).toBeHidden();
  });

  test('TC_GE_031 - Article type chosen but no gross weight – save refused with "Gross weight is required" @regression', async ({ geContact, record }) => {
    await geContact.rows().nth(0).locator('td[aria-colindex="2"] select').selectOption({ label: 'RING' });
    await geContact.typeCell(0, 3, '1');
    await geContact.uploadImage(IMAGE);
    await geContact.clearToasts();
    await geContact.saveBtn.click();
    const msg = await geContact.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Gross weight is required|Add Gold Article|fill the required fields for all gold articles/i);
    await expect(geContact.review).toBeHidden();
  });

  test('TC_GE_032 - Quantity above the per-person limit (Ankle Wear max 5) is refused @regression', async ({ geContact, apiHits, record }) => {
    const lim = (JSON.parse(apiHits.find((h) => /GetGoldArticleCustomerLimitMaster/i.test(h.url) && h.text).text) || []).find((x) => x.pGoldarticletype === 'Ankle Wear');
    await geContact.fillRow(0, { type: 'Ankle Wear', quantity: lim.pMaxquantityperperson + 1, gross: 10, stone: 0 });
    await geContact.uploadImage(IMAGE);
    await geContact.saveBtn.click();
    await geContact.page.waitForTimeout(1500);
    const msg = await geContact.messages();
    const reviewShown = await geContact.review.isVisible();
    record(`Limit ${lim.pMaxquantityperperson}; quantity ${lim.pMaxquantityperperson + 1} → message "${msg || 'none'}", review shown ${reviewShown}`);
    expect(reviewShown).toBe(false);
    expect(msg).toMatch(/limit|maximum|max|exceed|allowed/i);
  });

  test('TC_GE_033 - Remarks are saved exactly as typed (no automatic capitalisation) (HYPOTHESIS) @regression', async ({ geContact, blockSave, apiHits, record }) => {
    await blockSave();
    await geContact.scheme.selectOption({ label: 'GL-quick — 3 mo' });
    await geContact.fillRow(0, { type: 'RING', quantity: 1, gross: 10.5, stone: 0.5 });
    await geContact.uploadImage(IMAGE);
    await geContact.remarks.fill('checked by qa team');
    await geContact.saveBtn.click();
    await expect(geContact.review).toBeVisible();
    await geContact.confirmBtn.click();
    await expect.poll(() => apiHits.filter((h) => SAVE_API.test(h.url)).length).toBe(1);
    const body = JSON.parse(apiHits.find((h) => SAVE_API.test(h.url)).body);
    record(`Typed "checked by qa team" → sent "${body.pRemarks}"`);
    expect(body.pRemarks).toBe('checked by qa team');
  });
});
