const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { GoldBarcodePage, BARCODE_FILE } = require('../pages/GoldBarcodePage');

// Admin generates and records Gold Packet Barcodes – one run does BOTH types:
//   TC_GOLDBARCODE_001  Type BH (the app opens with BH already selected – no click): loans approved/disbursed and not yet
//                       packeted; one unused barcode per loan. Saved to test-data/last-barcode.json (→ Inventory Form).
//   TC_GOLDBARCODE_002  Type Audit (clicks the Audit option): loans that already have a packet in inventory; several Audit
//                       barcodes per loan (up to its number of gold articles). Saved to test-data/last-audit-barcode.json (→ Stock Audit).
// Only one type: $env:BARCODE_TYPE="BH" or "Audit" (default: both).  Specific loan: $env:LOAN_NUMBER="GLNG0126100000002"
const ONLY = (process.env.BARCODE_TYPE || 'both').toLowerCase();
const TYPES = ONLY === 'bh' ? ['BH'] : ONLY === 'audit' ? ['Audit'] : ['BH', 'Audit'];
const AUDIT_FILE = path.resolve(__dirname, '../test-data/last-audit-barcode.json');

// workers = 1 (playwright.config.js) → BH runs first, then Audit; each runs even if the other fails/skips

for (const TYPE of TYPES) {
test(`TC_GOLDBARCODE_00${TYPE === 'BH' ? 1 : 2} - Admin generates and records a Gold Packet Barcode (type ${TYPE}) for one loan`, async ({ page }, testInfo) => {
  const bc = new GoldBarcodePage(page);
  await page.addInitScript(() => { window.print = () => {}; }); // never block on the browser print dialog
  let candidates = [];
  let done = null;
  const existingUnused = [];

  await test.step('Login as admin (Checker / BH)', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Packet Barcode Generator', () => bc.open());

  await test.step('Type BH is selected by default', async () => {
    const checked = page.locator('input[type=radio]:checked');
    await expect(checked).toHaveCount(1);
    await expect(checked).not.toHaveValue(/audit/i); // BH radio (value "New") is pre-selected
    await expect(page.getByText(/not yet packeted/i)).toBeVisible();
  });

  await test.step(TYPE === 'Audit' ? 'Click the Audit option, list eligible loans' : 'Type = BH (default), list eligible loans', async () => {
    if (TYPE === 'Audit') await bc.selectType('Audit'); // BH needs no click – it is the default
    await expect(page.locator('input[type=radio]:checked')).toHaveValue(new RegExp(TYPE === 'BH' ? 'New|BH' : 'Audit', 'i'));
    const hint = TYPE === 'BH' ? /not yet packeted/i : /already have a packet in inventory/i;
    await expect(page.getByText(hint)).toBeVisible();
    const options = await bc.loanOptions();
    console.log(`Loans for ${TYPE}:\n` + options.map((o) => '  ' + o).join('\n'));
    // Only the current flow's loan
    const loanNo = process.env.LOAN_NUMBER || flow.need('loanNumber', 'token');
    candidates = options.filter((o) => o.startsWith(loanNo));
    test.skip(!candidates.length, TYPE === 'BH'
      ? `Flow loan ${loanNo} is not waiting for a BH packet barcode (already packeted, or not approved yet)`
      : `Flow loan ${loanNo} has no packet in inventory yet – run: npm run inventory`);
  });

  await test.step('Generate barcode → preview → Print sticker', async () => {
    for (const option of candidates) {
      const [loanNumber, customer] = option.split(' - ').map((s) => s.trim());
      await bc.selectLoan(loanNumber);
      const res = await bc.tryGenerate();
      if (res.existing) {
        console.log(`${loanNumber} already has unused barcode ${res.existing} – left as is`);
        existingUnused.push({ barcode: res.existing, loanNumber, customer });
        continue;
      }
      const msgs = (await bc.messages()).join(' ');
      if (/limit|maximum|cannot|not allowed/i.test(msgs)) {
        console.log(`${loanNumber}: ${msgs} – trying next loan`);
        continue;
      }
      await expect(page.getByText(new RegExp(`TYPE\\s*${TYPE}`, 'i')).first()).toBeVisible();
      const barcode = await bc.printSticker();
      const after = (await bc.messages()).join(' ');
      console.log('Messages:', after);
      if (!barcode) {
        // Audit: limit = number of gold articles on the loan (server returns 409 CONFLICT)
        console.log(`${loanNumber}: barcode not recorded (limit reached) – trying next loan`);
        await page.getByText(/Could not record the barcode/i).first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => {});
        continue;
      }
      expect(barcode).toMatch(TYPE === 'BH' ? /^BH\d{8,}$/ : /^AUD\d{8,}$/); // BH2610000008 / AUD2610000002
      expect(after).toMatch(/recorded/i);
      done = { barcode, loanNumber, customer };
      break;
    }
  });

  await test.step('Save barcode details for the next form', async () => {
    // Nothing new possible: keep the previously recorded Audit barcode, if any
    const previousAudit = TYPE === 'Audit' && fs.existsSync(AUDIT_FILE) ? JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8')) : null;
    const pick = done || existingUnused[0] || (previousAudit && { barcode: previousAudit.barcode, loanNumber: previousAudit.loanNumber, customer: previousAudit.customer });
    test.skip(!pick, 'Every eligible AUTOTEST loan has reached its barcode limit – pack a new loan (npm run token → barcode → inventory)');
    const data = { ...pick, type: TYPE, generatedBy: 'admin', status: 'Not Used', newlyGenerated: !!done };
    if (TYPE === 'BH') GoldBarcodePage.saveHandOff(data);
    else fs.writeFileSync(AUDIT_FILE, JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2));
    flow.update(`barcode-${TYPE}`, TYPE === 'BH' ? { bhBarcode: pick.barcode } : { auditBarcode: pick.barcode });
    console.log(`${done ? 'Generated' : 'Re-using existing unused'} ${TYPE} barcode ${pick.barcode} for ${pick.loanNumber} → saved to ${TYPE === 'BH' ? BARCODE_FILE : AUDIT_FILE}`);
    testInfo.annotations.push({ type: 'barcode', description: `${TYPE}: ${pick.loanNumber} → ${pick.barcode}${done ? '' : ' (existing)'}` });
  });
});
}
