const { test, expect, PHOTO } = require('../../fixtures');
const fs = require('fs');

// Add packet → Save. Photo upload and save replies are SIMULATED; the real server is not written.
const SAVE = 'loans/Transactions/saveloaninventory';

async function bound(inv, live) {
  test.skip(!live.ready, 'no offered loan has an unused BH barcode today');
  await inv.selectLoan(live.ready.pLoanid);
  await inv.bindBarcode(live.ready.pBarcodeno);
  return live.ready;
}

// a vault that has a safe with a free locker (from the app's own lists)
async function storage(live) {
  const cabs = await live.get('loans/Masters/InventoryMasters/getcabinetconfiguration');
  const vaults = await live.get('loans/Masters/InventoryMasters/getvaultconfiguration');
  for (const c of cabs) {
    const free = await live.get(`loans/Masters/InventoryMasters/getavailablelockerdetails?cabinetid=${c.pCabinetid}`);
    const v = vaults.find((x) => x.pVaultid === c.pVaultid && x.pStatusid === 1);
    if (v && free.length) return { vaultName: v.pVaultname, vaultCode: v.pVaultcode, safeNo: c.pCabinetno, locker: String(free[0].plockerno), cabinetId: c.pCabinetid, vaultId: v.pVaultid };
  }
  return null;
}

async function added(inv, live, page) {
  const ready = await bound(inv, live);
  const st = await storage(live);
  test.skip(!st, 'no safe with a free locker');
  await inv.photo.setInputFiles(PHOTO);
  await page.waitForTimeout(1500);
  await inv.storeIn({ photo: null, vaultName: st.vaultName, safeNo: st.safeNo, lockerNo: st.locker });
  await inv.clearToasts();
  await inv.add.click();
  await expect(inv.collateralRows().filter({ hasText: ready.pBarcodeno }).first()).toBeVisible();
  return { ready, st };
}

