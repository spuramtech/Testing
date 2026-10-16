const { test, expect, WRITE_API } = require('../../fixtures');
const data = require('../../test-data/approval-data');

// All writes are blocked or simulated – no submission is approved or rejected on the server.
test.describe('Gold Rate Approval Queue – Reject modal and remarks', () => {
  test.beforeEach(async ({ queue }) => {
    test.skip(!(await queue.cards.count()), 'queue is empty – no card to reject');
  });

  test('TC_GQ_012 - Reject All opens "Reject Gold Rate" with the day, gold-type count and required remarks @smoke @regression', async ({ queue, blockWrites, record }) => {
    await blockWrites();
    const [c] = await queue.readCards();
    await queue.openReject(0);
    const txt = (await queue.rejectModal.innerText()).replace(/\s+/g, ' ');
    record(txt.slice(0, 300));
    expect(txt).toMatch(/Reject Gold Rate/);
    expect(txt).toContain(`This rejects all ${c.count} gold type(s) submitted for ${c.date}, not just one.`);
    expect(txt).toMatch(/Remarks \(required\)/);
    await expect(queue.remarks).toHaveAttribute('placeholder', 'Reason for rejection');
  });

  for (const [id, value, label] of [['TC_GQ_013', '', 'empty'], ['TC_GQ_014', '     ', 'whitespace only']]) {
    test(`${id} - Confirm Reject with ${label} remarks shows "Remarks are required" and sends nothing @regression`, async ({ queue, apiHits, blockWrites, record }) => {
      await blockWrites();
      await queue.openReject(0);
      await queue.remarks.fill(value);
      await queue.confirmReject.click();
      const msg = await queue.waitMessage();
      const sent = apiHits.filter((h) => WRITE_API.test(h.url));
      record(`Message "${msg}"; reject requests ${sent.length}; modal open ${await queue.rejectModal.isVisible()}`);
      expect(msg).toMatch(data.remarksRequired);
      expect(sent).toHaveLength(0);
      await expect(queue.rejectModal).toBeVisible();
    });
  }

  test('TC_GQ_015 - Cancel closes the modal without rejecting; the card stays @regression', async ({ queue, apiHits, blockWrites, record }) => {
    await blockWrites();
    const before = await queue.cards.count();
    await queue.openReject(0);
    await queue.remarks.fill('cancel me');
    await queue.cancelReject.click();
    await expect(queue.rejectModal).toBeHidden();
    const after = await queue.cards.count();
    record(`Cards ${before} → ${after}; reject requests ${apiHits.filter((h) => WRITE_API.test(h.url)).length}`);
    expect(after).toBe(before);
    expect(apiHits.filter((h) => WRITE_API.test(h.url))).toHaveLength(0);
  });

  test('TC_GQ_016 - Remarks are cleared when the modal is opened again @regression', async ({ queue, blockWrites, record }) => {
    await blockWrites();
    await queue.openReject(0);
    await queue.remarks.fill('old text');
    await queue.closeReject();
    await queue.openReject(0);
    const v = await queue.remarks.inputValue();
    record(`Remarks on reopen: "${v}"`);
    expect(v).toBe('');
  });

  for (const [id, remarks, label] of [['TC_GQ_017', data.longRemarks, '1000-character'], ['TC_GQ_018', data.unicodeRemarks, 'Unicode / special-character']]) {
    test(`${id} - ${label} remarks are sent unchanged (simulated server) @regression`, async ({ queue, mockWrite, record }) => {
      const sent = await mockWrite('RejectGoldRate', { success: false, message: 'Simulated – not saved' });
      await queue.openReject(0);
      await queue.remarks.fill(remarks);
      await queue.confirmReject.click();
      await expect.poll(() => sent.length).toBe(1);
      record(`Sent pRemarks length ${sent[0].pRemarks.length}: "${sent[0].pRemarks.slice(0, 60)}"`);
      expect(sent[0].pRemarks).toBe(remarks);
    });
  }
});
