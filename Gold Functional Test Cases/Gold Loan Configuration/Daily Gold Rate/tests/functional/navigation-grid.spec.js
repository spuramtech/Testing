const { test, expect } = require('../../fixtures');
const data = require('../../test-data/gold-rate-data');
const { parse, fmt } = require('../../pages/DailyGoldRatePage');

const daysAgo = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d; };

test.describe('Daily Gold Rate – navigation and Online Rate grid', () => {
  test('TC_GR_001 - Daily Gold Rate opens from Loans → Gold → Gold Loan Configuration with Online Rate tab @smoke @regression', async ({ page, grp, record }) => {
    await expect(page).toHaveURL(/open=GoldRateConfiguration/);
    await expect(page.getByText('Daily Gold Rate', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Online Rate', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Internal Rate', { exact: true }).first()).toBeVisible();
    await expect(grp.newBtn).toBeVisible();
    record(`URL ${page.url()} – heading, Online/Internal tabs and New button visible`);
  });

  test('TC_GR_002 - Online grid shows Trans Date, 24K, 22K, 18K columns, Average Rate footer and pager @smoke @regression', async ({ page, grp, record }) => {
    const headers = (await page.locator('th:visible').allInnerTexts()).map((h) => h.replace(/\s+/g, ' ').trim());
    for (const h of ['Trans Date', '24K (99.9% pure gold)', '22K (91.6% gold and 8.4% alloyed metals)', '18K (75% gold and 25% alloyed metals)']) expect(headers).toContain(h);
    await expect(page.locator('tr:visible', { hasText: 'Average Rate' })).toBeVisible();
    const info = await grp.pagerInfo.innerText();
    expect(info).toMatch(/\d+ - \d+ of \d+ items/);
    record(`Headers: ${headers.filter(Boolean).join(' | ')}; pager "${info}"`);
  });

  test('TC_GR_003 - Date Range filter offers the expected options and defaults to Last 30 Days @regression', async ({ grp, record }) => {
    await expect(grp.dateRange).toContainText('Last 30 Days');
    const opts = await grp.rangeOptions();
    expect(opts).toEqual(data.rangeOptions);
    record(`Default "Last 30 Days"; options: ${opts.join(', ')}`);
  });

  test('TC_GR_004 - Last 30 Days shows only rates dated within the last 30 days @regression', async ({ grp, record }) => {
    const rows = await grp.allRows();
    expect(rows.length).toBeGreaterThan(0);
    const oldest = rows.map((r) => parse(r.date)).sort((a, b) => a - b)[0];
    record(`${rows.length} rows, oldest ${fmt(oldest)}`);
    expect(oldest >= daysAgo(31), `oldest row ${fmt(oldest)} is older than 30 days`).toBeTruthy();
  });

  test('TC_GR_005 - All range lists at least as many rows as Last 30 Days; Today lists only today @regression', async ({ grp, record }) => {
    const last30 = await grp.totalItems();
    await grp.setRange('All');
    const all = await grp.totalItems();
    await grp.setRange('Today');
    const today = await grp.rows();
    record(`Last 30 Days ${last30} items, All ${all} items, Today ${today.length} rows`);
    expect(all).toBeGreaterThanOrEqual(last30);
    for (const r of today) expect(r.date).toBe(fmt(new Date()));
  });

  test('TC_GR_006 - Grid lists rates newest first (HYPOTHESIS: default sort Trans Date descending) @regression', async ({ grp, record }) => {
    const dates = (await grp.rows()).map((r) => parse(r.date).getTime());
    record(`${dates.length} rows checked for descending date order`);
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  test('TC_GR_007 - Average Rate footer equals the mean of the listed 24K / 22K / 18K rates @regression', async ({ grp, record }) => {
    const rows = await grp.allRows();
    const avg = (k) => Math.round((rows.reduce((s, r) => s + r[k], 0) / rows.length) * 100) / 100;
    const expected = [avg('r24'), avg('r22'), avg('r18')];
    const footer = await grp.footerAverages();
    record(`Footer ${footer.join(' / ')} vs calculated ${expected.join(' / ')} over ${rows.length} rows`);
    footer.forEach((f, i) => expect(f).toBeCloseTo(expected[i], 1));
  });

  test('TC_GR_008 - Pager moves to the next page in the All range and shows different rows @regression', async ({ page, grp, record }) => {
    await grp.setRange('All');
    const total = await grp.totalItems();
    const first = await grp.rows();
    test.skip(total <= first.length, `only ${total} rows – a single page`);
    const info1 = await grp.pagerInfo.innerText();
    await page.locator('.k-pager-nav[title*="next" i]:visible').first().click();
    await page.waitForTimeout(500);
    const info2 = await grp.pagerInfo.innerText();
    const second = await grp.rows();
    record(`"${info1}" → "${info2}"`);
    expect(info2).not.toBe(info1);
    expect(second[0].date).not.toBe(first[0].date);
  });

  test('TC_GR_012 - Excel and PDF export icons download the grid @regression', async ({ page, grp, record }) => {
    const results = [];
    for (const [title, ext] of [['excel', /\.(xlsx|xls|csv)$/i], ['pdf', /\.pdf$/i]]) {
      const icon = page.locator(`img[title="${title}"]`).locator('visible=true').first();
      await expect(icon, `${title} icon`).toBeVisible();
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20_000 }), icon.click()]);
      const name = dl.suggestedFilename();
      await dl.saveAs(test.info().outputPath(name));
      await test.info().attach(name, { path: test.info().outputPath(name) });
      results.push(name);
      expect(name).toMatch(ext);
    }
    record(`Downloaded ${results.join(', ')}`);
  });
});
