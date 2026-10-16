const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { VaultPage, VAULT_FILE } = require('../pages/VaultPage');

// Creates ONE vault with unique name/code; saved to test-data/last-vault.json for the next form (Safe & Lockers).
function uniqueVault() {
  const tag = Date.now().toString().slice(-5);
  return {
    name: `AUTOTEST Strong Room ${tag}`,
    branch: process.env.VAULT_BRANCH || 'HEAD OFFICE',
    code: `ATV${tag}`, // max 30 chars
  };
}

test('TC_VAULT_001 - Create one Vault (Gold Loan Configuration) as admin', async ({ page }, testInfo) => {
  const vault = new VaultPage(page);
  const data = uniqueVault();
  testInfo.annotations.push({ type: 'test-data', description: `${data.name} / ${data.branch} / ${data.code}` });

  await test.step('Login as admin', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Loan Configuration → Vault', () => vault.open());

  await test.step('Existing vaults', async () => {
    const rows = await vault.rows();
    console.log('Vaults before:\n' + rows.map((r) => `  ${r.name} | ${r.branch} | ${r.code}`).join('\n'));
    expect(rows.map((r) => r.code)).not.toContain(data.code);
  });

  await test.step('New → fill Vault Name / Branch / Code', async () => {
    await vault.openNew();
    await vault.fill(data);
  });

  await test.step('Save', async () => {
    await vault.save.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await vault.messages()).join(' ');
    console.log('Messages after save:', msgs);
    expect(msgs).toMatch(/success|saved/i);
    expect(msgs).not.toMatch(/error|fail|exist|please/i);
  });

  await test.step('Verify the vault appears in the grid', async () => {
    // the grid has several pages – search for the new record first
    await page.keyboard.press('Escape').catch(() => {}); // close the side panel if still open
    await page.waitForTimeout(500);
    const search = page.getByPlaceholder(/Search in all columns/i).locator('visible=true').first();
    await search.fill(data.code).catch(() => {});
    await page.waitForTimeout(1000);
    const row = page.locator('tr', { hasText: data.code });
    await expect(row).toBeVisible();
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    console.log('Grid row:', text);
    expect(text).toContain(data.name);
    expect(text).toContain(data.branch);
    VaultPage.saveHandOff(data);
    console.log(`Vault saved to ${VAULT_FILE}`);
  });
});
