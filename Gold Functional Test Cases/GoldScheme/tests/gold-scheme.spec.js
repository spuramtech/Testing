const { test, expect } = require('@playwright/test');
const flow = require('../../utils/flow');
const dates = require('../../utils/dates');
const { LoginPage } = require('../../pages/LoginPage');
const { GoldSchemePage } = require('../pages/GoldSchemePage');
const { uniqueScheme } = require('../test-data/scheme');

test('TC_GOLDSCHEME_001 - Create one Gold Scheme (Scheme Matrix) as admin', async ({ page }, testInfo) => {
  const data = uniqueScheme();
  const scheme = new GoldSchemePage(page);
  testInfo.annotations.push({ type: 'test-data', description: `${data.code} / ${data.name} / ${data.tenure} mo / ${data.type} / ${data.rate}%` });

  await test.step('Login as admin (Checker/BH)', () => new LoginPage(page).login('CHECKER_BH'));
  await test.step('Open Loans → Gold → Gold Loan Configuration → Gold Scheme Matrix', () => scheme.open());
  await test.step('Click New Scheme', () => scheme.openNew());

  await test.step('Fill scheme details and apply interest to all slabs', async () => {
    await scheme.fill(data);
    // Back-dated flow: the scheme must already be effective on the back date, otherwise the estimate cannot use it
    const bd = dates.backDate();
    if (bd) {
      await dates.pickDate(page, scheme.effectiveFrom, bd, 'Scheme Effective From');
      console.log(`Scheme Effective From set to ${bd}`);
    }
    const slabs = await scheme.slabs();
    console.log('Slabs:\n' + slabs.map((s) => `  ${s.slab} | ${s.interest}% | ${s.paise} paise/mo | LTV ${s.ltv}`).join('\n'));
    expect(slabs.length).toBeGreaterThan(0);
    for (const s of slabs) {
      expect(s.interest).toBe(data.rate);
      expect(s.paise).toBeCloseTo(data.rate / 12, 2);
    }
  });

  await test.step('Save Scheme', async () => {
    await scheme.save.click();
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await scheme.messages()).join(' ');
    console.log('Messages after save:', msgs);
    expect(msgs).toMatch(/success|saved/i);
  });

  await test.step('Verify scheme appears in the matrix', async () => {
    const row = scheme.gridRow(data.code);
    await expect(row).toBeVisible();
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    console.log('Grid row:', text);
    const typeLabel = (text.match(/Bullet|Regular Monthly Repayment/i) || [data.type])[0];
    if (flow.read().flowId) flow.update('scheme', { schemeCode: data.code, schemeName: data.name, schemeType: typeLabel, schemeTenure: data.tenure, schemeRate: data.rate, schemeEffectiveFrom: require('../../utils/dates').backDate() || require('../../utils/dates').today() });
    console.log(`Flow scheme: ${data.code} / ${data.name} / ${typeLabel} / ${data.tenure} mo / ${data.rate}%`);
    expect(text).toContain(`${data.tenure} mo`);
    expect(text).toContain(`${data.rate.toFixed(2)}%`);
  });
});
