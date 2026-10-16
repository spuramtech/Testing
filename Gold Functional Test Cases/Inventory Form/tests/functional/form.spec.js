const { test, expect } = require('../../fixtures');
const { today } = require('../../../common/utils/dates');

// Inventory Form as Branch Head. Every write is blocked.
const json = (hits, re) => JSON.parse(hits.filter((h) => re.test(h.url) && h.text).pop()?.text || '[]');

test.describe('Inventory Form – form, loan and storage lists', () => {
  test('TC_IF_001 - Form shows Trans Date, Loan Type, Loan, Collateral, Barcode, Photo, Vault, Safe, Locker and Remarks @smoke @regression', async ({ inv, page, record }) => {
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(text.split('Finsta Admin').pop().slice(0, 300));
    for (const t of ['Trans Date', 'Loan Type', 'Loan Application / Account No.', 'Collateral Details', 'Barcode/Packet No', 'Packet Photo (with barcode)', 'Vault/Strong Room', 'Vault Code', 'Safe Number', 'Locker Number', 'Remarks']) expect(text).toContain(t);
    await expect(inv.add).toBeVisible();
  });

  test('TC_IF_002 - Trans Date is today and read-only @regression', async ({ inv, record }) => {
    const v = await inv.transDate.inputValue();
    const ro = await inv.transDate.evaluate((e) => e.readOnly || e.disabled);
    record(`"${v}", read-only ${ro}`);
    expect(v).toBe(today());
    expect(ro).toBe(true);
  });

  test('TC_IF_003 - Loan Type offers Gold Loan @regression', async ({ inv, record }) => {
    const opts = await inv.optionTexts(inv.loanType);
    record(opts.join(', '));
    expect(opts).toEqual(['Gold Loan']);
  });

  test('TC_IF_004 - Loan list = API list of loans waiting for inventory @smoke @regression', async ({ inv, apiHits, record }) => {
    const ui = (await inv.loanOptions()).map((o) => o.match(/GLNG\d+/)[0]).sort();
    const api = json(apiHits, /GetApplicantionid.*INVENTORY/i).map((l) => l.pVchapplicationid).sort();
    record(`UI ${ui.length}, API ${api.length}: ${ui.join(', ')}`);
    expect(api.length).toBeGreaterThan(0);
    expect(ui).toEqual(api);
  });

  test('TC_IF_005 - Loans already in inventory are not offered again @regression', async ({ inv, live, record }) => {
    const view = await live.get('loans/Transactions/getloaninventory');
    const done = new Set(view.map((v) => v.pLoanid));
    const both = live.loans.filter((l) => done.has(l));
    record(`${live.loans.length} offered, ${done.size} loans in inventory; offered again: ${both.join(', ') || 'none'}`);
    expect(both).toEqual([]);
  });

  test('TC_IF_006 - Selecting a loan shows its customer, mobile and loan number from the API @regression', async ({ inv, live, apiHits, record }) => {
    const loan = live.ready?.pLoanid || live.loans[0];
    await inv.selectLoan(loan);
    const info = await inv.customerInfo();
    const api = json(apiHits, /GetGLDetailsById/i)[0];
    record(`${JSON.stringify(info)} | API ${api.ptitlename} ${api.pApplicantName} ${api.psurname}, ${api.pbusinessentitycontactno}`);
    expect(info.loan).toBe(loan);
    expect(info.customer).toContain(`${api.pApplicantName} ${api.psurname}`);
    expect(info.mobile).toBe(String(api.pbusinessentitycontactno));
  });

  test('TC_IF_007 - Collateral rows show each article with gross and pure net weight, no packet yet @regression', async ({ inv, live, record }) => {
    await inv.selectLoan(live.ready?.pLoanid || live.loans[0]);
    const rows = await inv.collateral();
    record(rows.join(' || '));
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r).toMatch(/^[A-Za-z][\w ()/-]* \d+(\.\d+)? \d+(\.\d+)? -$/);
  });

  test('TC_IF_008 - Save and Clear are not offered before a packet is added @regression', async ({ inv, live, record }) => {
    await inv.selectLoan(live.loans[0]);
    const n = { save: await inv.save.count(), clear: await inv.clear.count() };
    record(JSON.stringify(n));
    expect(n).toEqual({ save: 0, clear: 0 });
  });

  test('TC_IF_009 - Vault list = active vaults from the API @regression', async ({ inv, apiHits, page, record }) => {
    await inv.vault.click();
    await page.waitForTimeout(800);
    const ui = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => t.trim()).sort();
    await page.keyboard.press('Escape');
    const api = json(apiHits, /getvaultconfiguration/i).filter((v) => v.pStatusid === 1).map((v) => v.pVaultname).sort();
    record(`UI ${ui.length}, API active ${api.length}`);
    expect(ui).toEqual(api);
  });

  test('TC_IF_010 - Choosing a vault fills its Vault Code and lists only its safes @regression', async ({ inv, live, record }) => {
    const vaults = await live.get('loans/Masters/InventoryMasters/getvaultconfiguration');
    const cabs = await live.get('loans/Masters/InventoryMasters/getcabinetconfiguration');
    const v = vaults.find((x) => cabs.some((c) => c.pVaultid === x.pVaultid)) || vaults[0];
    await inv.chooseVault(v.pVaultname);
    const code = await inv.vaultCode.inputValue();
    const safes = (await inv.optionTexts(inv.safe)).sort();
    const exp = cabs.filter((c) => c.pVaultid === v.pVaultid).map((c) => c.pCabinetno).sort();
    record(`${v.pVaultname}: code ${code}, safes ${safes.join(', ')} (API ${exp.join(', ')})`);
    expect(code).toBe(v.pVaultcode);
    expect(safes).toEqual(exp);
  });

  test('TC_IF_011 - Vault Code is read-only and Safe has no options before a vault is chosen @regression', async ({ inv, record }) => {
    const ro = await inv.vaultCode.evaluate((e) => e.readOnly || e.disabled);
    const safes = await inv.optionTexts(inv.safe);
    record(`Vault Code read-only ${ro}; safes ${JSON.stringify(safes)}`);
    expect(ro).toBe(true);
    expect(safes).toEqual([]);
  });

  test('TC_IF_012 - Locker list = free lockers of the chosen safe from the API @regression', async ({ inv, live, apiHits, page, record }) => {
    const cabs = await live.get('loans/Masters/InventoryMasters/getcabinetconfiguration');
    const vaults = await live.get('loans/Masters/InventoryMasters/getvaultconfiguration');
    const c = cabs.find((x) => vaults.some((v) => v.pVaultid === x.pVaultid && v.pStatusid === 1));
    await inv.chooseVault(vaults.find((v) => v.pVaultid === c.pVaultid).pVaultname);
    await inv.safe.selectOption({ label: c.pCabinetno });
    await page.waitForTimeout(1500);
    const ui = await inv.optionTexts(inv.locker);
    const api = (await live.get(`loans/Masters/InventoryMasters/getavailablelockerdetails?cabinetid=${c.pCabinetid}`)).map((l) => String(l.plockerno));
    record(`Safe ${c.pCabinetno} (lockers ${c.pLockerstartno}–${c.pLockerendno}): UI ${ui.join(',')} | API ${api.join(',')}`);
    expect(ui).toEqual(api);
    for (const l of ui) expect(Number(l)).toBeGreaterThanOrEqual(c.pLockerstartno), expect(Number(l)).toBeLessThanOrEqual(c.pLockerendno);
  });
});
