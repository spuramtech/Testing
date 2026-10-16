const { test, expect, WRITE_API, sim } = require('../../fixtures');

// Internal Appraiser 2 – Verify on a SIMULATED estimate (GE9999999901). Writes are blocked or simulated.
async function openVerify(simulate, q) {
  const est = await simulate('IA2');
  await q.openAction(est.pGenumber, 'Verify');
  return est;
}

test.describe('Gold Estimate Approval Queue – Internal Appraiser 2 verification (simulated estimate)', () => {
  test('TC_EQ_020 - IA2 sees the pending estimate with role "Internal Appraiser 2" and a Verify action @smoke @regression', async ({ q, simulate, record }) => {
    const est = await simulate('IA2');
    const row = (await q.rows()).find((r) => r.ge === est.pGenumber);
    record(JSON.stringify(row));
    expect(row).toMatchObject({ role: 'Internal Appraiser 2', status: 'Awaiting Internal Appraiser 2 verification', action: 'Verify' });
  });

  test('TC_EQ_021 - Verify page shows the maker\'s entry: weights, rate/g, value, eligible loan and articles @regression', async ({ page, q, simulate, record }) => {
    const est = await openVerify(simulate, q);
    const e = est.pAppraisals[0];
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(text.split('Back').pop().slice(0, 500));
    expect(text).toContain('Internal Appraiser Verification');
    expect(text).toContain(`GROSS WEIGHT ${e.pGrossweight} g`);
    expect(text).toContain(`NET WEIGHT ${e.pNetweight} g`);
    expect(text).toContain(`ELIGIBLE LOAN AMOUNT (LTV) ₹ ${e.pEstimatedvalue.toLocaleString('en-IN')}`);
    expect(text).toMatch(/RING 1 10\.5 g 0\.5 g/);
  });

  test('TC_EQ_022 - Revert opens a remarks prompt (required) with Confirm Revert and Cancel @regression', async ({ page, q, simulate, blockWrites, record }) => {
    await openVerify(simulate, q);
    await blockWrites();
    await q.revertBtn.click();
    const box = q.remarksBox();
    await expect(box).toBeVisible();
    const ph = await box.getAttribute('placeholder');
    record(`Placeholder "${ph}"; buttons ${(await page.getByRole('button').allInnerTexts()).map((t) => t.trim()).filter((t) => /Confirm|Cancel/.test(t)).join(', ')}`);
    expect(ph).toBe('Explain why this entry is being sent back');
    await expect(q.promptButton('Confirm Revert')).toBeVisible();
  });

  for (const [id, remarks, label] of [['TC_EQ_023', '', 'empty'], ['TC_EQ_024', '    ', 'whitespace-only']]) {
    test(`${id} - Confirm Revert with ${label} remarks is refused ("A remark is required to revert this entry.") @regression`, async ({ q, simulate, blockWrites, apiHits, record }) => {
      await openVerify(simulate, q);
      await blockWrites();
      await q.revertBtn.click();
      await q.remarksBox().fill(remarks);
      await q.promptButton('Confirm Revert').click();
      const msg = await q.waitMessage();
      const sent = apiHits.filter((h) => WRITE_API.test(h.url));
      record(`Message "${msg}"; write requests ${sent.length}`);
      expect(msg).toMatch(/A remark is required to revert this entry/);
      expect(sent).toHaveLength(0);
    });
  }

  test('TC_EQ_025 - Cancel closes the revert prompt and sends nothing @regression', async ({ q, simulate, blockWrites, apiHits, record }) => {
    await openVerify(simulate, q);
    await blockWrites();
    await q.revertBtn.click();
    await q.remarksBox().fill('cancel me');
    await q.promptButton('^\\W*Cancel').click();
    await expect(q.remarksBox()).toBeHidden();
    record(`Prompt closed; write requests ${apiHits.filter((h) => WRITE_API.test(h.url)).length}`);
    expect(apiHits.filter((h) => WRITE_API.test(h.url))).toHaveLength(0);
  });

  test('TC_EQ_026 - Revert with remarks sends REVERT for this GE by this user and confirms "Sent back to the Internal Appraiser to edit." (simulated) @regression', async ({ q, simulate, mockWrite, uid, record }) => {
    const est = await openVerify(simulate, q);
    const sent = await mockWrite('ApproveInternalAppraisal', true);
    await q.revertBtn.click();
    await q.remarksBox().fill('Gross weight differs from the scale reading');
    await q.promptButton('Confirm Revert').click();
    const msg = await q.waitMessage();
    record(`Sent ${JSON.stringify(sent[0])}; message "${msg}"`);
    expect(sent[0]).toEqual({ pGenumber: est.pGenumber, pInternalAppraiser2UserId: await uid(), pAction: 'REVERT', pRemarks: 'Gross weight differs from the scale reading' });
    expect(msg).toContain('Sent back to the Internal Appraiser to edit.');
  });

  test('TC_EQ_027 - Approve sends APPROVE for this GE and confirms "Entry verified. Routed to the next stage." (simulated) @smoke @regression', async ({ q, simulate, mockWrite, uid, record }) => {
    const est = await openVerify(simulate, q);
    const sent = await mockWrite('ApproveInternalAppraisal', true);
    await q.approveBtn.click();
    const msg = await q.waitMessage();
    record(`Sent ${JSON.stringify(sent[0])}; message "${msg}"`);
    expect(sent[0]).toMatchObject({ pGenumber: est.pGenumber, pInternalAppraiser2UserId: await uid(), pAction: 'APPROVE' });
    expect(msg).toContain('Entry verified. Routed to the next stage.');
  });

  test('TC_EQ_028 - Approve asks for confirmation before verifying (HYPOTHESIS) @regression', async ({ q, simulate, mockWrite, record }) => {
    await openVerify(simulate, q);
    const sent = await mockWrite('ApproveInternalAppraisal', true);
    await q.approveBtn.click();
    await q.page.waitForTimeout(1200);
    record(`Approve request sent immediately: ${sent.length > 0}`);
    expect(sent, 'Approve was sent without any confirmation step').toHaveLength(0);
  });

  test('TC_EQ_029 - Server refusal on Approve is shown to the user (simulated) @regression', async ({ q, simulate, mockWrite, record }) => {
    await openVerify(simulate, q);
    await mockWrite('ApproveInternalAppraisal', 'This entry was already processed by someone else.', { status: 400 });
    await q.approveBtn.click();
    const msg = await q.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/already processed|Could not verify/);
    expect(msg).not.toMatch(/Entry verified/);
  });

  test('TC_EQ_030 - Double-click on Approve sends one request (simulated) @regression', async ({ q, simulate, mockWrite, record }) => {
    await openVerify(simulate, q);
    const sent = await mockWrite('ApproveInternalAppraisal', true);
    await q.approveBtn.dblclick();
    await q.page.waitForTimeout(2000);
    record(`ApproveInternalAppraisal requests: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_EQ_031 - The maker cannot verify their own entry: IA1 does not get the Verify action @regression', async ({ q, loginAs, page, record }) => {
    await loginAs('INT_APPRAISER1');
    const est = sim.buildEstimate({ ge: sim.SIM_IA2_GE, status: 'PENDING_IA_APPROVAL', entries: 1, makerId: 15 });
    await sim.serve(page, est, ['GetGoldEstimateQueue']);
    await q.open();
    const row = (await q.rows()).find((r) => r.ge === est.pGenumber);
    record(`Maker's view of own pending estimate: ${JSON.stringify(row)}`);
    expect(row ? row.action : '').not.toMatch(/Verify/);
  });
});
