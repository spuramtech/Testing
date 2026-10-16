const { test, expect } = require('../../fixtures');

test.describe('Daily Gold Rate – usability, accessibility and responsive', () => {
  test('TC_GR_054 - At tablet width (768px) the grid and New entry panel remain usable @regression', async ({ page, grp, record }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await expect(grp.newBtn).toBeVisible();
    await grp.openNew();
    await grp.type24k('15000');
    const v = await grp.values();
    const box = await grp.saveBtn.boundingBox();
    record(`768px: 22K ${v.r22}; Save button at x=${box && Math.round(box.x)} w=${box && Math.round(box.width)}`);
    expect(v.r22).not.toBe('');
    expect(box && box.x + box.width <= 768).toBeTruthy();
  });

  test('TC_GR_055 - Entry fields expose an accessible name (label or aria-label) @regression', async ({ grp, record }) => {
    await grp.openNew();
    const fields = { 'Trans Date': grp.transDate, '24K rate': grp.rate24k, '22K rate': grp.rate22k, '18K rate': grp.rate18k };
    const missing = [];
    for (const [name, loc] of Object.entries(fields)) {
      const accessible = await loc.evaluate((e) => !!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')));
      if (!accessible) missing.push(name);
    }
    record(`Fields without accessible name: ${missing.join(', ') || 'none'}`);
    expect(missing).toEqual([]);
  });

  test('TC_GR_064 - Online Rate / Internal Rate tabs switch content and back @regression', async ({ page, grp, record }) => {
    await grp.tab('Internal Rate');
    await expect(page.getByText('30 Days Average (A)').first()).toBeVisible();
    await grp.tab('Online Rate');
    await expect(grp.newBtn).toBeVisible();
    record('Internal Rate grid shown, then Online grid with New button again');
  });
});
