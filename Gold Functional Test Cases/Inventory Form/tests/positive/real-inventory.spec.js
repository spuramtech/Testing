const { test, expect, PHOTO } = require('../../fixtures');

// REAL write – off by default. Saving uses up the loan's BH barcode and creates a permanent inventory record.
// Turn on with  $env:ALLOW_DATA_CREATION="1"  (only on an AUTOTEST loan that has an unused BH barcode).
const ON = process.env.ALLOW_DATA_CREATION === '1';

test.describe('Inventory Form – real save', () => {
  test.describe.configure({ mode: 'serial' });
  let done = null;

  test('TC_IF_059 - Real save of an AUTOTEST loan creates an inventory and uses the barcode (ALLOW_DATA_CREATION=1) @regression', async ({ invReal: inv, page, record }) => {
    test.skip(!ON, 'Creates a permanent inventory and uses up a barcode – set ALLOW_DATA_CREATION=1');
    const hit = [];
    page.on('request', (r) => { if (/GetApplicantionid/i.test(r.url())) hit.push(r); });
    const offered = (await inv.loanOptions()).filter((o) => /autotest/i.test(o)).map((o) => o.match(/GLNG\d+/)[0]);
    const req = hit[0];
    const apiBase = req.url().split('/api/')[0] + '/api/';
    const reg = await (await page.request.get(apiBase + 'loans/Transactions/goldpacketbarcode/getbarcoderegister?Status=Not%20Used', { headers: req.headers() })).json();
    const ready = reg.find((r) => r.pType === 'New' && offered.includes(r.pLoanid));
    test.skip(!ready, 'no AUTOTEST loan with an unused BH barcode – print one first (Gold Packet Barcode Generator)');
    const cabs = await (await page.request.get(apiBase + 'loans/Masters/InventoryMasters/getcabinetconfiguration', { headers: req.headers() })).json();
    const vaults = await (await page.request.get(apiBase + 'loans/Masters/InventoryMasters/getvaultconfiguration', { headers: req.headers() })).json();
    const c = cabs.find((x) => /AUTOTEST/i.test(vaults.find((v) => v.pVaultid === x.pVaultid)?.pVaultname || '')) || cabs[0];
    await inv.selectLoan(ready.pLoanid);
    await inv.bindBarcode(ready.pBarcodeno);
    const st = await inv.storeIn({ photo: PHOTO, vaultName: vaults.find((v) => v.pVaultid === c.pVaultid).pVaultname, safeNo: c.pCabinetno });
    await inv.add.click();
    await inv.remarks.fill(`autotest functional inventory ${ready.pBarcodeno}`);
    await inv.clearToasts();
    await inv.save.click();
    await page.waitForTimeout(3000);
    const msg = await inv.messages();
    record(`${ready.pLoanid} / ${ready.pBarcodeno} → ${c.pCabinetno} L${st.locker}: "${msg}"`);
    expect(msg).toMatch(/success|saved/i);
    const after = await (await page.request.get(apiBase + `loans/Transactions/goldpacketbarcode/getbarcodedetails?Barcodeno=${ready.pBarcodeno}`, { headers: req.headers() })).json();
    expect(after.pStatus).toBe('Used');
    done = { ...ready, apiBase, headers: req.headers() };
  });

  test('TC_IF_060 - After the real save the loan is no longer offered and its barcode is refused (ALLOW_DATA_CREATION=1) @regression', async ({ invReal: inv, page, record }) => {
    test.skip(!ON || !done, 'runs only after TC_IF_059 saved an inventory');
    const loans = (await inv.loanOptions()).map((o) => o.match(/GLNG\d+/)?.[0]);
    const view = await (await page.request.get(done.apiBase + 'loans/Transactions/getloaninventory', { headers: done.headers })).json();
    record(`${done.pLoanid} offered: ${loans.includes(done.pLoanid)}; in View: ${view.some((v) => v.pLoanid === done.pLoanid)}`);
    expect(loans).not.toContain(done.pLoanid);
    expect(view.some((v) => v.pLoanid === done.pLoanid)).toBe(true);
  });
});
