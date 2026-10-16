const { test, expect } = require('@playwright/test');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { GoldEstimatePage } = require('../pages/GoldEstimatePage');
const { GoldEstimateQueuePage } = require('../pages/GoldEstimateQueuePage');

// External Appraiser 1 (thangavel) independently re-weighs and appraises ONE estimate.
// Only estimates with Estimated Value > ₹10 lakh reach External Appraiser 1 (Estimate Approval Slabs) –
// create one with:  $env:ESTIMATE_GROSS_WT=120.5; npm run estimate; npm run estimate-approval
// Override target: $env:GE_NUMBER="GE2610000018"
const ARTICLE = { type: process.env.ESTIMATE_ARTICLE || 'NECKLACE', quantity: 1, grossWeight: Number(process.env.EXT_GROSS_WT || 120.3), stoneWastage: 0.6, stoneCount: 0 };

test('TC_GEEXT_001 - External Appraiser 1 (thangavel) appraises one Gold Estimate', async ({ page }, testInfo) => {
  const queue = new GoldEstimateQueuePage(page);
  const est = new GoldEstimatePage(page);
  let target;

  await test.step('Login as thangavel (External Appraiser 1)', () => new LoginPage(page).login('EXT_APPRAISER1'));
  await test.step('Open Loans → Gold → Gold Estimate Approval Queue', () => queue.open());

  await test.step('Pick one estimate awaiting External Appraiser 1', async () => {
    const rows = await queue.rows();
    console.log('Queue:\n' + rows.map((r) => `  ${r.ge} | ${r.customer} | ${r.value} | ${r.status} | ${r.action}`).join('\n'));
    const mine = rows.filter((r) => /External Appraiser 1/i.test(r.status) && /Appraise/i.test(r.action));
    const ge = process.env.GE_NUMBER || flow.need('geNumber', 'estimate');
    const routed = flow.read().routedTo || '';
    test.skip(!process.env.GE_NUMBER && /checker/i.test(routed), `Flow estimate ${ge} was routed straight to "${routed}" – no External Appraiser needed (amount slab)`);
    target = mine.find((r) => r.ge === ge);
    test.skip(!target, `Flow estimate ${ge} is not waiting for External Appraiser 1 – only estimates with Estimated Value > ₹10 lakh go there (use $env:ESTIMATE_GROSS_WT=120.5 when running npm run estimate)`);
    testInfo.annotations.push({ type: 'GE', description: `${target.ge} – ${target.customer} – ${target.value}` });
  });

  await test.step('Click Appraise → form shows prefilled contact / scheme / image', async () => {
    await page.locator('tr', { hasText: target.ge }).getByRole('button', { name: /Appraise/ }).click();
    await expect(page.getByText(`Appraise GE Number: ${target.ge}`)).toBeVisible();
    await expect(est.articleRows().first()).toBeVisible();
  });

  await test.step('Enter External Appraiser\'s own article measurement', async () => {
    const row = await est.fillArticle(0, ARTICLE);
    console.log('Article row:', row.slice(0, 120));
    const t = await est.totals();
    console.log('Totals:', JSON.stringify(t));
    expect(Number(t.pureNetWeight.replace(/[^\d.]/g, ''))).toBeGreaterThan(0);
    await est.remarks.fill(`External Appraiser 1 (automation) ${new Date().toISOString().slice(0, 16)}`);
  });

  await test.step('Save → review → Confirm & Save', async () => {
    await est.save.click();
    const summary = await est.confirmReview();
    console.log('Review:', summary.slice(0, 250));
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await est.messages()).join(' ');
    console.log('Messages after save:', msgs);
    expect(msgs).toMatch(/success|saved|routed|appraised/i);
    expect(msgs).not.toMatch(/error|fail|please/i);
  });
});
