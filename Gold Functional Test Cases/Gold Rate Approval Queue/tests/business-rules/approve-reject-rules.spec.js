const { test, expect } = require('../../fixtures');
const data = require('../../test-data/approval-data');
const { DailyGoldRatePage } = require('../../../Gold Loan Configuration/Daily Gold Rate/pages/DailyGoldRatePage');

// Server responses are SIMULATED in this file – no submission is approved or rejected on the server.
const OK = { success: true, message: 'Simulated success' };

test.describe('Gold Rate Approval Queue – business rules', () => {
  test('TC_GQ_019 - Approve All sends every gold type of that day, with version stamps and the checker id @smoke @regression', async ({ queue, apiHits, mockWrite, record }) => {
    const [c] = await queue.readCards();
    test.skip(!c, 'queue is empty');
    const list = JSON.parse(apiHits.find((h) => /GetPendingGoldRateApprovals/i.test(h.url) && h.text).text).filter((r) => String(r.ptransdate).startsWith(c.iso));
    const sent = await mockWrite('ApproveGoldRate', OK, { removeDay: c.iso });
    await queue.card(0).locator('.grq-btn-approve').click();
    await expect.poll(() => sent.length).toBe(1);
    const body = sent[0];
    const uid = Number((apiHits.find((h) => /IsGoldRateChecker/i.test(h.url)).url.match(/userid=(\d+)/) || [])[1]);
    record(`${c.date}: ${body.pItems.length} items sent, pApprovedby ${body.pApprovedby} (checker userid ${uid})`);
    expect(body.pItems.map((i) => i.precordid).sort()).toEqual(list.map((r) => r.precordid).sort());
    expect(body.pItems.every((i) => list.find((r) => r.precordid === i.precordid).pVersionstamp === i.pVersionstamp)).toBe(true);
    expect(body.pApprovedby).toBe(uid);
  });

  test('TC_GQ_020 - Reject sends every gold type of that day with the remarks @regression', async ({ queue, mockWrite, record }) => {
    const [c] = await queue.readCards();
    test.skip(!c, 'queue is empty');
    const sent = await mockWrite('RejectGoldRate', OK, { removeDay: c.iso });
    await queue.openReject(0);
    await queue.remarks.fill('Rate does not match the market closing');
    await queue.confirmReject.click();
    await expect.poll(() => sent.length).toBe(1);
    record(`${c.date}: ${sent[0].pItems.length} items, remarks "${sent[0].pRemarks}"`);
    expect(sent[0].pItems).toHaveLength(c.count);
    expect(sent[0].pRemarks).toBe('Rate does not match the market closing');
  });

  test('TC_GQ_021 - Approve All asks for confirmation before approving (HYPOTHESIS: irreversible action) @regression', async ({ queue, mockWrite, record }) => {
    test.skip(!(await queue.cards.count()), 'queue is empty');
    const sent = await mockWrite('ApproveGoldRate', { success: false, message: 'Simulated – not saved' });
    await queue.card(0).locator('.grq-btn-approve').click();
    await queue.page.waitForTimeout(1500);
    const dialog = await queue.page.locator('.modal.show:not(#rejectGoldRateModal), .swal2-popup').filter({ hasText: /approve|confirm/i }).count();
    record(`Confirmation dialog shown: ${dialog > 0}; approve request sent immediately: ${sent.length > 0}`);
    expect(sent, 'Approve was sent without any confirmation').toHaveLength(0);
  });

  test('TC_GQ_022 - After a successful approval the card leaves the queue and the count drops (simulated server) @regression', async ({ queue, mockWrite, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    await mockWrite('ApproveGoldRate', OK, { removeDay: cards[0].iso });
    await queue.card(0).locator('.grq-btn-approve').click();
    const msg = await queue.waitMessage();
    await queue.waitLoaded();
    const after = await queue.readCards();
    record(`Message "${msg}"; cards ${cards.length} → ${after.length}; header ${await queue.pendingCountText()}`);
    expect(msg).toMatch(/success|approv/i);
    expect(after.map((c) => c.iso)).not.toContain(cards[0].iso);
  });

  test('TC_GQ_023 - After a successful rejection the modal closes and the card leaves the queue (simulated server) @regression', async ({ queue, mockWrite, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    await mockWrite('RejectGoldRate', OK, { removeDay: cards[0].iso });
    await queue.openReject(0);
    await queue.remarks.fill('Simulated rejection');
    await queue.confirmReject.click();
    const msg = await queue.waitMessage();
    await queue.waitLoaded();
    const after = await queue.readCards();
    record(`Message "${msg}"; modal open ${await queue.rejectModal.isVisible()}; cards ${cards.length} → ${after.length}`);
    expect(msg).toMatch(/success|reject/i);
    await expect(queue.rejectModal).toBeHidden();
    expect(after.map((c) => c.iso)).not.toContain(cards[0].iso);
  });

  test('TC_GQ_024 - Card rates follow the carat rule (22K–19K = 24K × 91.6 %, 18K = 75 %, 14K = 58.3 %) @regression', async ({ queue, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const bad = [];
    for (const c of cards) for (const [k, r] of Object.entries(data.ratio)) {
      const exp = Math.round(c.rates['24K'] * r * 100) / 100;
      if (Math.abs(c.rates[k] - exp) > 0.011) bad.push(`${c.date} ${k} ${c.rates[k]} ≠ ${exp}`);
    }
    record(`${cards.length} cards; mismatches: ${bad.join('; ') || 'none'}`);
    expect(bad).toEqual([]);
  });

  test('TC_GQ_025 - Each submission\'s 24K equals the Online closing of the previous rate date (Daily Gold Rate) @regression', async ({ page, queue, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const grp = new DailyGoldRatePage(page);
    await grp.open();
    await grp.setRange('All');
    const online = (await grp.allRows()).map((r) => ({ ...r, iso: r.date.split('/').reverse().join('-') })).sort((a, b) => a.iso.localeCompare(b.iso));
    const bad = [];
    const lines = [];
    for (const c of cards) {
      const prev = online.filter((o) => o.iso < c.iso).pop();
      lines.push(`${c.date} 24K ${c.rates['24K']} ← online ${prev ? `${prev.date} ${prev.r24}` : 'none'}`);
      if (!prev || Math.abs(prev.r24 - c.rates['24K']) > 0.011) bad.push(c.date);
    }
    record(lines.join('; '));
    expect(bad).toEqual([]);
  });
});
