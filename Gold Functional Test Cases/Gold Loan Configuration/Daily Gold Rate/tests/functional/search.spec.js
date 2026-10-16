const { test, expect } = require('../../fixtures');

test.describe('Daily Gold Rate – search', () => {
  test('TC_GR_009 - Searching an existing Trans Date shows that rate row @regression', async ({ grp, record }) => {
    const [first] = await grp.rows();
    await grp.search.fill(first.date);
    await grp.page.waitForTimeout(1000);
    const rows = await grp.rows();
    record(`Search "${first.date}" → ${rows.length} rows (${rows.map((r) => r.date).join(', ') || 'No records available'})`);
    expect(rows.map((r) => r.date)).toContain(first.date);
  });

  test('TC_GR_063 - Searching an existing 24K rate shows that rate row @regression', async ({ grp, record }) => {
    const [first] = await grp.rows();
    const text = first.r24.toFixed(2);
    await grp.search.fill(text);
    await grp.page.waitForTimeout(1000);
    const rows = await grp.rows();
    record(`Search "${text}" → ${rows.length} rows`);
    expect(rows.map((r) => r.date)).toContain(first.date);
  });

  test('TC_GR_010 - Searching text that matches nothing shows "No records available." @regression', async ({ page, grp, record }) => {
    await grp.search.fill('zzzz-no-such-rate');
    await page.waitForTimeout(1000);
    expect(await grp.rows()).toHaveLength(0);
    await expect(page.getByText('No records available.').first()).toBeVisible();
    record('0 rows, "No records available." shown');
  });

  test('TC_GR_011 - Clearing the search restores the full list @regression', async ({ page, grp, record }) => {
    const before = await grp.totalItems();
    await grp.search.fill('zzzz');
    await page.waitForTimeout(800);
    await grp.search.fill('');
    await page.waitForTimeout(1000);
    const after = await grp.totalItems();
    record(`${before} items before, ${after} after clearing`);
    expect(after).toBe(before);
  });
});
