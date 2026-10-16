const fs = require('fs');
const path = require('path');
const { test, expect } = require('../../fixtures');
const env = require('../../../../common/config/env');
const data = require('../../test-data/gold-rate-data');
const { round2, parse } = require('../../pages/DailyGoldRatePage');
const { nextWorkingDay, fmt } = require('../../../../common/utils/workdays');

// Create → read → payload → update → delete on ONE synthetic rate (tests run in file order with 1 worker).
// WARNING: a new online rate locks as soon as the next working day already has an Internal Rate, and a locked rate
// cannot be deleted. These tests therefore only run with ALLOW_DATA_CREATION=1. The record is kept in
// test-data/last-created-rate.json.
const STATE = path.resolve(__dirname, '../../test-data/last-created-rate.json');
const state = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {});
const save = (v) => fs.writeFileSync(STATE, JSON.stringify({ ...state(), ...v }, null, 2));
const needCreated = () => { const s = state(); test.skip(!s.created || s.deleted, 'TC_GR_041 did not create a record in this run'); return s; };

test.describe('Daily Gold Rate – create, read, update, delete', () => {
  test.beforeAll(() => { if (fs.existsSync(STATE) && state().deleted !== false) fs.unlinkSync(STATE); });
  const gate = () => test.skip(!env.allowDataCreation, 'ALLOW_DATA_CREATION=1 not set – creating a rate can leave a permanent, locked record on the server');

  test('TC_GR_041 - Maker saves a 24K rate for a free past working day; double-click sends one save @smoke @regression', async ({ grp, apiHits, record }) => {
    gate();
    const date = await grp.freeDate({ cleanable: true });
    test.skip(!date, 'no free past working day whose next-day Internal Rate is still unapproved (record could not be cleaned up)');
    const r24 = round2(14000 + Math.random() * 1000);
    await grp.openNew();
    expect(await grp.pickDate(date)).toBe(true);
    await grp.type24k(r24.toFixed(2));
    const v = await grp.values();
    await grp.saveBtn.dblclick();
    const msg = await grp.waitMessage();
    await grp.page.waitForTimeout(1500);
    const online = apiHits.filter((h) => /saveonlinegoldrate/i.test(h.url));
    const ltv = apiHits.filter((h) => /savegoldrateltv/i.test(h.url));
    save({ created: /saved successfully/i.test(msg), deleted: false, date, r24, r22: Number(v.r22), r18: Number(v.r18), onlineBody: online[0]?.body, ltvBody: ltv[0]?.body, onlineResp: online[0]?.text });
    record(`Date ${date}, 24K ${r24}, 22K ${v.r22}, 18K ${v.r18}; message "${msg}"; saveonlinegoldrate calls ${online.length}, savegoldrateltv calls ${ltv.length}`);
    expect(msg).toMatch(/Online gold rate saved successfully/i);
    expect(msg).toMatch(new RegExp(`Internal Rate for ${fmt(nextWorkingDay(parse(date))).replace(/\//g, '\\/')}.*submitted for Checker approval`, 'i'));
    expect(online, 'double-click must not save twice').toHaveLength(1);
    expect(ltv).toHaveLength(1);
    expect(online[0].status).toBe(200);
  });

  test('TC_GR_042 - The saved rate is listed in the grid with the submitted 24K / 22K / 18K @regression', async ({ grp, record }) => {
    gate();
    const s = needCreated();
    const row = await grp.findRow(s.date);
    expect(row, `row ${s.date} not found in All range`).toBeTruthy();
    const r = (await grp.rows()).find((x) => x.date === s.date);
    record(`Grid ${r.date}: ${r.r24} / ${r.r22} / ${r.r18}; editable ${r.editable}, deletable ${r.deletable}`);
    expect(r.r24).toBeCloseTo(s.r24, 2);
    expect(r.r22).toBeCloseTo(s.r22, 2);
    expect(r.r18).toBeCloseTo(s.r18, 2);
    expect(r.editable && r.deletable).toBe(true);
  });

  test('TC_GR_043 - Save API payload: every carat takes the nearest higher tier rate; Internal Rate is for the next working day @regression', async ({ record }) => {
    gate();
    const s = needCreated();
    const online = JSON.parse(s.onlineBody).onlinegoldrates;
    const ltv = JSON.parse(s.ltvBody).goldrateltvs;
    const tiers = { 24: s.r24, 22: s.r22, 18: s.r18, 14: round2(s.r24 * 0.583) };
    const carat = (t) => Number(String(t).match(/(\d+)K/)[1]);
    const expectedFor = (k) => tiers[Object.keys(tiers).map(Number).filter((t) => t >= k).sort((a, b) => a - b)[0]];
    const lines = online.map((o) => `${carat(o.pgoldtype)}K ${o.pgoldrate}`);
    record(`Online payload: ${lines.join(', ')}; ltv date ${ltv[0].ptransdate.slice(0, 10)}; response ${s.onlineResp}`);
    for (const o of online) expect.soft(o.pgoldrate, `${o.pgoldtype}`).toBeCloseTo(expectedFor(carat(o.pgoldtype)), 2);
    expect(online.map((o) => o.ptransdate.slice(0, 10))).toEqual(online.map(() => s.date.split('/').reverse().join('-')));
    expect(ltv[0].ptransdate.slice(0, 10)).toBe(fmt(nextWorkingDay(parse(s.date))).split('/').reverse().join('-'));
    expect(ltv.map((l) => l.pgoldrate)).toEqual(online.map((o) => o.pgoldrate));
  });

  test('TC_GR_044 - Maker updates the rate; the grid shows the new 24K and recalculated 22K / 18K @regression', async ({ grp, record }) => {
    gate();
    const s = needCreated();
    const row = await grp.findRow(s.date);
    await row.locator('.fa-pencil').click();
    await expect(grp.transDate).toHaveValue(s.date);
    const r24 = round2(s.r24 + 111.11);
    await grp.type24k(r24.toFixed(2));
    const v = await grp.values();
    await grp.updateBtn.click();
    const msg = await grp.waitMessage();
    await grp.page.reload();
    await grp.open();
    await grp.findRow(s.date);
    const r = (await grp.rows()).find((x) => x.date === s.date);
    save({ r24, r22: Number(v.r22), r18: Number(v.r18) });
    record(`Updated to ${r24} → message "${msg}"; grid ${r.r24} / ${r.r22} / ${r.r18}`);
    expect(msg).toMatch(/success|updated/i);
    expect(r.r24).toBeCloseTo(r24, 2);
    expect(r.r22).toBeCloseTo(round2(r24 * data.ratio22), 2);
    expect(r.r18).toBeCloseTo(round2(r24 * data.ratio18), 2);
  });

  test('TC_GR_045 - Delete asks for confirmation; Cancel keeps the rate @regression', async ({ page, grp, record }) => {
    // Runs on the newest editable row and always dismisses – no data is changed
    const target = (await grp.rows()).find((r) => r.deletable);
    test.skip(!target, 'no deletable row in the last 30 days');
    let dialogText = '';
    page.once('dialog', async (d) => { dialogText = d.message(); await d.dismiss(); });
    await grp.rowLocator(target.date).locator('.fa-trash-o').click();
    await page.waitForTimeout(1500);
    record(`Dialog "${dialogText}"; row ${target.date} still visible: ${await grp.rowLocator(target.date).isVisible()}`);
    expect(dialogText).toMatch(new RegExp(`Permanently delete the Online Gold Rate entry for ${target.date.replace(/\//g, '\/')}`));
    await expect(grp.rowLocator(target.date)).toBeVisible();
  });

  test('TC_GR_046 - Delete confirmed removes the rate (test-data cleanup) @regression', async ({ page, grp, apiHits, record }) => {
    gate();
    const s = needCreated();
    const row = await grp.findRow(s.date);
    page.once('dialog', (d) => d.accept());
    await row.locator('.fa-trash-o').click();
    const msg = await grp.waitMessage();
    await page.reload();
    await grp.open();
    const still = await grp.findRow(s.date);
    const del = apiHits.filter((h) => h.method !== 'GET' && /delete/i.test(h.url));
    save({ deleted: !still });
    record(`Message "${msg}"; delete API ${del.map((d) => `${d.method} ${d.url.split('/').pop()} ${d.status}`).join(', ') || 'n/a'}; row present after reload: ${!!still}`);
    expect(msg).toMatch(/delet|success/i);
    expect(still).toBeNull();
  });
});
