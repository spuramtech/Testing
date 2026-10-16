const { test, expect, testScheme } = require('../../fixtures');
const { internalLtv } = require('../../pages/GoldSchemeMatrixPage');

// REAL schemes on the server. Each test creates its own INACTIVE "AUTOTEST FT …" scheme (code AT-T…) and the
// `created` fixture deletes it afterwards, pass or fail. Skip all with GS_SKIP_CRUD=1.
test.skip(process.env.GS_SKIP_CRUD === '1', 'GS_SKIP_CRUD=1 – real create/update/delete skipped');

// Creates a scheme through the screen. opts: { slab0Rate, excludeLast }
async function create(gsm, created, data, opts = {}) {
  await gsm.openNew();
  await gsm.fill(data);
  await gsm.applyAll.click();
  if (opts.slab0Rate) await gsm.setSlabRate(0, opts.slab0Rate);
  if (opts.excludeLast) await gsm.toggleSlab(2);
  created.push(data.code);
  await gsm.saveBtn.click();
  return gsm.waitMessage();
}

test.describe('Gold Scheme Matrix – create, read, update, toggle, delete (real, cleaned up)', () => {
  test('TC_GS_048 - Admin creates a scheme with a custom slab rate and an excluded slab; it is listed with the right values @smoke @regression', async ({ gsm, apiHits, created, record }) => {
    const d = testScheme();
    const before = await gsm.totalItems();
    const msg = await create(gsm, created, d, { slab0Rate: 19, excludeLast: true });
    const saves = apiHits.filter((h) => /savegoldschemeconfiguration|savegoldschemeslabrates/i.test(h.url)).map((h) => `${h.url.split('/').pop()} ${h.status} ${String(h.text).slice(0, 20)}`);
    await gsm.reopen();
    const row = await gsm.findRow(d.code);
    const r = (await gsm.rows()).find((x) => x.code === d.code);
    record(`Message "${msg}"; API ${saves.join(', ')}; total ${before} → ${await gsm.totalItems()}; row ${JSON.stringify(r)}`);
    expect(msg).toMatch(/Scheme added successfully/);
    expect(row).toBeTruthy();
    expect(r).toMatchObject({ name: d.name, tenure: 6, type: 'Bullet', rate: 20, on: false });
    expect(r.paise).toBeCloseTo(1.667, 2);
    expect(r.ltv).toEqual([internalLtv(85, 19, 6, 'BULLET'), internalLtv(80, 20, 6, 'BULLET')]);
  });

  test('TC_GS_049 - Edit opens the scheme with its saved header, slab rates and exclusions @regression', async ({ gsm, created, record }) => {
    const d = testScheme();
    await create(gsm, created, d, { slab0Rate: 19, excludeLast: true });
    await gsm.reopen();
    await (await gsm.findRow(d.code)).locator('[title=Edit]').click();
    await expect(gsm.updateBtn).toBeVisible();
    const v = await gsm.values();
    const slabs = await gsm.slabs();
    record(`${JSON.stringify(v)}; slabs ${slabs.map((s) => `${s.rate}/${s.internal}`).join(' | ')}`);
    expect(v).toMatchObject({ code: d.code, name: d.name, tenure: '6', type: 'BULLET', rate: '20', active: false });
    expect(slabs.map((s) => s.rate)).toEqual([19, 20, 20]);
    expect(slabs[2].internal).toBe('Not offered');
  });

  test('TC_GS_050 - Update changes name and tenure; the grid shows the new values @regression', async ({ gsm, created, record }) => {
    const d = testScheme();
    await create(gsm, created, d);
    await gsm.reopen();
    await (await gsm.findRow(d.code)).locator('[title=Edit]').click();
    await gsm.fill({ name: `${d.name} UPD`, tenure: 12 });
    await gsm.updateBtn.click();
    const msg = await gsm.waitMessage();
    await gsm.reopen();
    await gsm.findRow(d.code);
    const r = (await gsm.rows()).find((x) => x.code === d.code);
    record(`Message "${msg}"; row ${JSON.stringify(r)}`);
    expect(msg).toMatch(/Scheme updated successfully/);
    expect(r).toMatchObject({ name: `${d.name} UPD`, tenure: 12 });
    expect(r.ltv[0]).toBeCloseTo(internalLtv(85, 20, 12, 'BULLET'), 2);
  });

  test('TC_GS_051 - Update keeps the custom slab rates and exclusions @regression', async ({ gsm, created, record }) => {
    const d = testScheme();
    await create(gsm, created, d, { slab0Rate: 19, excludeLast: true });
    await gsm.reopen();
    await (await gsm.findRow(d.code)).locator('[title=Edit]').click();
    await gsm.fill({ tenure: 12 });
    await gsm.updateBtn.click();
    await gsm.waitMessage();
    await gsm.reopen();
    await (await gsm.findRow(d.code)).locator('[title=Edit]').click();
    const slabs = await gsm.slabs();
    const r = (await gsm.rows()).find((x) => x.code === d.code);
    record(`After update: slab rates ${slabs.map((s) => s.rate).join('/')}, slab 3 ${slabs[2].internal}; grid LTV ${r && r.ltv.join('/')}`);
    expect(slabs.map((s) => s.rate)).toEqual([19, 20, 20]);
    expect(slabs[2].internal).toBe('Not offered');
  });

  test('TC_GS_052 - A second scheme with the same code and tenure is refused without a success message @regression', async ({ gsm, created, record }) => {
    const d = testScheme();
    await create(gsm, created, d);
    await gsm.reopen();
    const before = await gsm.totalItems();
    const msg = await create(gsm, created, { ...d, name: `${d.name} DUP` });
    await gsm.reopen();
    const after = await gsm.totalItems();
    record(`Second save with code ${d.code}: "${msg}"; schemes ${before} → ${after}`);
    expect(after).toBe(before);
    expect(msg).toMatch(/already exists with a 6 month tenure/);
    expect(msg).not.toMatch(/Scheme added successfully/);
  });

  test('TC_GS_053 - "Scheme on" switch disables and re-enables a scheme and the state is kept @regression', async ({ gsm, created, record }) => {
    const d = testScheme({ active: true });
    await create(gsm, created, d);
    await gsm.reopen();
    let row = await gsm.findRow(d.code);
    const sw = () => row.locator('input[type=checkbox]');
    const s0 = await sw().isChecked();
    await sw().locator('xpath=..').click();
    const m1 = await gsm.waitMessage();
    await gsm.reopen();
    row = await gsm.findRow(d.code);
    const s1 = await sw().isChecked();
    await gsm.clearToasts();
    await sw().locator('xpath=..').click();
    const m2 = await gsm.waitMessage();
    await gsm.reopen();
    row = await gsm.findRow(d.code);
    const s2 = await sw().isChecked();
    record(`on=${s0} → "${m1}" → on=${s1} → "${m2}" → on=${s2}`);
    expect([s0, s1, s2]).toEqual([true, false, true]);
    expect(m1).toMatch(/disabled/i);
    expect(m2).toMatch(/enabled|success/i);
  });

  test('TC_GS_054 - Delete asks for confirmation; Cancel keeps the scheme @regression', async ({ page, gsm, created, record }) => {
    const d = testScheme();
    await create(gsm, created, d);
    await gsm.reopen();
    let text = '';
    page.once('dialog', async (dl) => { text = dl.message(); await dl.dismiss(); });
    await (await gsm.findRow(d.code)).locator('[title=Delete]').click();
    await page.waitForTimeout(1200);
    const still = await gsm.findRow(d.code);
    record(`Dialog "${text}"; still listed ${!!still}`);
    expect(text).toContain(`Permanently delete scheme ${d.code} (${d.name}) and its slab rates? This cannot be undone`);
    expect(still).toBeTruthy();
  });

  test('TC_GS_055 - Delete confirmed removes the scheme with "Scheme <code> deleted." @regression', async ({ page, gsm, created, apiHits, record }) => {
    const d = testScheme();
    await create(gsm, created, d);
    await gsm.reopen();
    const before = await gsm.totalItems();
    page.once('dialog', (dl) => dl.accept());
    await (await gsm.findRow(d.code)).locator('[title=Delete]').click();
    const msg = await gsm.waitMessage();
    await gsm.reopen();
    const gone = !(await gsm.findRow(d.code));
    const api = apiHits.filter((h) => /deletegoldschemeconfiguration/i.test(h.url)).map((h) => `${h.status} ${h.text}`);
    record(`Message "${msg}"; API ${api.join(', ')}; total ${before} → ${await gsm.totalItems()}; gone ${gone}`);
    expect(msg).toContain(`Scheme ${d.code} deleted.`);
    expect(gone).toBe(true);
  });

  test('TC_GS_056 - A new Active scheme effective today is resolved as effective; an Inactive one is not (API) @regression', async ({ gsm, created, apiHits, record }) => {
    const a = testScheme({ active: true });
    const i = testScheme({ active: false });
    await create(gsm, created, a);
    await gsm.reopen();
    await create(gsm, created, i);
    apiHits.length = 0;
    await gsm.reopen();
    await expect.poll(() => !!apiHits.find((h) => /getresolvedgoldschemeltv/i.test(h.url) && h.text)).toBe(true);
    const res = JSON.parse(apiHits.find((h) => /getresolvedgoldschemeltv/i.test(h.url) && h.text).text);
    const ra = res.filter((x) => x.pSchemeCode === a.code);
    const ri = res.filter((x) => x.pSchemeCode === i.code);
    record(`Active ${a.code}: ${ra.map((x) => `${x.pSchemeStatus}/${x.pIsEffective}`).join(',')}; Inactive ${i.code}: ${ri.map((x) => `${x.pSchemeStatus}/${x.pIsEffective}`).join(',') || 'not listed'}`);
    expect(ra.length).toBeGreaterThan(0);
    expect(ra.every((x) => x.pSchemeStatus === 'ACTIVE' && x.pIsEffective)).toBe(true);
    expect(ri.every((x) => x.pSchemeStatus === 'INACTIVE')).toBe(true);
  });
});
