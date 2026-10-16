const { test, expect } = require('../../fixtures');
const data = require('../../test-data/gold-rate-data');
const { round2 } = require('../../pages/DailyGoldRatePage');

// 24K Gold Rate input mask – typed like a user, checked after leaving the field
test.describe('Daily Gold Rate – 24K rate input validation', () => {
  for (const [id, typed, expected, desc] of data.inputMask) {
    test(`${id} - 24K input: "${typed}" → "${expected}" (${desc}) @regression`, async ({ grp, record }) => {
      await grp.openNew();
      await grp.type24k(typed);
      const v = await grp.values();
      record(`Typed "${typed}" → 24K "${v.r24}", 22K "${v.r22}", 18K "${v.r18}"`);
      expect(v.r24).toBe(expected);
      if (expected === '') expect(v.r22).toBe('');
    });
  }

  for (const [id, value] of [['TC_GR_028', 1], ['TC_GR_029', 99999.99]]) {
    test(`${id} - Boundary 24K ${value} is accepted and 22K / 18K are calculated @regression`, async ({ grp, record }) => {
      await grp.openNew();
      await grp.type24k(value);
      const v = await grp.values();
      record(`24K "${v.r24}" → 22K "${v.r22}", 18K "${v.r18}"`);
      expect(Number(v.r24.replace(/,/g, ''))).toBe(value);
      expect(Number(v.r22)).toBeCloseTo(round2(value * data.ratio22), 2);
      expect(Number(v.r18)).toBeCloseTo(round2(value * data.ratio18), 2);
    });
  }
});
