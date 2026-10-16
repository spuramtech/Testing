const { test, expect } = require('../../fixtures');
const data = require('../../test-data/approval-data');

test.describe('Gold Rate Approval Queue – view', () => {
  test('TC_GQ_001 - Checker opens the queue from the Gold Rate Approval card @smoke @regression', async ({ page, queue, record }) => {
    await expect(page).toHaveURL(/open=GoldRateApprovalQueue/);
    await expect(page.getByText('Checker Approval Queue').first()).toBeVisible();
    await expect(queue.search).toBeVisible();
    record(`URL ${page.url()}; heading "Checker Approval Queue", search box shown; ${await queue.cards.count()} cards`);
  });

  test('TC_GQ_002 - "N submissions pending" equals the number of day cards and the days returned by the API @smoke @regression', async ({ queue, apiHits, record }) => {
    await expect.poll(() => !!apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url) && h.text)).toBe(true);
    const list = JSON.parse(apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url) && h.text).text);
    const days = new Set(list.map((r) => String(r.ptransdate).slice(0, 10)));
    const cards = await queue.cards.count();
    const shown = await queue.pendingCountText();
    record(`Header ${shown}; cards ${cards}; API days ${days.size} (${list.length} records)`);
    test.skip(cards === 0, 'queue is empty – nothing to count');
    expect(shown).toBe(cards);
    expect(cards).toBe(days.size);
  });

  test('TC_GQ_003 - Each card shows date, maker, Approve All (n), Reject All and the 7 gold-type rows @regression', async ({ queue, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const bad = cards.filter((c) => !c.iso || !c.maker || c.count !== c.rowCount || data.goldTypes.some((g) => !(g in c.rates)));
    record(cards.map((c) => `${c.date} by ${c.maker}: ${c.approveText}, ${c.rowCount} rows`).join('; '));
    expect(bad).toEqual([]);
  });

  test('TC_GQ_004 - Card rates match the pending records returned by the API @regression', async ({ queue, apiHits, record }) => {
    const list = JSON.parse(apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url) && h.text).text);
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const diffs = [];
    for (const c of cards) {
      for (const r of list.filter((x) => String(x.ptransdate).startsWith(c.iso))) {
        const k = (r.pgoldtype.match(/^(\d+K)/) || [])[1];
        if (Math.abs(c.rates[k] - r.pgoldrate) > 0.011) diffs.push(`${c.date} ${k}: card ${c.rates[k]} API ${r.pgoldrate}`);
        if (r.pCreatedbyname && r.pCreatedbyname !== c.maker) diffs.push(`${c.date}: maker card ${c.maker} API ${r.pCreatedbyname}`);
      }
    }
    record(`${cards.length} cards compared with ${list.length} API records; differences: ${diffs.join('; ') || 'none'}`);
    expect(diffs).toEqual([]);
  });

  test('TC_GQ_005 - Cards are ordered newest submission first (by submission time) @regression', async ({ queue, apiHits, record }) => {
    const list = JSON.parse(apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url) && h.text).text);
    const stamp = {};
    for (const r of list) stamp[String(r.ptransdate).slice(0, 10)] = r.pVersionstamp;
    const order = (await queue.readCards()).map((c) => c.iso);
    const expected = [...order].sort((a, b) => String(stamp[b]).localeCompare(String(stamp[a])));
    record(`Card order ${order.join(', ')}; by submission time ${expected.join(', ')}`);
    expect(order).toEqual(expected);
  });

  test('TC_GQ_006 - Approve All / Reject All carry explanatory tooltips @regression', async ({ queue, record }) => {
    test.skip(!(await queue.cards.count()), 'queue is empty');
    const a = await queue.card(0).locator('.grq-btn-approve').getAttribute('title');
    const r = await queue.card(0).locator('.grq-btn-reject').getAttribute('title');
    record(`Approve "${a}" | Reject "${r}"`);
    expect(a).toBe(data.approveTitle);
    expect(r).toBe(data.rejectTitle);
  });

  test('TC_GQ_007 - Search by maker keeps that maker\'s cards @regression', async ({ queue, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const maker = cards[0].maker;
    await queue.search.fill(maker);
    await queue.page.waitForTimeout(800);
    const after = await queue.readCards();
    record(`Search "${maker}" → ${after.length} cards (expected ${cards.filter((c) => c.maker === maker).length})`);
    expect(after.length).toBe(cards.filter((c) => c.maker === maker).length);
    expect(after.every((c) => c.maker === maker)).toBe(true);
  });

  test('TC_GQ_008 - Search by gold type keeps cards that contain it @regression', async ({ queue, record }) => {
    const before = await queue.cards.count();
    test.skip(!before, 'queue is empty');
    await queue.search.fill('24K');
    await queue.page.waitForTimeout(800);
    const after = await queue.cards.count();
    record(`Search "24K" → ${after} of ${before} cards`);
    expect(after).toBe(before);
  });

  test('TC_GQ_009 - Search with no match shows the empty-state message @regression', async ({ queue, record }) => {
    await queue.search.fill('zzzz-no-such-maker');
    await queue.page.waitForTimeout(800);
    const empty = await queue.emptyStateText();
    record(`Cards ${await queue.cards.count()}; message "${empty}"`);
    expect(await queue.cards.count()).toBe(0);
    expect(empty).toMatch(data.emptyState);
  });

  test('TC_GQ_010 - Clearing the search restores every card @regression', async ({ queue, record }) => {
    const before = await queue.cards.count();
    await queue.search.fill('zzzz');
    await queue.page.waitForTimeout(600);
    await queue.search.fill('');
    await queue.page.waitForTimeout(800);
    const after = await queue.cards.count();
    record(`${before} cards before, ${after} after clearing`);
    expect(after).toBe(before);
  });

  test('TC_GQ_011 - Search is case-insensitive for the maker name @regression', async ({ queue, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const maker = cards[0].maker;
    await queue.search.fill(maker.toUpperCase());
    await queue.page.waitForTimeout(800);
    const n = await queue.cards.count();
    record(`Search "${maker.toUpperCase()}" → ${n} cards`);
    expect(n).toBe(cards.filter((c) => c.maker === maker).length);
  });
});
