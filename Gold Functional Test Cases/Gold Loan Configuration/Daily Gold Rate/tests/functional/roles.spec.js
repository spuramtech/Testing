const { test, expect, CHECKER, MAKER } = require('../../fixtures');
const env = require('../../../../common/config/env');
const { DailyGoldRatePage } = require('../../pages/DailyGoldRatePage');
const { GoldRateApprovalPage } = require('../../../../common/pages/GoldRateApprovalPage');

test.describe('Daily Gold Rate – roles and maker/checker workflow', () => {
  test(`TC_GR_047 - Checker (${CHECKER}) sees no Edit / Delete actions on Online rates @regression`, async ({ page, loginAs, record }) => {
    await loginAs(CHECKER);
    const grp = new DailyGoldRatePage(page);
    await grp.open();
    const rows = await grp.rows();
    const withActions = rows.filter((r) => r.editable || r.deletable);
    record(`${rows.length} rows; rows with edit/delete for checker: ${withActions.map((r) => r.date).join(', ') || 'none'}`);
    expect(rows.length).toBeGreaterThan(0);
    expect(withActions).toEqual([]);
  });

  test(`TC_GR_048 - Maker (${MAKER}) cannot approve any Gold Rate submission @regression`, async ({ page, loginAs, record }) => {
    await loginAs(MAKER);
    const q = new GoldRateApprovalPage(page);
    await q.open().catch(() => {});
    const subs = await q.submissions();
    const enabled = subs.filter((s) => s.enabled);
    record(`${subs.length} submissions visible to maker; approvable: ${enabled.length}`);
    expect(enabled).toHaveLength(0);
  });

  test('TC_GR_049 - IsGoldRateChecker API answers false for the maker @regression', async ({ grp, apiHits, record }) => {
    const hit = apiHits.find((h) => /IsGoldRateChecker/i.test(h.url) && h.text !== undefined);
    expect(hit, 'IsGoldRateChecker was not called').toBeTruthy();
    record(`${hit.url.split('/').pop()} → ${hit.status} ${hit.text}`);
    expect(hit.status).toBe(200);
    expect(hit.text.trim()).toBe('false');
  });

  test(`TC_GR_056 - Checker approves a pending Internal Rate submitted by another user @regression`, async ({ page, loginAs, record }) => {
    test.skip(!env.allowApproval, 'ALLOW_APPROVAL=1 not set – approving changes the live rate used by other users');
    await loginAs(CHECKER);
    const q = new GoldRateApprovalPage(page);
    await q.open();
    const target = (await q.submissions()).find((s) => s.enabled);
    test.skip(!target, 'no submission the checker may approve');
    await q.approve(target.index);
    const msg = (await q.messages()).join(' ');
    await page.waitForTimeout(1500);
    const left = (await q.submissions()).map((s) => s.date);
    record(`Approved ${target.date} by ${target.submittedBy}: "${msg}"; remaining ${left.join(', ') || 'none'}`);
    expect(msg).toMatch(/approv|success/i);
    expect(left).not.toContain(target.date);
  });
});
