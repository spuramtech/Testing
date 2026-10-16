const { test, expect, SAVE_API } = require('../../fixtures');
const env = require('../../../common/config/env');

// REAL save: turns an AUTOTEST token into a gold loan (permanent loan number, token becomes "used").
// Runs only with ALLOW_DATA_CREATION=1 and only on a token whose customer name starts with "Autotest".
test.describe('Gold Token – real loan generation (opt-in)', () => {
  test.skip(!env.allowDataCreation, 'ALLOW_DATA_CREATION=1 not set – creates a permanent gold loan');

  test('TC_GT_041 - AUTOTEST token → nominee → amount → Save creates the loan and moves the token to Used @regression', async ({ gt, apiHits, record }) => {
    const target = (await gt.tokens()).find((t) => /^Autotest/i.test(t.customer));
    test.skip(!target, 'no available AUTOTEST token (approve an AUTOTEST estimate first)');
    await gt.selectToken(target.token);
    const o = await gt.overview();
    await gt.toLoanDetails();
    const amount = Math.floor((o.eligible * 0.9) / 1000) * 1000;
    await gt.typeAmount(amount);
    await gt.saveBtn.click();
    const msg = await gt.waitMessage();
    const res = apiHits.find((h) => SAVE_API.test(h.url));
    const loan = ((res && res.text) || '').match(/[A-Z]{4}\d{10,}/);
    await gt.open();
    const left = (await gt.tokens()).map((t) => t.token);
    record(`${target.token} → ₹${amount}: "${msg}"; loan ${loan && loan[0]}; still available ${left.includes(target.token)}`);
    expect(msg).toMatch(/success|saved|generated|created/i);
    expect(left).not.toContain(target.token);
  });
});
