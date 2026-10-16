const path = require('path');
const { test, expect } = require('@playwright/test');
const dates = require('../utils/dates');
const flow = require('../utils/flow');
const { LoginPage } = require('../pages/LoginPage');
const { GoldEstimatePage } = require('../pages/GoldEstimatePage');

// One Gold Estimate for an existing AUTOTEST contact (create one with: npm run contact).
const DATA = {
  // Contact = the current flow's contact (searched by mobile). Override only with $env:ESTIMATE_CONTACT.
  // Scheme created by the automation (npm run scheme); newest AUTOTEST scheme is picked. Required: 'New Gold' has no per-loan LTV slab.
  scheme: process.env.ESTIMATE_SCHEME || 'AUTOTEST SCHEME',
  // Gross weight decides the approval route (Estimate Approval Slabs): ~10.5 g → Internal only; ≥ ~80 g (> ₹10 lakh) → + External Appraiser 1
  article: { type: process.env.ESTIMATE_ARTICLE || 'RING', quantity: 1, grossWeight: Number(process.env.ESTIMATE_GROSS_WT || 10.5), stoneWastage: 0.5, stoneCount: 0 },
  image: path.resolve(__dirname, '../test-data/gold-article.png'),
  remarks: `Automation estimate ${new Date().toISOString().slice(0, 16)}`,
};

test('TC_GOLDEST_001 - Create one Gold Estimate (1 article) as tryfinsta', async ({ page }, testInfo) => {
  const est = new GoldEstimatePage(page);
  let contactName;

  await test.step('Login as tryfinsta (Internal Appraiser 1)', () => new LoginPage(page).login('INT_APPRAISER1'));
  await test.step('Open Loans → Gold → Gold Estimates', () => est.open());

  await test.step('Select contact', async () => {
    const search = process.env.ESTIMATE_CONTACT || flow.need('mobile', 'contact');
    contactName = await est.selectContact(search);
    if (!process.env.ESTIMATE_CONTACT) expect(contactName, 'selected contact must be the flow contact').toContain(flow.read().mobile);
    console.log('Contact:', contactName);
  });

  await test.step('Estimate Date (back-dated flow)', async () => {
    const bd = dates.backDate();
    if (!bd) return; // no BACK_DATE – estimate dated today
    await dates.pickDate(page, page.locator('[formcontrolname=ptodayDate]').first(), bd, 'Gold Estimate Date');
    await page.waitForTimeout(1500);
    console.log(`Estimate Date set to ${bd}`);
  });

  await test.step('Gold details: Loan Name / Scheme', async () => {
    await expect(est.loanName).not.toHaveValue('');
    // Only the scheme created in this flow's Gold Scheme Matrix step (falls back to $env:ESTIMATE_SCHEME / newest AUTOTEST only outside a flow)
    const wanted = process.env.ESTIMATE_SCHEME || flow.read().schemeName || DATA.scheme;
    const scheme = await est.selectScheme(wanted);
    if (flow.read().schemeName && !process.env.ESTIMATE_SCHEME) {
      expect(scheme, 'estimate must use the flow scheme').toContain(flow.read().schemeName);
      expect(scheme).toContain(`${flow.read().schemeTenure} mo`);
    }
    console.log('Scheme:', scheme);
  });

  await test.step('Enter one gold article', async () => {
    const row = await est.fillArticle(0, DATA.article);
    console.log('Article row:', row);
    const t = await est.totals();
    console.log('Totals:', JSON.stringify(t));
    expect(t.quantity).toBe(String(DATA.article.quantity));
    expect(Number(t.pureNetWeight.replace(/[^\d.]/g, ''))).toBeGreaterThan(0);
    testInfo.annotations.push({ type: 'test-data', description: `${contactName} | ${DATA.article.type} ${DATA.article.grossWeight}g | ${JSON.stringify(t)}` });
  });

  await test.step('Upload gold article image and remarks', async () => {
    await est.uploadImage(DATA.image);
    await est.remarks.fill(DATA.remarks);
  });

  await test.step('Save → review dialog → Confirm & Save', async () => {
    await est.save.click();
    const summary = await est.confirmReview();
    const value = (summary.match(/ESTIMATE VALUE ₹ ?([d,.]+)/i) || [])[1];
    console.log('Review:', summary.slice(0, 300));
    testInfo.annotations.push({ type: 'estimate-value', description: value || 'n/a' });
    await expect(page.locator('.toast-message, .swal2-html-container').first()).toBeVisible();
    const msgs = (await est.messages()).join(' ');
    console.log('Messages after save:', msgs);
    expect(msgs).toMatch(/success|saved|submitted/i);
    const ge = (msgs.match(/GE\d{6,}/) || [])[0];
    expect(ge, 'GE number in the save message').toBeTruthy();
    const routedTo = ((msgs.match(/Routed to (.+?) for/i) || [])[1] || '').trim(); // e.g. "Internal Appraiser 2" / "Checker"
    flow.update('estimate', { geNumber: ge, routedTo, estimateGrossWt: DATA.article.grossWeight, ...(dates.backDate() ? { backDate: dates.backDate() } : {}) });
    console.log(`Flow: estimate ${ge} saved for ${contactName}`);
  });
});
