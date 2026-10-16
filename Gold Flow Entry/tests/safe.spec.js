const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { SafePage, SAFE_FILE } = require('../pages/SafePage');
const { VaultPage } = require('../pages/VaultPage');

// Creates ONE safe (with lockers) inside the vault created by `npm run vault` (test-data/last-vault.json).
// Override vault: $env:SAFE_VAULT="HO Strong Room 1"
test('TC_SAFE_001 - Create one Safe with lockers (Safe & Lockers) as admin', async ({ page }, testInfo) => {
  const safe = new SafePage(page);
  const tag = Date.now().toString().slice(-4);
  const data = { safeNo: `S${tag}`, lockerStart: 1, noOfLockers: 10 };
  let vaultName;

  await test.step('Login as admin', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Loan Configuration → Safe & Lockers', () => safe.open());

  await test.step('New → choose vault', async () => {
    console.log('Safes before:\n' + (await safe.rows()).map((r) => `  ${r.vaultName} | ${r.code} | safe ${r.safeNo} | ${r.lockers} lockers`).join('\n'));
    await safe.openNew();
    const options = await safe.vaultOptions();
    console.log('Vault options:', options.join(' | '));
    const handOff = VaultPage.readHandOff();
    vaultName = process.env.SAFE_VAULT || (handOff && options.find((o) => o.includes(handOff.name)) ? handOff.name : options.filter((o) => /autotest/i.test(o)).pop() || options[0]);
    await safe.selectVault(vaultName);
    await expect(safe.vaultCode).not.toHaveValue('');
    console.log(`Vault: ${vaultName} | branch ${await safe.vaultBranch.inputValue()} | code ${await safe.vaultCode.inputValue()}`);
  });

  await test.step('Enter Safe Number, Locker Start Number, Number of Lockers', async () => {
    await safe.fill(data);
    testInfo.annotations.push({ type: 'test-data', description: `${vaultName} → safe ${data.safeNo}, lockers ${data.lockerStart}..${data.lockerStart + data.noOfLockers - 1}` });
  });

  await test.step('Save', async () => {
    await safe.save.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await safe.messages()).join(' ');
    console.log('Messages after save:', msgs);
    expect(msgs).toMatch(/success|saved/i);
    expect(msgs).not.toMatch(/error|fail|exist|please/i);
  });

  await test.step('Verify the safe appears in the grid', async () => {
    // the grid has several pages – search for the new record first
    await page.keyboard.press('Escape').catch(() => {}); // close the side panel if still open
    await page.waitForTimeout(500);
    const search = page.getByPlaceholder(/Search in all columns/i).locator('visible=true').first();
    await search.fill(data.safeNo).catch(() => {});
    await page.waitForTimeout(1000);
    const row = page.locator('tr', { hasText: data.safeNo });
    await expect(row).toBeVisible();
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    console.log('Grid row:', text);
    expect(text).toContain(vaultName);
    expect(text).toContain(String(data.noOfLockers));
    SafePage.saveHandOff({ vaultName, ...data });
    console.log(`Safe saved to ${SAFE_FILE}`);
  });
});
