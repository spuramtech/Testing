const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const dates = require('../utils/dates');
const { LoginPage } = require('../pages/LoginPage');
const { GoldRatePage } = require('../pages/GoldRatePage');

// Creates one Daily Gold Rate (Online Rate) entry for the default Trans Date.
// 24K is generated automatically from the latest grid rate; override with GOLD_RATE_24K=15300.
// Login role defaults to tryfinsta (INT_APPRAISER1); override with GOLD_RATE_ROLE=CHECKER_BH.
const ROLE = process.env.GOLD_RATE_ROLE || 'INT_APPRAISER1';

test(`TC_GOLDRATE_001 - Create one Daily Gold Rate entry (24K auto → 22K/18K auto) as ${ROLE}`, async ({ page }, testInfo) => {
  const gold = new GoldRatePage(page);
  let transDate = null;
  let rate24k;

  await test.step(`Login as ${ROLE}`, () => new LoginPage(page).login(ROLE));
  await test.step('Open Loans → Gold → Gold Loan Configuration → Daily Gold Rate', () => gold.open());

  await test.step('Generate 24K rate', async () => {
    rate24k = process.env.GOLD_RATE_24K ? Number(process.env.GOLD_RATE_24K) : await gold.auto24k();
  });

  await test.step('Click New', () => gold.openNew());

  let alreadyExists = false;
  await test.step('Choose a Trans Date that has no rate yet', async () => {
    const defaultDate = await gold.transDate.inputValue();
    // Back-dated flow: the gold rate must be for the BACK_DATE (it unlocks that date for estimate → token → disbursal)
    const fixed = process.env.GOLD_RATE_DATE || dates.backDate();
    const candidates = fixed ? [fixed] : await gold.freeDates(defaultDate);
    for (const c of candidates) {
      if (c === defaultDate || (await gold.pickTransDate(c))) { transDate = c; break; }
      console.log(`Trans Date ${c} not selectable, trying an earlier date`);
    }
    expect(transDate, `none of these dates could be selected: ${candidates.join(', ')}`).toBeTruthy();
    if (transDate !== defaultDate) console.log(`Default date ${defaultDate} already has a rate → using ${transDate}`);
  });

  await test.step('Enter 24K rate and verify 22K / 18K auto-calculation', async () => {
    await gold.enter24k(rate24k);
    const r22 = GoldRatePage.num(await gold.rate22k.inputValue());
    const r18 = GoldRatePage.num(await gold.rate18k.inputValue());
    console.log(`Trans Date ${transDate} | 24K ${rate24k} | 22K ${r22} | 18K ${r18}`);
    expect(r22).toBeCloseTo(rate24k * 0.916, 1);
    expect(r18).toBeCloseTo(rate24k * 0.75, 1);
    testInfo.annotations.push({ type: 'test-data', description: `Date ${transDate}, 24K ${rate24k}, 22K ${r22}, 18K ${r18}` });
  });

  await test.step('Save', async () => {
    await gold.save.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await gold.messages()).join(' ');
    console.log('Messages after save:', msgs);
    if (dates.backDate() && /already exists/i.test(msgs)) {
      alreadyExists = true; // a rate for the back date is already there – that is all the flow needs
      console.log(`Gold rate for ${transDate} already exists – reusing it for the back-dated flow`);
    } else expect(msgs).toMatch(/success/i);
    if (dates.backDate()) flow.update('goldrate', { goldRateDate: transDate, goldRateCreated: !alreadyExists });
  });

  await test.step('Verify the new rate row appears in the grid', async () => {
    test.skip(alreadyExists, 'rate for this date already existed');
    const row = await gold.rowFor(transDate);
    if (dates.backDate() && dates.monthsBetween(transDate) >= 1 && !(await row.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log(`${transDate} is outside the grid's default "Last 30 Days" range – saved message already confirmed it`);
      return;
    }
    await expect(row).toBeVisible();
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    console.log('Grid row:', text);
    expect(text).toContain(rate24k.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  });
});
