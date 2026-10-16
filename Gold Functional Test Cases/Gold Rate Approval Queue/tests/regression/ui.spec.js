const { test, expect } = require('../../fixtures');

test.describe('Gold Rate Approval Queue – usability, accessibility, responsive', () => {
  test('TC_GQ_046 - At tablet width (768px) cards and actions fit without horizontal scrolling @regression', async ({ page, queue, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const n = await queue.cards.count();
    const box = n ? await queue.card(0).locator('.grq-btn-reject').boundingBox() : null;
    record(`scrollWidth ${sw}; ${n} cards; Reject button right edge ${box ? Math.round(box.x + box.width) : '-'}`);
    expect(sw).toBeLessThanOrEqual(768);
    if (box) expect(box.x + box.width).toBeLessThanOrEqual(768);
  });

  test('TC_GQ_047 - Remarks box and search box have accessible names @regression', async ({ queue, blockWrites, record }) => {
    test.skip(!(await queue.cards.count()), 'queue is empty');
    await blockWrites();
    await queue.openReject(0);
    const named = async (loc) => loc.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')));
    const res = { remarks: await named(queue.remarks), search: await named(queue.search) };
    record(`Accessible name – remarks ${res.remarks}, search ${res.search}`);
    expect(res).toEqual({ remarks: true, search: true });
  });

  test('TC_GQ_048 - Approve / Reject buttons are reachable and announced by keyboard @regression', async ({ page, queue, record }) => {
    test.skip(!(await queue.cards.count()), 'queue is empty');
    const btn = queue.card(0).locator('.grq-btn-approve');
    await btn.focus();
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.className);
    const name = await btn.evaluate((e) => e.innerText.trim());
    record(`Focused "${focused}", accessible text "${name}"`);
    expect(focused).toMatch(/grq-btn-approve/);
    expect(name).toMatch(/Approve All/);
  });
});
