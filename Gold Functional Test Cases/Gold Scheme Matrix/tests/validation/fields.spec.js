const { test, expect, WRITE_API } = require('../../fixtures');

// Typed like a user; checked after leaving the field. No data is saved.
const CASES = [
  ['TC_GS_017', 'tenure', 'abc', '', 'letters rejected'],
  ['TC_GS_018', 'tenure', '-3', '3', 'minus sign stripped'],
  ['TC_GS_019', 'tenure', '1.5', '!15', 'decimal tenure is not silently turned into 15 (HYPOTHESIS)'],
  ['TC_GS_020', 'rate', 'abc', '', 'letters rejected'],
  ['TC_GS_021', 'rate', '-5', '5', 'minus sign stripped'],
  ['TC_GS_022', 'rate', '12.345', '12.34', 'max 2 decimals'],
  ['TC_GS_023', 'rate', '99.99', '99.99', 'upper boundary 99.99 kept'],
  ['TC_GS_024', 'rate', '150', '!15', '150 % is not silently cut to 15 % (HYPOTHESIS)'],
];

test.describe('Gold Scheme Matrix – field validation', () => {
  for (const [id, field, typed, expected, desc] of CASES) {
    test(`${id} - ${field === 'rate' ? 'Interest rate' : 'Tenure'} "${typed}" → ${expected.startsWith('!') ? `not "${expected.slice(1)}"` : `"${expected}"`} (${desc}) @regression`, async ({ gsm, record }) => {
      await gsm.openNew();
      await gsm.typeInto(gsm[field], typed);
      const v = await gsm[field].inputValue();
      record(`Typed "${typed}" → "${v}"`);
      if (expected.startsWith('!')) expect(v).not.toBe(expected.slice(1));
      else expect(v).toBe(expected);
    });
  }

  test('TC_GS_025 - Scheme Code length is limited (HYPOTHESIS: maxlength set) @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.code.fill('A'.repeat(60));
    const v = await gsm.code.inputValue();
    const max = await gsm.code.getAttribute('maxlength');
    record(`60 characters typed → ${v.length} kept; maxlength=${max}`);
    expect(max).not.toBeNull();
  });

  test('TC_GS_026 - Scheme Name accepts Unicode text @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.name.fill('स्वर्ण योजना – Gold ₹');
    const v = await gsm.name.inputValue();
    record(`Name "${v}"`);
    expect(v).toBe('स्वर्ण योजना – Gold ₹');
  });

  test('TC_GS_027 - Tenure 0 is refused on save (HYPOTHESIS) @regression', async ({ gsm, apiHits, blockWrites, record }) => {
    await blockWrites();
    await gsm.openNew();
    await gsm.fill({ loan: 'New Gold (GLNG)', code: 'AT-ZERO', name: 'zero tenure', tenure: 0, rate: 18 });
    await gsm.applyAll.click();
    await gsm.saveBtn.click();
    const msg = await gsm.waitMessage().catch(() => '');
    const sent = apiHits.filter((h) => /savegoldschemeconfiguration/i.test(h.url));
    record(`Message "${msg}"; save request sent: ${sent.length > 0}${sent[0] ? ` (pTenureMonths ${JSON.parse(sent[0].body).pTenureMonths})` : ''}`);
    expect(sent, 'a scheme with 0-month tenure must not be sent').toHaveLength(0);
  });

  for (const [id, missing] of [['TC_GS_028', 'loan'], ['TC_GS_029', 'code'], ['TC_GS_030', 'name']]) {
    test(`${id} - Save without ${missing === 'loan' ? 'the aligned Loan' : `Scheme ${missing}`} shows the mandatory-fields warning and sends nothing @regression`, async ({ gsm, apiHits, blockWrites, record }) => {
      await blockWrites();
      await gsm.openNew();
      const d = { loan: 'New Gold (GLNG)', code: 'AT-MISS', name: 'missing field', tenure: 6, rate: 18 };
      d[missing] = missing === 'loan' ? null : '';
      await gsm.fill(d);
      await gsm.applyAll.click();
      await gsm.saveBtn.click();
      const msg = await gsm.waitMessage();
      const sent = apiHits.filter((h) => WRITE_API.test(h.url));
      record(`Message "${msg}"; write requests ${sent.length}`);
      expect(msg).toMatch(/Please fill all mandatory fields/i);
      expect(sent).toHaveLength(0);
    });
  }

  test('TC_GS_031 - Save with everything empty shows "Please fill all mandatory fields, including the aligned Loan" @smoke @regression', async ({ gsm, apiHits, blockWrites, record }) => {
    await blockWrites();
    await gsm.openNew();
    await gsm.saveBtn.click();
    const msg = await gsm.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Please fill all mandatory fields, including the aligned Loan/);
    expect(apiHits.filter((h) => WRITE_API.test(h.url))).toHaveLength(0);
  });

  // Loan Configuration of New Gold (GLNG) allows 2 % – 24 % (observed message)
  for (const [id, rate, ok] of [['TC_GS_032', 0, false], ['TC_GS_071', 1.99, false], ['TC_GS_072', 2, true], ['TC_GS_073', 24, true], ['TC_GS_074', 24.01, false]]) {
    test(`${id} - Interest rate ${rate} % is ${ok ? 'accepted' : 'refused'} (loan allows 2 % – 24 %) @regression`, async ({ gsm, apiHits, blockWrites, record }) => {
      await blockWrites();
      await gsm.openNew();
      await gsm.fill({ loan: 'New Gold (GLNG)', code: 'AT-RANGE', name: 'rate range', tenure: 6, rate });
      await gsm.applyAll.click();
      await gsm.saveBtn.click();
      const msg = await gsm.waitMessage();
      const sent = apiHits.filter((h) => /savegoldschemeconfiguration/i.test(h.url));
      record(`Rate ${rate}: message "${msg}"; save request sent ${sent.length > 0} (blocked)`);
      if (ok) expect(sent.length, `${rate} % should be sent to the server`).toBeGreaterThan(0);
      else {
        expect(msg).toMatch(/Interest rate must be between 2% and 24%/);
        expect(sent).toHaveLength(0);
      }
    });
  }
});
