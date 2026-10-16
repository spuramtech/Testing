const { test, expect } = require('../../fixtures');
const env = require('../../../common/config/env');
const data = require('../../test-data/approval-data');
const { DailyGoldRatePage } = require('../../../Gold Loan Configuration/Daily Gold Rate/pages/DailyGoldRatePage');

// REAL approve / reject on the server. Off unless ALLOW_APPROVAL=1, and only for submissions whose date is in
// GQ_TARGET_DATES (default: the two test submissions 2026-06-02 and 2026-07-06 left by the Daily Gold Rate build).
const gate = () => test.skip(!env.allowApproval, 'ALLOW_APPROVAL=1 not set – approving/rejecting changes the live Internal Rate for every user');

async function target(queue) {
  const card = (await queue.readCards()).find((c) => data.realTargets.includes(c.iso));
  test.skip(!card, `no pending submission for GQ_TARGET_DATES ${data.realTargets.join(', ')}`);
  return card;
}

test.describe('Gold Rate Approval Queue – real approve / reject (opt-in)', () => {
  test('TC_GQ_044 - Checker rejects a target submission with remarks; it leaves the queue and Internal Rate shows it is not approved @regression', async ({ page, queue, apiHits, record }) => {
    gate();
    const c = await target(queue);
    await queue.openReject(c.index);
    await queue.remarks.fill(`Automation test data clean-up ${new Date().toISOString().slice(0, 10)}`);
    await queue.confirmReject.click();
    const msg = await queue.waitMessage();
    await queue.waitLoaded();
    const left = (await queue.readCards()).map((x) => x.iso);
    const resp = apiHits.filter((h) => /RejectGoldRate/i.test(h.url)).map((h) => `${h.status} ${String(h.text).slice(0, 100)}`);
    const grp = new DailyGoldRatePage(page);
    await grp.open();
    await grp.tab('Internal Rate');
    await grp.setRange('All');
    const internal = (await grp.internalRows()).find((r) => r.date === c.iso.split('-').reverse().join('/'));
    record(`Rejected ${c.date}: message "${msg}"; API ${resp.join(', ')}; still queued ${left.includes(c.iso)}; Internal Rate status ${internal ? internal.status : 'not listed'}`);
    expect(msg).toMatch(/reject|success/i);
    expect(left).not.toContain(c.iso);
    expect(internal ? internal.status : 'REJECTED').not.toMatch(/APPROVED|PENDING/);
  });

  test('TC_GQ_045 - Checker approves a target submission; it leaves the queue and Internal Rate shows APPROVED @regression', async ({ page, queue, apiHits, record }) => {
    gate();
    test.skip(process.env.GQ_ALLOW_REAL_APPROVE !== '1', 'GQ_ALLOW_REAL_APPROVE=1 not set – a real approval makes this rate live for loans');
    const c = await target(queue);
    await queue.card(c.index).locator('.grq-btn-approve').click();
    const msg = await queue.waitMessage();
    await queue.waitLoaded();
    const left = (await queue.readCards()).map((x) => x.iso);
    const grp = new DailyGoldRatePage(page);
    await grp.open();
    await grp.tab('Internal Rate');
    await grp.setRange('All');
    const internal = (await grp.internalRows()).find((r) => r.date === c.iso.split('-').reverse().join('/'));
    record(`Approved ${c.date}: message "${msg}"; API ${apiHits.filter((h) => /ApproveGoldRate/i.test(h.url)).map((h) => h.status).join(',')}; still queued ${left.includes(c.iso)}; Internal Rate ${internal && internal.status}`);
    expect(msg).toMatch(/approv|success/i);
    expect(left).not.toContain(c.iso);
    expect(internal && internal.status).toMatch(/APPROVED/);
  });
});
