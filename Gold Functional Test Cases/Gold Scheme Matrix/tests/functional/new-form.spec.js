const { test, expect } = require('../../fixtures');

const todayDmy = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

test.describe('Gold Scheme Matrix – New Scheme panel', () => {
  test('TC_GS_011 - New Scheme opens with default values @smoke @regression', async ({ page, gsm, record }) => {
    await gsm.openNew();
    const v = await gsm.values();
    record(JSON.stringify(v));
    await expect(page.getByText('Gold Scheme Configuration').first()).toBeVisible();
    expect(v.loanText).toMatch(/Select the loan/);
    expect(v).toMatchObject({ code: '', name: '', tenure: '3', type: 'BULLET', rate: '0', effectiveFrom: todayDmy(), active: true });
  });

  test('TC_GS_012 - Loan dropdown lists the gold loans from Loans Configuration @regression', async ({ gsm, apiHits, record }) => {
    await gsm.openNew();
    const opts = (await gsm.loan.locator('option').allInnerTexts()).slice(1).map((o) => o.trim());
    const api = JSON.parse(apiHits.find((h) => /getloanlist/i.test(h.url) && h.text).text).map((l) => `${l.pLoanName} (${l.pLoanCode})`);
    record(`Options ${opts.join(', ')}; API ${api.join(', ')}`);
    expect(opts).toEqual(api);
  });

  test('TC_GS_013 - Scheme Type offers Bullet and Regular Monthly Repayment @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    const opts = await gsm.type.locator('option').allInnerTexts();
    record(opts.join(' | '));
    expect(opts).toHaveLength(2);
    expect(opts[0]).toMatch(/^Bullet/);
    expect(opts[1]).toMatch(/^Regular Monthly Repayment/);
  });

  test('TC_GS_014 - Slab table shows the LTV Slab Master ranges with read-only RBI LTV @regression', async ({ gsm, apiHits, record }) => {
    await gsm.openNew();
    const slabs = await gsm.slabs();
    const master = JSON.parse(apiHits.find((h) => /getltvslabmaster/i.test(h.url) && h.text).text).filter((s) => s.pstatus === 'ACTIVE');
    record(slabs.map((s) => `${s.range} RBI ${s.rbi}% rate ${s.rate} paise ${s.paise} internal ${s.internal}`).join('; '));
    expect(slabs.map((s) => s.rbi)).toEqual(master.map((m) => Number(m.prbimaxltv)));
    // RBI LTV is plain text (no input) – only interest and paise are inputs
    expect(await gsm.slabRows().first().locator('input').count()).toBe(2);
  });

  test('TC_GS_015 - Effective From is chosen from the calendar and accepts a past date @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    expect(await gsm.effectiveFrom.isEditable()).toBe(false);
    await gsm.effectiveFrom.click();
    await expect(gsm.calendar).toBeVisible();
    await gsm.calendar.locator('.previous').click();
    const day = gsm.calendar.locator('td span:not(.is-other-month):not(.disabled)', { hasText: /^15$/ }).first();
    await day.click();
    const v = await gsm.effectiveFrom.inputValue();
    record(`Read-only input; picked 15th of previous month → ${v}`);
    expect(v).toMatch(/^15\/\d{2}\/\d{4}$/);
    expect(v).not.toBe(todayDmy());
  });

  test('TC_GS_016 - Clear resets the form to its defaults @regression', async ({ gsm, record }) => {
    await gsm.openNew();
    await gsm.fill({ loan: 'New Gold (GLNG)', code: 'AT-CLR', name: 'clear me', tenure: 12, rate: 18 });
    await gsm.clearBtn.click();
    await gsm.page.waitForTimeout(400);
    const v = await gsm.values();
    record(JSON.stringify(v));
    expect(v).toMatchObject({ code: '', name: '', tenure: '3', rate: '0' });
    expect(v.loanText).toMatch(/Select the loan/);
  });
});
