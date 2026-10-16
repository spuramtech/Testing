const { test, expect } = require('../../fixtures');
const data = require('../../test-data/gold-rate-data');

const SAVE_API = /saveonlinegoldrate|savegoldrateltv/i;

test.describe('Daily Gold Rate – negative save scenarios', () => {
  test('TC_GR_037 - Save without a 24K rate shows the required warning and sends nothing @smoke @regression', async ({ grp, apiHits, record }) => {
    await grp.openNew();
    await grp.saveBtn.click();
    const msg = await grp.waitMessage();
    record(`Message "${msg}"; save requests ${apiHits.filter((h) => SAVE_API.test(h.url)).length}`);
    expect(msg).toMatch(data.requiredMessage);
    expect(apiHits.filter((h) => SAVE_API.test(h.url))).toHaveLength(0);
    await expect(grp.rate24k).toBeVisible(); // panel stays open
  });

  test('TC_GR_038 - Save with a zero 24K rate is rejected with the required warning @regression', async ({ grp, apiHits, record }) => {
    await grp.openNew();
    await grp.type24k('0');
    await grp.saveBtn.click();
    const msg = await grp.waitMessage();
    record(`24K "${await grp.rate24k.inputValue()}"; message "${msg}"`);
    expect(msg).toMatch(data.requiredMessage);
    expect(apiHits.filter((h) => SAVE_API.test(h.url))).toHaveLength(0);
  });

  test('TC_GR_039 - A second rate for a Trans Date that already has one is rejected (duplicate) @regression', async ({ grp, apiHits, record }) => {
    await grp.openNew();
    const date = await grp.transDate.inputValue();
    await grp.page.reload();
    await grp.open();
    const existing = (await grp.rows()).find((r) => r.date === date);
    test.skip(!existing, `default Trans Date ${date} has no rate yet – nothing to duplicate`);
    // Same 24K as the existing row, so the data stays unchanged even if the app wrongly accepts it
    await grp.openNew();
    await expect(grp.transDate).toHaveValue(date);
    await grp.type24k(existing.r24.toFixed(2));
    await grp.saveBtn.click();
    const msg = await grp.waitMessage();
    const saves = apiHits.filter((h) => SAVE_API.test(h.url));
    record(`Date ${date} (existing 24K ${existing.r24}); message "${msg}"; save responses ${saves.map((s) => `${s.status} ${String(s.text).slice(0, 80)}`).join(', ') || 'none sent'}`);
    expect(msg).not.toMatch(/saved successfully/i);
    expect(msg).toMatch(/already|exist|duplicate/i);
  });

  test('TC_GR_040 - Update with the 24K rate cleared shows the required warning @regression', async ({ grp, apiHits, record }) => {
    const row = (await grp.rows()).find((r) => r.editable);
    test.skip(!row, 'no editable row (all closings already have an approved Internal Rate)');
    await grp.rowLocator(row.date).locator('.fa-pencil').click();
    await expect(grp.rate24k).toBeVisible();
    await grp.type24k('');
    await grp.updateBtn.click();
    const msg = await grp.waitMessage();
    record(`Row ${row.date}; message "${msg}"`);
    expect(msg).toMatch(data.requiredMessage);
    expect(apiHits.filter((h) => SAVE_API.test(h.url))).toHaveLength(0);
  });

  for (const [id, mode] of [['TC_GR_060', 'network failure'], ['TC_GR_061', 'server error 500']]) {
    test(`${id} - Save during a ${mode} does not report success and keeps the entry for retry @regression`, async ({ page, grp, record }) => {
      const date = await grp.freeDate();
      test.skip(!date, 'no free past working day found');
      // Both save calls are intercepted, so nothing reaches the server
      await page.route(SAVE_API, (route) => (mode === 'network failure' ? route.abort('failed') : route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Simulated server error"}' })));
      await grp.openNew();
      expect(await grp.pickDate(date)).toBe(true);
      await grp.type24k('14321.5');
      await grp.saveBtn.click();
      await page.waitForTimeout(3000);
      const msg = await grp.messages();
      const v = await grp.values().catch(() => null);
      record(`Date ${date}; message "${msg || 'none'}"; panel ${v ? `still open with 24K ${v.r24}` : 'closed'}`);
      expect(msg).not.toMatch(/saved successfully|submitted for Checker approval/i);
      expect(v && v.r24).toBe('14,321.5');
      await page.unroute(SAVE_API);
    });
  }
});
