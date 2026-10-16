const { test, expect } = require('../../fixtures');

// Barcode scan / Bind To Packet No. The checks are GET requests only; nothing is written.
async function onReadyLoan(inv, live) {
  test.skip(!live.ready, 'no offered loan has an unused BH barcode today');
  await inv.selectLoan(live.ready.pLoanid);
  return live.ready;
}

test.describe('Inventory Form – barcode scan validation', () => {
  test('TC_IF_013 - Unknown BH barcode: "This is not a recognised barcode" @smoke @regression', async ({ inv, live, record }) => {
    await onReadyLoan(inv, live);
    const msg = await inv.scanCode('BH9999999999');
    record(`Message "${msg}"; packet "${await inv.packetNo.inputValue()}"`);
    expect(msg).toMatch(/This is not a recognised barcode. Generate one from the Gold Packet Barcode menu first/);
    await expect(inv.packetNo).toHaveValue('');
  });

  test('TC_IF_014 - Random text is not accepted as a barcode @regression', async ({ inv, live, record }) => {
    await onReadyLoan(inv, live);
    const msg = await inv.scanCode('XYZ123');
    record(`Message "${msg}"; packet "${await inv.packetNo.inputValue()}"`);
    await expect(inv.packetNo).toHaveValue('');
    expect(msg).not.toMatch(/Barcode valid/);
    expect(msg).toMatch(/not a recognised barcode/);
  });

  test('TC_IF_015 - Special characters are not accepted as a barcode @regression', async ({ inv, live, record }) => {
    await onReadyLoan(inv, live);
    const msg = await inv.scanCode(`BH'"<x>%`);
    record(`Message "${msg}"`);
    await expect(inv.packetNo).toHaveValue('');
    expect(msg).not.toMatch(/Barcode valid|error/i);
  });

  test('TC_IF_016 - A barcode generated for another loan is refused @regression', async ({ inv, live, record }) => {
    const ready = await onReadyLoan(inv, live);
    const other = live.register.find((r) => r.pStatus === 'Not Used' && r.pLoanid !== ready.pLoanid);
    test.skip(!other, 'no unused barcode of another loan');
    const msg = await inv.scanCode(other.pBarcodeno);
    record(`${other.pBarcodeno} (loan ${other.pLoanid}) → "${msg}"`);
    expect(msg).toContain(`This barcode was generated for loan ${other.pLoanid} and cannot be used on a different loan.`);
    await expect(inv.packetNo).toHaveValue('');
  });

  test('TC_IF_017 - A cancelled barcode is refused @regression', async ({ inv, live, record }) => {
    await onReadyLoan(inv, live);
    const c = live.register.find((r) => r.pStatus === 'Cancelled');
    test.skip(!c, 'no cancelled barcode');
    const msg = await inv.scanCode(c.pBarcodeno);
    record(`${c.pBarcodeno} → "${msg}"`);
    expect(msg).toMatch(/This barcode is already "Cancelled" and cannot be used again/);
    await expect(inv.packetNo).toHaveValue('');
  });

  test('TC_IF_018 - A used barcode is refused @regression', async ({ inv, live, record }) => {
    await onReadyLoan(inv, live);
    const u = live.register.find((r) => r.pStatus === 'Used' && /^BH\d+$/.test(r.pBarcodeno));
    test.skip(!u, 'no used barcode');
    const msg = await inv.scanCode(u.pBarcodeno);
    record(`${u.pBarcodeno} (loan ${u.pLoanid}) → "${msg}"`);
    expect(msg).toMatch(/Already Exist Packet Number|already|used/i);
    await expect(inv.packetNo).toHaveValue('');
  });

  test('TC_IF_019 - The loan\'s own unused BH barcode is accepted and bound @smoke @regression', async ({ inv, live, record }) => {
    const ready = await onReadyLoan(inv, live);
    const msg = await inv.scanCode(ready.pBarcodeno);
    record(`${ready.pBarcodeno} → "${msg}"; packet "${await inv.packetNo.inputValue()}"`);
    expect(msg).toContain(`Barcode valid - matches loan ${ready.pLoanid}.`);
    await expect(inv.packetNo).toHaveValue(ready.pBarcodeno);
  });

  test('TC_IF_020 - Bind To Packet No with an empty box shows a message @regression', async ({ inv, live, page, record }) => {
    await onReadyLoan(inv, live);
    await inv.clearToasts();
    await inv.scan.fill('');
    await inv.bindBtn.click();
    await page.waitForTimeout(1500);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Enter|Scan|barcode|packet/i);
  });

  test('TC_IF_021 - Bind To Packet No button works like Enter @regression', async ({ inv, live, page, record }) => {
    const ready = await onReadyLoan(inv, live);
    await inv.clearToasts();
    await inv.scan.fill(ready.pBarcodeno);
    await inv.bindBtn.click();
    await page.waitForTimeout(2000);
    record(`Packet "${await inv.packetNo.inputValue()}"; "${await inv.messages()}"`);
    await expect(inv.packetNo).toHaveValue(ready.pBarcodeno);
  });

  test('TC_IF_022 - An audit barcode cannot be used as the packet barcode (HYPOTHESIS) @regression', async ({ inv, live, record }) => {
    const ready = await onReadyLoan(inv, live);
    const aud = live.register.find((r) => r.pType === 'Audit' && r.pStatus === 'Not Used');
    test.skip(!aud, 'no unused audit barcode');
    const msg = await inv.scanCode(aud.pBarcodeno);
    record(`${aud.pBarcodeno} (Audit, loan ${aud.pLoanid}) on ${ready.pLoanid} → "${msg}"`);
    await expect(inv.packetNo).toHaveValue('');
  });
});
