const { test, expect, MAKER } = require('../../fixtures');
const { GoldSchemeMatrixPage } = require('../../pages/GoldSchemeMatrixPage');
const { go } = require('../../../common/utils/nav');

test.describe('Gold Scheme Matrix – access by role', () => {
  test(`TC_GS_057 - User without rights (${MAKER}) sees "No view permission" and cannot open the screen @regression`, async ({ page, loginAs, record }) => {
    await loginAs(MAKER);
    await go(page, 'Gold Loan Configuration', ['Loans', 'Gold']);
    await page.waitForURL(/GoldLoanConfiguration/);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    const card = page.getByText('Gold Scheme Matrix', { exact: true }).first().locator('xpath=ancestor::*[contains(normalize-space(.),"tenure, interest")][1]');
    const text = (await card.innerText()).replace(/\s+/g, ' ');
    await page.getByText('Gold Scheme Matrix', { exact: true }).first().click();
    await page.waitForTimeout(2000);
    record(`Card "${text}"; URL ${page.url()}; New Scheme visible ${await page.getByText('New Scheme').first().isVisible().catch(() => false)}`);
    expect(text).toMatch(/No view permission in User Rights for GoldSchemeMatrix/);
    expect(page.url()).not.toMatch(/open=GoldSchemeMatrix/);
  });

  test(`TC_GS_058 - ${MAKER} opening the Scheme Matrix URL directly gets no screen and no scheme data @regression`, async ({ page, loginAs, apiHits, record }) => {
    await loginAs(MAKER);
    await go(page, 'Gold Loan Configuration', ['Loans', 'Gold']);
    await page.waitForURL(/GoldLoanConfiguration/);
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.goto('#/Loans/GoldLoanConfiguration?open=GoldSchemeMatrix');
    await page.waitForTimeout(3000);
    const listCalled = apiHits.some((h) => /getgoldschemeconfigurationlist/i.test(h.url));
    record(`New Scheme visible ${await page.getByText('New Scheme').first().isVisible().catch(() => false)}; list API called ${listCalled}`);
    expect(await page.getByText('New Scheme').first().isVisible().catch(() => false)).toBe(false);
    expect(listCalled).toBe(false);
  });

  test('TC_GS_059 - Scheme Code cannot be changed when editing an existing scheme (HYPOTHESIS) @regression', async ({ gsm, record }) => {
    const [r] = await gsm.rows();
    await (await gsm.findRow(r.code)).locator('[title=Edit]').click();
    await expect(gsm.updateBtn).toBeVisible();
    const editable = await gsm.code.isEditable();
    record(`Editing ${r.code}: Scheme Code editable = ${editable} (not saved)`);
    expect(editable).toBe(false);
    void GoldSchemeMatrixPage;
  });
});
