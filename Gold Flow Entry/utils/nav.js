// Sidebar navigation that works whatever state the menu is in (collapsed, or a submenu already expanded).
// go(page, 'Gold Stock Audit', ['Loans', 'Gold']) → clicks the link directly if visible, otherwise expands the parents first.
// Click that survives the Dashboard's loading overlay (spinner covering the sidebar right after login)
async function click(page, locator) {
  // normal click first (waits until the item is stable); force only as a last resort
  try { await locator.click({ timeout: 15_000 }); } catch { await locator.click({ force: true }); }
}

async function go(page, leaf, parents = []) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  const link = () => page.getByText(leaf, { exact: true }).locator('visible=true').first();
  if (await link().isVisible().catch(() => false)) return click(page, link());
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const p of parents) {
      if (await link().isVisible().catch(() => false)) break;
      // top-level group (e.g. "Loans") – the FIRST match is the sidebar item (later matches are header / breadcrumb labels)
      const item = p === parents[0] ? page.getByText(p, { exact: true }).first() : page.getByText(p, { exact: true }).locator('visible=true').first();
      if (await item.isVisible().catch(() => false)) {
        await click(page, item);
        await page.waitForTimeout(1000); // let the submenu finish expanding before clicking the next item
      }
    }
    if (await link().isVisible().catch(() => false)) return click(page, link());
    // a parent click may have collapsed an already-open group – go back to the top level and retry
    await click(page, page.getByText(parents[0], { exact: true }).first()).catch(() => {});
    await page.waitForTimeout(1000);
  }
  await click(page, link()); // final attempt: let Playwright report a clear error if it still isn't there
}

module.exports = { go, click };
