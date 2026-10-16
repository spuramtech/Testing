const { test, expect } = require('../../fixtures');

// Member tab on the simulated token UID99999. All writes blocked.
const MOTHER = { name: 'LAKSHMI QA', relationship: 'Mother', contact: '9876500011' };

test.describe('Gold Token – nominee validation (simulated token)', () => {
  test('TC_GT_010 - Next without a nominee: "Please add at least one Nominee before proceeding." @smoke @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.nextBtn.click();
    const msg = await gt.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Please add at least one Nominee before proceeding/);
    await expect(gt.amount).toHaveCount(0);
  });

  test('TC_GT_011 - Add without name and relationship is refused @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.addBtn.click();
    const msg = await gt.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/Please fill Full Name and Relationship before adding a nominee/);
  });

  test('TC_GT_012 - Relationship list offers the family relations @regression', async ({ page, simToken, record }) => {
    const { gt } = simToken;
    await gt.relationship.click();
    const opts = (await page.locator('ng-dropdown-panel .ng-option').allInnerTexts()).map((o) => o.trim());
    await page.keyboard.press('Escape');
    record(opts.join(', '));
    for (const r of ['Mother', 'Father', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister']) expect(opts).toContain(r);
  });

  test('TC_GT_013 - Nominee contact number accepts digits only (HYPOTHESIS) @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.nomineeContact.fill('');
    await gt.nomineeContact.pressSequentially('abc12345678901');
    const v = await gt.nomineeContact.inputValue();
    record(`Typed "abc12345678901" → "${v}"`);
    expect(v).toMatch(/^\d*$/);
  });

  test('TC_GT_014 - Nominee contact number is limited to 12 characters @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.nomineeContact.fill('');
    await gt.nomineeContact.pressSequentially('98765000119999');
    const v = await gt.nomineeContact.inputValue();
    record(`Typed 14 digits → "${v}" (${v.length})`);
    expect(v.length).toBeLessThanOrEqual(12);
  });

  test('TC_GT_015 - Proportion above 100 % is refused @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.addNominee({ ...MOTHER, proportion: 150 });
    const msg = await gt.messages();
    record(`Message "${msg}"; nominee rows ${await gt.nomineeRows().count()}`);
    expect(msg).toMatch(/Proportional should not be greater than 100/);
    expect(await gt.nomineeRows().count()).toBe(0);
  });

  test('TC_GT_016 - Nominee proportions must add up to 100 % before Next @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.addNominee({ ...MOTHER, proportion: 60 });
    await gt.clearToasts();
    await gt.nextBtn.click();
    const msg = await gt.waitMessage();
    record(`Message "${msg}"`);
    expect(msg).toMatch(/must add up to 100% across all nominees \(currently 60%\)/);
  });

  test('TC_GT_017 - The same nominee cannot be added twice ("Already existed") @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.addNominee({ ...MOTHER, proportion: 50 });
    await gt.clearToasts();
    await gt.addNominee({ ...MOTHER, proportion: 50 });
    const msg = await gt.messages();
    record(`Message "${msg}"; rows ${await gt.nomineeRows().count()}`);
    expect(msg).toMatch(/Already existed/);
    expect(await gt.nomineeRows().count()).toBe(1);
  });

  test('TC_GT_018 - Two nominees 60 % + 40 % allow Next to Loan Details @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.toLoanDetails([{ ...MOTHER, proportion: 60 }, { name: 'RAVI QA', relationship: 'Father', contact: '9876500012', proportion: 40 }]);
    record('Loan Details shown after 60 % + 40 %');
    await expect(gt.amount).toBeVisible();
  });

  test('TC_GT_019 - KYC: PAN / FORM 60 offers Form 60 and PAN CARD; reference max 30 characters @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.idProofType.selectOption({ label: 'PAN / FORM 60' });
    await gt.page.waitForTimeout(600);
    const opts = (await gt.idProof.locator('option').allInnerTexts()).map((o) => o.trim());
    await gt.idProof.selectOption({ label: 'PAN CARD' });
    const max = await gt.reference.getAttribute('maxlength');
    record(`ID proofs ${opts.join(', ')}; reference maxlength ${max}`);
    expect(opts).toEqual(expect.arrayContaining(['Form 60', 'PAN CARD']));
    expect(max).toBe('30');
  });

  test('TC_GT_020 - An added nominee can be removed before saving (HYPOTHESIS) @regression', async ({ simToken, record }) => {
    const { gt } = simToken;
    await gt.addNominee({ ...MOTHER, proportion: 100 });
    const row = gt.nomineeRows().first();
    const actions = await row.locator('button, a, i[class*=fa]').count();
    record(`Nominee row actions: ${actions}`);
    expect(actions, 'no delete/edit action on the nominee row').toBeGreaterThan(0);
  });
});
