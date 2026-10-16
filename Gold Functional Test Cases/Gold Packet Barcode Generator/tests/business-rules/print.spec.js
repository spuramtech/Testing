const { test, expect } = require('../../fixtures');

// Print sticker = the step that records the barcode. Replies here are SIMULATED (mockWrite); the real server is not written.
const EP = 'goldpacketbarcode/generatebarcode';
const ACTIVE = 'goldpacketbarcode/getactivebarcodeforloan';
const ok = (loan, type = 'New', no = 'BH9999999999') => ({ pRecordid: 999, pBarcodeno: no, pType: type, pLoanid: loan, pStatus: 'Not Used', pEmployeename: 'Finsta Admin', pBranchname: 'HEAD OFFICE', pCreateddate: new Date().toISOString() });
const NONE = { pRecordid: 0, pBarcodeno: null };

// select the first loan and Generate; the "unused barcode" check is answered as "none" so a preview always appears
async function preview(bc, mockWrite, type = 'BH') {
  await mockWrite(ACTIVE, NONE);
  if (type === 'Audit') await bc.selectType('Audit');
  const loan = (await bc.loanOptions())[0].split(' - ')[0];
  await bc.selectLoan(loan);
  await bc.generateBtn.click();
  await expect(bc.printBtn).toBeVisible();
  return loan;
}

async function withUnused(bc, mockWrite) {
  const loan = (await bc.loanOptions())[0].split(' - ')[0];
  await mockWrite(ACTIVE, { ...ok(loan, 'New', 'BH9999999998'), pRecordid: 1 });
  await bc.selectLoan(loan);
  await bc.generateBtn.click();
  await expect(bc.cancelOldBtn).toBeVisible();
  return loan;
}

test.describe('Gold Packet Barcode Generator – Print sticker (simulated server)', () => {
  test('TC_PB_016 - BH print sends type New, loan, employee and branch @smoke @regression', async ({ bc, mockWrite, page, record }) => {
    const loan = await preview(bc, mockWrite);
    const sent = await mockWrite(EP, { pRecordid: 0 });
    await bc.printBtn.click();
    await page.waitForTimeout(1500);
    record(JSON.stringify(sent[0]));
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ pType: 'New', pLoanid: loan, pEmployeename: 'Finsta Admin', pBranchname: 'HEAD OFFICE' });
  });

  test('TC_PB_017 - Audit print sends type Audit @regression', async ({ bc, mockWrite, page, record }) => {
    const loan = await preview(bc, mockWrite, 'Audit');
    const sent = await mockWrite(EP, { pRecordid: 0 });
    await bc.printBtn.click();
    await page.waitForTimeout(1500);
    record(JSON.stringify(sent[0]));
    expect(sent[0]).toMatchObject({ pType: 'Audit', pLoanid: loan });
  });

  test('TC_PB_018 - Successful print shows the recorded barcode number and a "use once" message @regression', async ({ bc, mockWrite, page, record }) => {
    const loan = await preview(bc, mockWrite);
    await mockWrite(EP, ok(loan));
    await bc.printBtn.click();
    await page.waitForTimeout(2000);
    const t = await bc.previewText();
    const msg = await bc.messages();
    record(`${msg} | ${t.slice(0, 120)}`);
    expect(t).toMatch(/Recorded sticker BH9999999999/);
    expect(msg).toMatch(new RegExp(`Barcode BH9999999999 recorded for loan ${loan}. It can only be used once`));
  });

  test('TC_PB_019 - Network failure on print: "nothing was printed", no recorded number @regression', async ({ bc, mockWrite, page, record }) => {
    await preview(bc, mockWrite);
    await mockWrite(EP, 'abort');
    await bc.printBtn.click();
    await page.waitForTimeout(2000);
    const all = `${await bc.messages()} ${await bc.previewText()}`;
    record(all.slice(0, 200));
    expect(all).toMatch(/Could not record the barcode - nothing was printed/);
    expect(all).not.toMatch(/Recorded sticker/);
  });

  test('TC_PB_020 - Server error 500 on print is shown as an error, not success @regression', async ({ bc, mockWrite, page, record }) => {
    await preview(bc, mockWrite);
    await mockWrite(EP, { message: 'Internal error' }, { status: 500 });
    await bc.printBtn.click();
    await page.waitForTimeout(2000);
    const all = `${await bc.messages()} ${await bc.previewText()}`;
    record(all.slice(0, 200));
    expect(all).toMatch(/Could not record|error/i);
    expect(all).not.toMatch(/Success!|Recorded sticker/);
  });

  test('TC_PB_021 - Double-clicking Print sticker records only once @regression', async ({ bc, mockWrite, page, record }) => {
    const loan = await preview(bc, mockWrite);
    const sent = await mockWrite(EP, ok(loan));
    await bc.printBtn.dblclick();
    await page.waitForTimeout(2500);
    record(`Requests sent: ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_PB_022 - A loan with an unused barcode is refused and offers "Cancel old barcode & generate new" @regression', async ({ bc, mockWrite, record }) => {
    await withUnused(bc, mockWrite);
    const t = await bc.previewText();
    record(t.slice(0, 260));
    expect(t).toMatch(/already has an unused barcode/);
    await expect(bc.printBtn).toHaveCount(0);
  });

  test('TC_PB_023 - "Cancel old & generate new" without a reason is refused @regression', async ({ bc, mockWrite, page, record }) => {
    await withUnused(bc, mockWrite);
    const sent = await mockWrite('goldpacketbarcode/cancelbarcode', { pRecordid: 1 });
    const disabled = await bc.cancelOldBtn.isDisabled();
    if (!disabled) await bc.cancelOldBtn.click();
    await page.waitForTimeout(1500);
    record(`Button disabled: ${disabled}; cancel requests ${sent.length}; message "${await bc.messages()}"`);
    expect(sent).toHaveLength(0);
  });

  test('TC_PB_024 - "Cancel old & generate new" sends the old barcode and the reason @regression', async ({ bc, mockWrite, page, record }) => {
    await withUnused(bc, mockWrite);
    const sent = await mockWrite('goldpacketbarcode/cancelbarcode', { pRecordid: 1 });
    await bc.reasonBox().fill('sticker damaged – autotest (simulated)');
    await bc.cancelOldBtn.click();
    await page.waitForTimeout(2000);
    record(JSON.stringify(sent[0]));
    expect(sent).toHaveLength(1);
    expect(sent[0].pBarcodeno).toBe('BH9999999998');
    expect(sent[0].pCancelreason).toMatch(/sticker damaged – autotest/);
  });

  test('TC_PB_025 - A real loan that has an unused BH barcode is refused (live data) @regression', async ({ register: bc, page, record }) => {
    // the register opens first; collect Not Used BH loans, then go back to the generator
    await bc.filterStatus('Not Used');
    const unused = (await bc.regRows()).filter((r) => r.type === 'BH').map((r) => r.loan);
    await bc.open();
    const bhLoans = (await bc.loanOptions()).map((o) => o.split(' - ')[0]);
    const loan = unused.find((l) => bhLoans.includes(l));
    test.skip(!loan, 'no loan in the BH list has an unused BH barcode today');
    await bc.selectLoan(loan);
    await bc.generateBtn.click();
    await page.waitForTimeout(1500);
    const t = await bc.previewText();
    record(`${loan}: ${t.slice(0, 160)}`);
    expect(t).toMatch(/already has an unused barcode/);
    await expect(bc.printBtn).toHaveCount(0);
  });
});
