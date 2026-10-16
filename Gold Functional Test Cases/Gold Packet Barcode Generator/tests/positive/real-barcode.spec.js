const { test, expect } = require('../../fixtures');

// REAL write – off by default. A printed barcode is permanent: it can only be cancelled, never deleted.
// Turn on with  $env:ALLOW_DATA_CREATION="1"  (uses an AUTOTEST loan from the BH list, then cancels the barcode it made).
const ON = process.env.ALLOW_DATA_CREATION === '1';

test.describe('Gold Packet Barcode Generator – real print and cancel', () => {
  test.describe.configure({ mode: 'serial' });
  let made = null;

  test('TC_PB_060 - Real BH print records a Not Used barcode in the register (ALLOW_DATA_CREATION=1) @regression', async ({ bcReal: bc, page, record }) => {
    test.skip(!ON, 'Creates a permanent barcode – set ALLOW_DATA_CREATION=1');
    const loan = (await bc.loanOptions()).find((o) => /autotest/i.test(o))?.split(' - ')[0];
    test.skip(!loan, 'no AUTOTEST loan in the BH list');
    await bc.selectLoan(loan);
    await bc.generateBtn.click();
    test.skip(/already has an unused/.test(await bc.previewText()), `${loan} already has an unused barcode`);
    await bc.printBtn.click();
    const msg = await bc.messages().then(async (m) => m || (await page.waitForTimeout(2500), bc.messages()));
    const no = (msg.match(/Barcode (BH\d+) recorded/) || [])[1];
    record(`${loan}: ${msg}`);
    expect(no).toBeTruthy();
    await bc.openRegister();
    await bc.search(no);
    const row = (await bc.regRows())[0];
    expect(row).toMatchObject({ barcode: no, loan, status: 'Not Used', type: 'BH' });
    made = row;
  });

  test('TC_PB_061 - Real cancel marks the barcode Cancelled with the reason (ALLOW_DATA_CREATION=1) @regression', async ({ bcReal: bc, page, record }) => {
    test.skip(!ON || !made, 'runs only after TC_PB_060 made a barcode');
    await bc.openRegister();
    await bc.search(made.barcode);
    await page.locator('tr:visible', { hasText: made.barcode }).getByRole('button', { name: /^\s*Cancel\s*$/ }).click();
    const d = bc.cancelDialog();
    await bc.reasonBox(d).fill('autotest clean-up');
    await d.getByRole('button', { name: /Confirm cancellation/ }).click();
    await page.waitForTimeout(2000);
    await page.reload();
    await bc.page.waitForLoadState('networkidle').catch(() => {});
    await bc.search(made.barcode);
    const row = (await bc.regRows())[0];
    record(JSON.stringify(row));
    expect(row.status).toBe('Cancelled');
    expect(row.canCancel).toBe(false);
  });
});