test.describe('Inventory Form – Add packet (simulated photo upload)', () => {
  test('TC_IF_023 - Add without a photo: "Capture the packet photo with the barcode before adding" @smoke @regression', async ({ inv, live, fakeUpload, page, record }) => {
    await bound(inv, live);
    const st = await storage(live);
    await inv.storeIn({ photo: null, vaultName: st.vaultName, safeNo: st.safeNo, lockerNo: st.locker });
    await inv.clearToasts();
    await inv.add.click();
    await page.waitForTimeout(1200);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Capture the packet photo with the barcode before adding/);
    await expect(inv.save).toHaveCount(0);
  });

  test('TC_IF_024 - Add without a vault: "Enter Vault Name" @regression', async ({ inv, live, fakeUpload, page, record }) => {
    await bound(inv, live);
    await inv.photo.setInputFiles(PHOTO);
    await page.waitForTimeout(1500);
    await inv.clearToasts();
    await inv.add.click();
    await page.waitForTimeout(1200);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Enter Vault Name/);
    await expect(inv.save).toHaveCount(0);
  });

  test('TC_IF_025 - Add without a safe is refused @regression', async ({ inv, live, fakeUpload, page, record }) => {
    await bound(inv, live);
    const st = await storage(live);
    await inv.photo.setInputFiles(PHOTO);
    await page.waitForTimeout(1500);
    await inv.chooseVault(st.vaultName);
    await inv.clearToasts();
    await inv.add.click();
    await page.waitForTimeout(1200);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Safe|Cabinet/i);
    await expect(inv.save).toHaveCount(0);
  });

  test('TC_IF_026 - Add without a locker is refused @regression', async ({ inv, live, fakeUpload, page, record }) => {
    await bound(inv, live);
    const st = await storage(live);
    await inv.photo.setInputFiles(PHOTO);
    await page.waitForTimeout(1500);
    await inv.chooseVault(st.vaultName);
    await inv.safe.selectOption({ label: st.safeNo });
    await page.waitForTimeout(1000);
    await inv.clearToasts();
    await inv.add.click();
    await page.waitForTimeout(1200);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Locker/i);
    await expect(inv.save).toHaveCount(0);
  });

  test('TC_IF_027 - Add without a barcode: "Enter Packet Number" @regression', async ({ inv, live, fakeUpload, page, record }) => {
    test.skip(!live.ready, 'no ready loan');
    await inv.selectLoan(live.ready.pLoanid);
    await inv.clearToasts();
    await inv.add.click();
    await page.waitForTimeout(1200);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Enter Packet Number/);
  });

  test('TC_IF_028 - A typed (not scanned) packet number cannot be added (HYPOTHESIS) @regression', async ({ inv, live, fakeUpload, page, record }) => {
    test.skip(!live.ready, 'no ready loan');
    await inv.selectLoan(live.ready.pLoanid);
    const st = await storage(live);
    await inv.packetNo.fill('MANUAL123');
    await inv.photo.setInputFiles(PHOTO);
    await page.waitForTimeout(1500);
    await inv.storeIn({ photo: null, vaultName: st.vaultName, safeNo: st.safeNo, lockerNo: st.locker });
    await inv.clearToasts();
    await inv.add.click();
    await page.waitForTimeout(1500);
    const rows = await inv.collateral();
    record(`Rows ${rows.join(' || ')}; message "${await inv.messages()}"`);
    expect(rows.join(' ')).not.toContain('MANUAL123');
  });

  test('TC_IF_029 - Photo upload failure: "Could not upload the packet photo" @regression', async ({ inv, live, page, record }) => {
    await bound(inv, live);
    // fixture already blocks writes, so the upload fails
    await inv.photo.setInputFiles(PHOTO);
    await page.waitForTimeout(2000);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Could not upload the packet photo/);
  });

  test('TC_IF_030 - Only PNG / JPEG photos are accepted @regression', async ({ inv, live, fakeUpload, page, record }, testInfo) => {
    await bound(inv, live);
    const accept = await inv.photo.getAttribute('accept');
    const txt = testInfo.outputPath('not-a-photo.txt');
    fs.writeFileSync(txt, 'not an image');
    const sent = [];
    page.on('request', (r) => { if (/MultiFileUploads/i.test(r.url())) sent.push(r.url()); });
    await inv.photo.setInputFiles(txt);
    await page.waitForTimeout(2000);
    record(`accept="${accept}"; .txt upload requests ${sent.length}; message "${await inv.messages()}"`);
    expect(accept).toBe('image/png,image/jpeg');
    expect(sent).toHaveLength(0);
  });

  test('TC_IF_031 - Add binds the packet number to the collateral and shows Save and Clear @smoke @regression', async ({ inv, live, fakeUpload, page, record }) => {
    const { ready } = await added(inv, live, page);
    const rows = await inv.collateral();
    record(rows.join(' || '));
    expect(rows.every((r) => r.includes(ready.pBarcodeno))).toBe(true);
    await expect(inv.save).toBeVisible();
    await expect(inv.clear).toBeVisible();
  });
});

