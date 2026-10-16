const { test, expect } = require('../../fixtures');

test.describe('Gold Packet Barcode Generator – usability, accessibility, responsive', () => {
  test('TC_PB_057 - At tablet width (768px) the generator has no page-level horizontal scroll @regression', async ({ bc, page, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    record(`scrollWidth ${sw}`);
    expect(sw).toBeLessThanOrEqual(768);
  });

  test('TC_PB_058 - Type radios and Loan Number have accessible names @regression', async ({ bc, page, record }) => {
    const res = await page.evaluate(() => {
      const named = (e) => !!e && !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label'));
      return {
        radios: [...document.querySelectorAll('input[type=radio][formcontrolname=ptype]')].every(named),
        loan: named(document.querySelector('ng-select[formcontrolname=ploanid] input')),
      };
    });
    record(JSON.stringify(res));
    expect(res).toEqual({ radios: true, loan: true });
  });

  test('TC_PB_059 - Register search box has an accessible name @regression', async ({ register, record }) => {
    const named = await register.regSearch.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`))));
    record(`Search box named: ${named} (placeholder only does not count)`);
    expect(named).toBe(true);
  });
});
