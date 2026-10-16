const { test, expect } = require('../../fixtures');

// Current Loan Payout Amount on a SINGLE PAYMENT loan. Nothing is submitted.
const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

test.describe('Loan Disbursal – payout amount validation', () => {
  for (const [id, typed, why, msg] of [
    ['023', '0', 'zero', true],
    ['024', '100', 'less than the available amount', true],
    ['025', 'MORE', 'more than the available amount', false],
    ['026', 'abc', 'letters', false],
    ['027', '-100', 'negative', true],
    ['028', '100.555', 'three decimals', true],
    ['029', '', 'empty', false],
  ]) {
    test(`TC_LD_${id} - Payout "${typed}" (${why}) is not accepted: full amount stays @regression`, async ({ loan, record }) => {
      const a = await loan.ld.amounts();
      const value = typed === 'MORE' ? String(a.available + 1000) : typed;
      await loan.ld.clearToasts();
      const v = await loan.ld.setPayout(value);
      const m = await loan.ld.messageText();
      record(`Typed "${value}" → "${v}"; message "${m}"`);
      expect(v).toBe(fmt(a.available));
      if (msg) expect(m).toMatch(/In Single Payment mode, full sanctioned amount must be disbursed/);
    });
  }

  test('TC_LD_030 - Payout field holds at most 18 characters @regression', async ({ loan, record }) => {
    const max = await loan.ld.payout.getAttribute('maxlength');
    record(`maxlength ${max}`);
    expect(max).toBe('18');
  });

  test('TC_LD_031 - Online Reference No holds at most 30 characters @regression', async ({ loan, page, record }) => {
    await loan.ld.selectPaymentMode('BANK');
    await loan.ld.chooseVia('Online');
    const ref = page.locator('input[formcontrolname=pChequenumber]');
    await ref.fill('');
    await ref.pressSequentially('R'.repeat(35), { delay: 0 });
    const v = await ref.inputValue();
    record(`maxlength ${await ref.getAttribute('maxlength')}; typed 35 → ${v.length}`);
    expect(v.length).toBe(30);
  });
});
