const { test, expect, WRITE_API } = require('../../fixtures');

// Branch Head / Checker – Review on a SIMULATED estimate "Ready for Approval" (GE9999999902). Writes blocked or simulated.
// The approval opens a print tab; tests close any extra page.
async function openReview(simulate, q, opts) {
  const est = await simulate('CHECKER', opts);
  await q.openAction(est.pGenumber, 'Review');
  return est;
}
const entryRadios = (page) => page.locator('input[name=selectedEntry]');

test.describe('Gold Estimate Approval Queue – Checker final approval (simulated estimate)', () => {
  test('TC_EQ_032 - Branch Head sees the estimate as "Ready for Approval" with a Review action @smoke @regression', async ({ q, simulate, record }) => {
    const est = await simulate('CHECKER');
    const row = (await q.rows()).find((r) => r.ge === est.pGenumber);
    record(JSON.stringify(row));
    expect(row).toMatchObject({ role: 'Branch Head', status: 'Ready for Approval', action: 'Review' });
  });

  test('TC_EQ_033 - Review shows stages completed/required, every appraisal entry, and Approve / Revert @regression', async ({ page, q, simulate, record }) => {
    const est = await openReview(simulate, q);
    const stages = await q.field('APPRAISAL STAGES REQUIRED/COMPLETED');
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(`Stages "${stages}"; entries shown: ${est.pAppraisals.map((e) => `${e.pEstimatedvalue} ${text.includes(e.pEstimatedvalue.toLocaleString('en-IN')) ? '✓' : '✗'}`).join(', ')}`);
    expect(stages.replace(/\s/g, '')).toBe(`${est.pAppraisersrequired}/${est.pAppraisalscompletedcount}`);
    for (const e of est.pAppraisals) expect(text).toContain(e.pEstimatedvalue.toLocaleString('en-IN'));
    await expect(q.approveBtn).toBeEnabled();
    await expect(q.revertBtn).toBeVisible();
  });

  test('TC_EQ_034 - Approve lists every entry with appraisal value / eligible loan and nothing pre-selected when there is a choice @regression', async ({ page, q, simulate, blockWrites, record }) => {
    const est = await openReview(simulate, q, { entries: 2 });
    await blockWrites();
    await q.approveBtn.click();
    await expect(entryRadios(page).first()).toBeVisible();
    const items = (await page.locator('.ge-select-entry-item').allInnerTexts()).map((t) => t.replace(/\s+/g, ' '));
    const checked = await entryRadios(page).evaluateAll((r) => r.filter((x) => x.checked).length);
    record(`${items.join(' || ')}; pre-selected ${checked}`);
    expect(items).toHaveLength(est.pAppraisals.length);
    expect(checked).toBe(0);
  });

  test('TC_EQ_035 - Single entry is pre-selected in the approve prompt @regression', async ({ page, q, simulate, blockWrites, record }) => {
    await openReview(simulate, q, { entries: 1 });
    await blockWrites();
    await q.approveBtn.click();
    await expect(entryRadios(page).first()).toBeVisible();
    const checked = await entryRadios(page).evaluateAll((r) => r.map((x) => x.checked));
    record(`radios ${JSON.stringify(checked)}`);
    expect(checked).toEqual([true]);
  });

  test('TC_EQ_036 - Confirm Approve without choosing an entry is refused ("Select which entry …") @regression', async ({ page, q, simulate, blockWrites, apiHits, record }) => {
    await openReview(simulate, q, { entries: 2 });
    await blockWrites();
    await q.approveBtn.click();
    await q.promptButton('Confirm Approve').click();
    const msg = await q.waitMessage();
    record(`Message "${msg}"; writes ${apiHits.filter((h) => WRITE_API.test(h.url)).length}`);
    expect(msg).toMatch(/Select which entry to approve as the final value/);
    expect(apiHits.filter((h) => WRITE_API.test(h.url))).toHaveLength(0);
    void page;
  });

  test('TC_EQ_037 - Confirm Approve sends the chosen entry id and checker id; "Gold Estimate approved." (simulated) @smoke @regression', async ({ page, context, q, simulate, mockWrite, uid, record }) => {
    const est = await openReview(simulate, q, { entries: 2 });
    const sent = await mockWrite('ApproveGoldEstimate', { pResultuniqueid: null });
    await q.approveBtn.click();
    await entryRadios(page).nth(1).check({ force: true });
    await q.promptButton('Confirm Approve').click();
    const msg = await q.waitMessage();
    for (const p of context.pages()) if (p !== page) await p.close();
    record(`Sent ${JSON.stringify(sent[0])}; message "${msg}"`);
    expect(sent[0]).toEqual({ pGenumber: est.pGenumber, pSelectedEntryId: est.pAppraisals[1].pEntryid, pCheckeruserid: await uid() });
    expect(msg).toContain('Gold Estimate approved.');
  });

  test('TC_EQ_038 - Approval failure is reported and no success shown (simulated) @regression', async ({ page, context, q, simulate, mockWrite, record }) => {
    await openReview(simulate, q, { entries: 1 });
    await mockWrite('ApproveGoldEstimate', 'Simulated failure', { status: 500 });
    await q.approveBtn.click();
    await q.promptButton('Confirm Approve').click();
    const msg = await q.waitMessage();
    for (const p of context.pages()) if (p !== page) await p.close();
    record(`Message "${msg}"`);
    expect(msg).not.toMatch(/Gold Estimate approved/);
    expect(msg).toMatch(/Simulated failure|Could not approve/);
  });

  test('TC_EQ_039 - Double-click on Confirm Approve sends one approval (simulated) @regression', async ({ page, context, q, simulate, mockWrite, record }) => {
    await openReview(simulate, q, { entries: 1 });
    const sent = await mockWrite('ApproveGoldEstimate', { pResultuniqueid: null });
    await q.approveBtn.click();
    await q.promptButton('Confirm Approve').dblclick();
    await page.waitForTimeout(2000);
    for (const p of context.pages()) if (p !== page) await p.close();
    record(`ApproveGoldEstimate requests: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_EQ_040 - Checker Revert warns it voids every entry and needs a remark @regression', async ({ page, q, simulate, blockWrites, apiHits, record }) => {
    await openReview(simulate, q);
    await blockWrites();
    await q.revertBtn.click();
    const note = (await page.locator('.ge-prohibited-note:visible').innerText()).replace(/\s+/g, ' ');
    await q.promptButton('Confirm Revert').click();
    const msg = await q.waitMessage();
    record(`Note "${note}"; message "${msg}"`);
    expect(note).toMatch(/voids every entry .* restarts the whole estimate from Internal Appraisal/);
    expect(msg).toMatch(/A remark is required to revert this Gold Estimate/);
    expect(apiHits.filter((h) => WRITE_API.test(h.url))).toHaveLength(0);
  });

  test('TC_EQ_041 - Checker Revert with remarks sends RevertGoldEstimate and confirms the restart (simulated) @regression', async ({ q, simulate, mockWrite, uid, record }) => {
    const est = await openReview(simulate, q);
    const sent = await mockWrite('RevertGoldEstimate', true);
    await q.revertBtn.click();
    await q.remarksBox().fill('Values differ by more than allowed');
    await q.promptButton('Confirm Revert').click();
    const msg = await q.waitMessage();
    record(`Sent ${JSON.stringify(sent[0])}; message "${msg}"`);
    expect(sent[0]).toEqual({ pGenumber: est.pGenumber, pRemarks: 'Values differ by more than allowed', pCheckeruserid: await uid() });
    expect(msg).toContain('Gold Estimate reverted');
  });

  test('TC_EQ_042 - Branch Head who made the estimate cannot approve it (no Approve / Revert) @regression', async ({ q, simulate, uid, page, record }) => {
    await page.goto('about:blank');
    const est = await simulate('CHECKER', { makerId: 14 });
    const me = await uid();
    test.skip(me !== 14, `checker user id is ${me}, not 14 – simulated maker id does not match`);
    const row = (await q.rows()).find((r) => r.ge === est.pGenumber);
    let buttons = 0;
    if (row) { await q.openAction(est.pGenumber, row.action); buttons = await q.approveBtn.count(); }
    record(`Maker id ${est.pMakerby} = checker id ${me}: ${row ? `row "${row.action}", Approve buttons ${buttons}` : 'own estimate not listed in the Branch Head queue'}`);
    expect(buttons).toBe(0);
  });

  test('TC_EQ_043 - Approve is not offered on an estimate that is already Approved @regression', async ({ checkerQ, record }) => {
    const [first] = (await checkerQ.rows()).filter((r) => r.status === 'Approved');
    await checkerQ.openAction(first.ge, 'View');
    const n = await checkerQ.approveBtn.count();
    record(`${first.ge} (Approved): Approve buttons ${n}`);
    expect(n).toBe(0);
  });
});