test.describe('Inventory Form – Save (simulated server)', () => {
  test('TC_IF_032 - Save sends loan, contact, date, remarks and each article\'s packet, vault, safe, locker and photo @smoke @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    const { ready, st } = await added(inv, live, page);
    const sent = await mockApi(SAVE, true);
    await inv.remarks.fill('autotest inventory (simulated)');
    await inv.save.click();
    await page.waitForTimeout(2500);
    const b = sent[0] || {};
    record(JSON.stringify({ ...b, inventorydetails: (b.inventorydetails || []).map((d) => ({ packet: d.pPacketno, vault: d.pVaultid, safe: d.pCabinetid, locker: d.pLockerno, photo: d.pArticlefilepath })) }).slice(0, 600));
    expect(sent).toHaveLength(1);
    expect(b).toMatchObject({ pLoanid: ready.pLoanid, pTypeofoperation: 'CREATE', pRemarks: 'autotest inventory (simulated)' });
    expect(b.inventorydetails.length).toBeGreaterThan(0);
    for (const d of b.inventorydetails) {
      expect(d).toMatchObject({ pPacketno: ready.pBarcodeno, pVaultid: st.vaultId, pCabinetid: st.cabinetId, pLockerno: st.locker, pVaultloancode: st.vaultCode });
      expect(d.pArticlefilepath).toMatch(/\.png$/);
    }
  });

  test('TC_IF_033 - Save weights equal the collateral shown @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    await added(inv, live, page);
    const shown = (await inv.collateral()).map((r) => r.split(' ').slice(-3, -1).map(Number));
    const sent = await mockApi(SAVE, true);
    await inv.remarks.fill('autotest inventory (simulated)');
    await inv.save.click();
    await page.waitForTimeout(2500);
    const got = sent[0].inventorydetails.map((d) => [d.pGrossweight, d.pPureNetWeight]);
    record(`Shown ${JSON.stringify(shown)}; sent ${JSON.stringify(got)}`);
    expect(got).toEqual(shown);
  });

  test('TC_IF_034 - Save without Remarks shows a message (HYPOTHESIS) @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    await added(inv, live, page);
    const sent = await mockApi(SAVE, true);
    await inv.clearToasts();
    await inv.save.click();
    await page.waitForTimeout(2500);
    const msg = await inv.messages();
    record(`Requests ${sent.length}; message "${msg}"`);
    expect(sent).toHaveLength(0);
    expect(msg).toMatch(/Remarks|Enter|required/i);
  });

  test('TC_IF_035 - Remarks is limited to 300 characters @regression', async ({ inv, record }) => {
    await inv.remarks.fill('');
    await inv.remarks.pressSequentially('R'.repeat(320), { delay: 0 });
    const v = await inv.remarks.inputValue();
    record(`maxlength ${await inv.remarks.getAttribute('maxlength')}; typed 320 → ${v.length}`);
    expect(v.length).toBe(300);
  });

  test('TC_IF_036 - Simulated successful save shows success @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    await added(inv, live, page);
    await mockApi(SAVE, true);
    await inv.remarks.fill('autotest inventory (simulated)');
    await inv.clearToasts();
    await inv.save.click();
    await page.waitForTimeout(2500);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/success|saved/i);
    expect(msg).not.toMatch(/error|fail/i);
  });

  test('TC_IF_037 - Save network failure does not show success @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    await added(inv, live, page);
    await mockApi(SAVE, 'abort');
    await inv.remarks.fill('autotest inventory (simulated)');
    await inv.clearToasts();
    await inv.save.click();
    await page.waitForTimeout(2500);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).not.toMatch(/success|saved/i);
    expect(msg).toMatch(/error|could not|fail/i);
  });

  test('TC_IF_038 - Save server error 500 is shown as an error, not success @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    await added(inv, live, page);
    await mockApi(SAVE, { message: 'Internal error' }, { status: 500 });
    await inv.remarks.fill('autotest inventory (simulated)');
    await inv.clearToasts();
    await inv.save.click();
    await page.waitForTimeout(2500);
    const msg = await inv.messages();
    record(`Message "${msg}"`);
    expect(msg).not.toMatch(/success|saved/i);
  });

  test('TC_IF_039 - Double-clicking Save sends only one request @regression', async ({ inv, live, fakeUpload, mockApi, page, record }) => {
    await added(inv, live, page);
    const sent = await mockApi(SAVE, true);
    await inv.remarks.fill('autotest inventory (simulated)');
    await inv.save.dblclick();
    await page.waitForTimeout(3000);
    record(`Requests ${sent.length}`);
    expect(sent).toHaveLength(1);
  });

  test('TC_IF_040 - Clear resets the packet, storage and remarks @regression', async ({ inv, live, fakeUpload, page, record }) => {
    await added(inv, live, page);
    await inv.remarks.fill('to be cleared');
    await inv.clear.click();
    await page.waitForTimeout(1500);
    const state = { packet: await inv.packetNo.inputValue().catch(() => ''), remarks: await inv.remarks.inputValue().catch(() => ''), vaultCode: await inv.vaultCode.inputValue().catch(() => ''), rowsWithPacket: (await inv.collateral()).filter((r) => r.includes(live.ready.pBarcodeno)).length };
    record(JSON.stringify(state));
    expect(state).toEqual({ packet: '', remarks: '', vaultCode: '', rowsWithPacket: 0 });
  });
});

