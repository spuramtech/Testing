const { test, expect, MAKER } = require('../../fixtures');
const data = require('../../test-data/approval-data');
const { GoldRateApprovalQueuePage } = require('../../pages/GoldRateApprovalQueuePage');

test.describe('Gold Rate Approval Queue – access by role', () => {
  for (const [id, role] of [['TC_GQ_031', MAKER], ['TC_GQ_032', 'INT_APPRAISER2']]) {
    test(`${id} - Non-checker (${role}) sees the Gold Rate Approval card locked and cannot open the queue @regression`, async ({ page, loginAs, record }) => {
      await loginAs(role);
      const q = new GoldRateApprovalQueuePage(page);
      await q.openConfiguration();
      const cardText = (await q.configCard().innerText()).replace(/\s+/g, ' ');
      await page.getByText('Gold Rate Approval', { exact: true }).first().click();
      await page.waitForTimeout(2000);
      record(`Card "${cardText}"; URL after click ${page.url()}; queue cards ${await q.cards.count()}`);
      expect(cardText).toContain(data.lockedCard);
      expect(page.url()).not.toMatch(/open=GoldRateApprovalQueue/);
      expect(await q.cards.count()).toBe(0);
    });
  }

  test(`TC_GQ_033 - Maker opening the queue URL directly gets no queue and no queue data @regression`, async ({ page, loginAs, apiHits, record }) => {
    await loginAs(MAKER);
    const q = new GoldRateApprovalQueuePage(page);
    await q.openConfiguration(); // let user rights load
    await page.goto('#/Loans/GoldLoanConfiguration?open=GoldRateApprovalQueue');
    await page.waitForTimeout(3000);
    const called = apiHits.some((h) => /GetPendingGoldRateApprovals/i.test(h.url));
    record(`Queue cards ${await q.cards.count()}; Approve buttons ${await page.locator('.grq-btn-approve').count()}; queue API called ${called}`);
    expect(await page.locator('.grq-btn-approve').count()).toBe(0);
    expect(called).toBe(false);
  });

  test('TC_GQ_034 - IsGoldRateChecker answers true for the checker @regression', async ({ queue, apiHits, record }) => {
    const hit = apiHits.find((h) => /IsGoldRateChecker/i.test(h.url) && h.text !== undefined);
    record(`${hit && hit.url.split('/').pop()} → ${hit && hit.text}`);
    expect(hit.text.trim()).toBe('true');
  });

  test('TC_GQ_035 - IsGoldRateChecker answers false for the maker @regression', async ({ page, loginAs, apiHits, record }) => {
    await loginAs(MAKER);
    await new GoldRateApprovalQueuePage(page).openConfiguration();
    await expect.poll(() => !!apiHits.find((h) => /IsGoldRateChecker/i.test(h.url) && h.text !== undefined), { timeout: 15_000 }).toBe(true);
    const hit = apiHits.find((h) => /IsGoldRateChecker/i.test(h.url) && h.text !== undefined);
    record(`${hit.url.split('/').pop()} → ${hit.text}`);
    expect(hit.text.trim()).toBe('false');
  });
});
