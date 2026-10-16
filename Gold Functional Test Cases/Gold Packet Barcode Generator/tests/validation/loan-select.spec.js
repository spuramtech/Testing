const { test, expect } = require('../../fixtures');

test.describe('Gold Packet Barcode Generator – loan selection validation', () => {
  test('TC_PB_013 - An unknown loan number cannot be selected @regression', async ({ bc, page, record }) => {
    await bc.loan.click();
    await bc.loan.locator('input').fill('GLNG9999999999999');
    await page.waitForTimeout(600);
    const opts = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((t) => t.trim());
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    const val = (await bc.loan.locator('.ng-value').allInnerTexts()).join('');
    record(`Options ${JSON.stringify(opts)}; selected "${val}"`);
    expect(opts.join(' ')).toMatch(/No items found/i);
    expect(val).toBe('');
  });

  test('TC_PB_014 - Special characters in the loan search find nothing and cause no error @regression', async ({ bc, page, record }) => {
    await bc.loan.click();
    await bc.loan.locator('input').fill(`'"<script>%`);
    await page.waitForTimeout(600);
    const opts = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).join(' ');
    const msg = await bc.messages();
    record(`Options "${opts}"; toasts "${msg}"`);
    expect(opts).toMatch(/No items found/i);
    expect(msg).not.toMatch(/error/i);
  });

  test('TC_PB_015 - The clear (x) button removes the selected loan @regression', async ({ bc, record }) => {
    await bc.selectLoan((await bc.loanOptions())[0].split(' - ')[0]);
    await bc.loan.locator('.ng-clear-wrapper').click();
    const val = (await bc.loan.locator('.ng-value').allInnerTexts()).join('');
    record(`After clear: "${val}"`);
    expect(val).toBe('');
  });
});
