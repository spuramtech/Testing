const { test, expect } = require('../../fixtures');

// Generator screen as Branch Head. Every write is blocked, so nothing is recorded.
const loansApi = (hits, type) => JSON.parse(hits.filter((h) => new RegExp(`getloansforbarcode\\?Type=${type}`, 'i').test(h.url) && h.text).pop()?.text || '[]');

test.describe('Gold Packet Barcode Generator – generator screen', () => {
  test('TC_PB_001 - Page shows Type, Loan Number, Employee Name and Generate barcode @smoke @regression', async ({ bc, page, record }) => {
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(text.split('Gold Packet Barcode').pop().slice(0, 250));
    expect(text).toMatch(/Generate a one-time barcode sticker for a pledged gold packet/);
    for (const t of ['TYPE', 'LOAN NUMBER', 'EMPLOYEE NAME', 'VIEW REGISTER']) expect(text.toUpperCase()).toContain(t);
    await expect(bc.loan).toBeVisible();
    await expect(bc.generateBtn).toBeVisible();
  });

  test('TC_PB_002 - Type defaults to BH @regression', async ({ bc, record }) => {
    const v = await bc.checkedType();
    record(`Checked type value "${v}"`);
    expect(v).toBe('New');
  });

  test('TC_PB_003 - Employee Name is the logged-in user and cannot be edited @regression', async ({ bc, page, record }) => {
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const emp = (text.match(/EMPLOYEE NAME\s+(.+?)\s+Generate barcode/i) || [])[1];
    const editable = await page.locator('input:visible').evaluateAll((els) => els.filter((e) => !e.readOnly && !e.disabled && /Finsta Admin/.test(e.value)).length);
    record(`Employee "${emp}", editable inputs holding the name: ${editable}`);
    expect(emp).toBe('Finsta Admin');
    expect(editable).toBe(0);
  });

  test('TC_PB_004 - BH loan list = API list of loans not yet packeted @smoke @regression', async ({ bc, apiHits, record }) => {
    const ui = (await bc.loanOptions()).map((o) => o.split(' - ')[0]).sort();
    const api = loansApi(apiHits, 'New').map((l) => l.pVchapplicationid).sort();
    record(`UI ${ui.length}, API ${api.length}`);
    expect(api.length).toBeGreaterThan(0);
    expect(ui).toEqual(api);
  });

  test('TC_PB_005 - Audit loan list = API list of loans already in inventory @regression', async ({ bc, apiHits, record }) => {
    await bc.selectType('Audit');
    const ui = (await bc.loanOptions()).map((o) => o.split(' - ')[0]).sort();
    const api = loansApi(apiHits, 'Audit').map((l) => l.pVchapplicationid).sort();
    record(`UI ${ui.length}, API ${api.length}`);
    expect(ui).toEqual(api);
  });

  test('TC_PB_006 - Switching to Audit changes the hint and the loan list @regression', async ({ bc, page, record }) => {
    const bh = await bc.loanOptions();
    await bc.selectType('Audit');
    const au = await bc.loanOptions();
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(`BH ${bh.length} loans, Audit ${au.length} loans`);
    expect(text).toMatch(/Loans that already have a packet in inventory/);
    expect(au).not.toEqual(bh);
  });

  test('TC_PB_007 - Each loan option shows loan number and applicant name @regression', async ({ bc, record }) => {
    const opts = await bc.loanOptions();
    record(opts.slice(0, 3).join(' | '));
    for (const o of opts) expect(o).toMatch(/^GLNG\d+ - .+/);
  });

  test('TC_PB_008 - Generate without a loan shows no preview @smoke @regression', async ({ bc, page, record }) => {
    await bc.generateBtn.click();
    await page.waitForTimeout(1200);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    record(`Preview shown: ${/not yet recorded/.test(text)}; hint: ${/Select a loan number/.test(text)}`);
    expect(text).not.toMatch(/Preview - not yet recorded/);
    await expect(bc.printBtn).toHaveCount(0);
  });

  test('TC_PB_009 - Generate shows a preview with branch, type, loan and employee, and no barcode number yet @smoke @regression', async ({ bc, record }) => {
    const loan = (await bc.loanOptions())[0].split(' - ')[0];
    await bc.selectLoan(loan);
    await bc.generateBtn.click();
    await expect(bc.printBtn.or(bc.cancelOldBtn)).toBeVisible();
    const t = await bc.previewText();
    test.skip(/already has an unused/.test(t), `${loan} already has an unused barcode`);
    record(t.slice(0, 220));
    expect(t).toMatch(/Preview - not yet recorded/);
    expect(t).toMatch(/BRANCH\s*HEAD OFFICE/);
    expect(t).toMatch(/TYPE\s*BH/);
    expect(t).toContain(loan);
    expect(t).toMatch(/EMPLOYEE\s*Finsta Admin/);
    expect(t).toMatch(/Barcode number is assigned only when you click "Print sticker"/);
  });

  test('TC_PB_010 - Generate is only a preview: no write request is sent @regression', async ({ bc, page, record }) => {
    const writes = [];
    page.on('request', (r) => { if (r.method() !== 'GET' && /\/api\//.test(r.url())) writes.push(r.url()); });
    await bc.selectLoan((await bc.loanOptions())[0].split(' - ')[0]);
    await bc.generateBtn.click();
    await page.waitForTimeout(1500);
    record(`Write requests: ${writes.length}`);
    expect(writes).toEqual([]);
  });

  test('TC_PB_011 - After switching type, any preview shown matches the selected type (HYPOTHESIS) @regression', async ({ bc, record }) => {
    await bc.selectLoan((await bc.loanOptions())[0].split(' - ')[0]);
    await bc.generateBtn.click();
    await expect(bc.printBtn).toBeVisible();
    await bc.selectType('Audit');
    const t = await bc.previewText();
    const stale = /not yet recorded/.test(t) && /TYPE\s*BH/.test(t);
    record(stale ? `BH preview still shown after selecting Audit: ${t.slice(0, 120)}` : 'Preview cleared or updated');
    expect(stale).toBe(false);
  });

  test('TC_PB_012 - Typing in Loan Number filters the list @regression', async ({ bc, page, record }) => {
    const first = (await bc.loanOptions())[0].split(' - ')[0];
    await bc.loan.click();
    await bc.loan.locator('input').fill(first);
    await page.waitForTimeout(600);
    const opts = await page.locator('ng-dropdown-panel .ng-option').allInnerTexts();
    record(`"${first}" → ${opts.length} option(s)`);
    expect(opts.length).toBe(1);
    expect(opts[0]).toContain(first);
  });
});
