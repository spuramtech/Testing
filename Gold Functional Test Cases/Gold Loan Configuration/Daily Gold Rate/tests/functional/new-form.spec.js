const { test, expect } = require('../../fixtures');
const { fmt, prevWorkingDay, today0, isSunday, addDays } = require('../../../../common/utils/workdays');

test.describe('Daily Gold Rate – New entry panel and Trans Date calendar', () => {
  test('TC_GR_013 - New opens "Online Gold Rate Submission" with read-only Loan Type "Gold Loan" and calculated 22K / 18K @smoke @regression', async ({ grp, record }) => {
    await grp.openNew();
    await expect(grp.panelTitle).toBeVisible();
    await expect(grp.loanType).toHaveValue('Gold Loan');
    expect(await grp.loanType.isEditable()).toBe(false);
    expect(await grp.rate24k.isEditable()).toBe(true);
    await expect(grp.rate24k).toHaveValue('');
    await expect(grp.rate22k).toHaveAttribute('placeholder', 'Calculated automatically');
    await expect(grp.rate18k).toHaveAttribute('placeholder', 'Calculated automatically');
    await expect(grp.saveBtn).toBeVisible();
    await expect(grp.clearBtn).toBeVisible();
    record('Panel open; Loan Type "Gold Loan" read-only; 24K empty & editable; 22K/18K "Calculated automatically"; Save + Clear shown');
  });

  test('TC_GR_014 - Trans Date defaults to the previous working day (HYPOTHESIS) @regression', async ({ grp, record }) => {
    await grp.openNew();
    const expected = fmt(prevWorkingDay());
    const actual = await grp.transDate.inputValue();
    record(`Default Trans Date ${actual}, previous working day ${expected}`);
    expect(actual).toBe(expected);
  });

  test('TC_GR_015 - Trans Date cannot be typed – it is set only from the calendar @regression', async ({ grp, record }) => {
    await grp.openNew();
    const before = await grp.transDate.inputValue();
    expect(await grp.transDate.isEditable()).toBe(false);
    await grp.transDate.press('Backspace').catch(() => {});
    await grp.page.keyboard.type('31/12/2099');
    if (await grp.calendar.isVisible().catch(() => false)) await grp.page.mouse.click(5, 5); // close the calendar without closing the panel
    record(`Field read-only; value stays ${await grp.transDate.inputValue()}`);
    await expect(grp.transDate).toHaveValue(before);
  });

  test('TC_GR_016 - Calendar disables today and every future date @regression', async ({ grp, record }) => {
    await grp.openNew();
    await grp.openCalendar();
    const t = today0();
    const lastDay = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    const disabled = await grp.disabledDays();
    const mustBeDisabled = [];
    for (let d = t.getDate(); d <= lastDay; d++) mustBeDisabled.push(d);
    record(`${await grp.calendarMonth()}: disabled ${disabled.join(',')}`);
    for (const d of mustBeDisabled) expect(disabled, `day ${d} (today or later) must be disabled`).toContain(d);
  });

  test('TC_GR_017 - Calendar disables Sundays (current and previous month) @regression', async ({ grp, record }) => {
    await grp.openNew();
    await grp.openCalendar();
    const out = [];
    for (const back of [0, 1]) {
      if (back) await grp.calendarPrev();
      const ref = new Date(today0().getFullYear(), today0().getMonth() - back, 1);
      const sundays = [];
      for (let d = new Date(ref); d.getMonth() === ref.getMonth(); d = addDays(d, 1)) if (isSunday(d)) sundays.push(d.getDate());
      const disabled = await grp.disabledDays();
      out.push(`${await grp.calendarMonth()} Sundays ${sundays.join(',')} disabled ${disabled.join(',')}`);
      for (const s of sundays) expect(disabled, `Sunday ${s} must be disabled`).toContain(s);
    }
    record(out.join(' | '));
  });

  test('TC_GR_018 - Calendar allows a past working day to be selected @regression', async ({ grp, record }) => {
    await grp.openNew();
    let d = addDays(today0(), -7);
    while (isSunday(d)) d = addDays(d, -1);
    const ok = await grp.pickDate(fmt(d));
    record(`Picked ${fmt(d)} → field "${await grp.transDate.inputValue()}"`);
    expect(ok).toBe(true);
  });

  test('TC_GR_052 - Clear empties 24K / 22K / 18K and keeps the Trans Date @regression', async ({ grp, record }) => {
    await grp.openNew();
    await grp.type24k('15000');
    await expect(grp.rate22k).not.toHaveValue('');
    const date = await grp.transDate.inputValue();
    await grp.clearBtn.click();
    const v = await grp.values();
    record(`After Clear: date ${v.date}, 24K "${v.r24}", 22K "${v.r22}", 18K "${v.r18}"`);
    expect(v).toEqual({ date, r24: '', r22: '', r18: '' });
  });

  test('TC_GR_053 - Edit opens the panel pre-filled with the row values and Trans Date locked (no save) @regression', async ({ grp, record }) => {
    const row = (await grp.rows()).find((r) => r.editable);
    test.skip(!row, 'no editable row in the last 30 days (every closing already has an approved Internal Rate)');
    await grp.rowLocator(row.date).locator('.fa-pencil').click();
    await expect(grp.rate24k).toBeVisible();
    const v = await grp.values();
    record(`Row ${row.date} ${row.r24}/${row.r22}/${row.r18} → panel ${v.date} ${v.r24}/${v.r22}/${v.r18}`);
    expect(v.date).toBe(row.date);
    expect(Number(v.r24.replace(/,/g, ''))).toBeCloseTo(row.r24, 2);
    expect(Number(v.r22.replace(/,/g, ''))).toBeCloseTo(row.r22, 2);
    expect(Number(v.r18.replace(/,/g, ''))).toBeCloseTo(row.r18, 2);
    expect(await grp.transDate.isEditable()).toBe(false);
    await expect(grp.updateBtn).toBeVisible();
    // leave without saving
    await grp.page.reload();
  });
});
