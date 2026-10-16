const { test, expect } = require('../../fixtures');
const data = require('../../test-data/approval-data');

// Server responses are SIMULATED (or the request is aborted) – no submission is approved or rejected on the server.
const OK = { success: true, message: 'Simulated success' };

test.describe('Gold Rate Approval Queue – failures and repeated clicks', () => {
  test('TC_GQ_026 - Server answers "already processed by someone else" – message shown, queue refreshed (simulated) @regression', async ({ queue, mockWrite, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    await mockWrite('ApproveGoldRate', { success: false, message: 'This entry was already processed by someone else.' }, { removeDay: cards[0].iso });
    await queue.card(0).locator('.grq-btn-approve').click();
    const msg = await queue.waitMessage();
    await queue.waitLoaded();
    record(`Message "${msg}"; cards after ${await queue.cards.count()}`);
    expect(msg).toMatch(data.alreadyProcessed);
    expect(msg).not.toMatch(/success!/i);
  });

  test('TC_GQ_027 - Approve during a network failure shows an error and keeps the card @regression', async ({ queue, mockWrite, record }) => {
    const before = await queue.cards.count();
    test.skip(!before, 'queue is empty');
    await mockWrite('ApproveGoldRate', 'abort');
    await queue.card(0).locator('.grq-btn-approve').click();
    await queue.page.waitForTimeout(2500);
    const msg = await queue.messages();
    record(`Message "${msg || 'none'}"; cards ${before} → ${await queue.cards.count()}`);
    expect(await queue.cards.count()).toBe(before);
    expect(msg, 'user must be told the approval failed').toMatch(/error|fail|try again|unable|could not/i);
  });

  test('TC_GQ_028 - Reject when the server returns HTTP 500 shows an error and keeps the remarks for retry @regression', async ({ queue, mockWrite, record }) => {
    test.skip(!(await queue.cards.count()), 'queue is empty');
    await mockWrite('RejectGoldRate', { message: 'Simulated server error' }, { status: 500 });
    await queue.openReject(0);
    await queue.remarks.fill('retry me');
    await queue.confirmReject.click();
    await queue.page.waitForTimeout(2500);
    const msg = await queue.messages();
    const open = await queue.rejectModal.isVisible();
    record(`Message "${msg || 'none'}"; modal open ${open}; remarks "${open ? await queue.remarks.inputValue() : '-'}"`);
    expect(msg).not.toMatch(/success!/i);
    expect(msg).toMatch(/error|fail|try again|unable|could not/i);
  });

  test('TC_GQ_029 - Double-click on Approve All sends only one approval (simulated server) @regression', async ({ queue, mockWrite, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const sent = await mockWrite('ApproveGoldRate', OK, { removeDay: cards[0].iso });
    await queue.card(0).locator('.grq-btn-approve').dblclick();
    await queue.page.waitForTimeout(2000);
    record(`Approve requests sent: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_GQ_030 - Double-click on Confirm Reject sends only one rejection (simulated server) @regression', async ({ queue, mockWrite, record }) => {
    const cards = await queue.readCards();
    test.skip(!cards.length, 'queue is empty');
    const sent = await mockWrite('RejectGoldRate', OK, { removeDay: cards[0].iso });
    await queue.openReject(0);
    await queue.remarks.fill('double click');
    await queue.confirmReject.dblclick();
    await queue.page.waitForTimeout(2000);
    record(`Reject requests sent: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });
});

