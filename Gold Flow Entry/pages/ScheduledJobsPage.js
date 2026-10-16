const { expect } = require('@playwright/test');
const dates = require('../utils/dates');

// Loans → Jobs → Scheduled Jobs: cards "Accrued Interest Job", "Penality", "Instalment Receivables", "Advance Paid", "Inter Branch Job"
// – each with its own Date and "Run Job" button.
class ScheduledJobsPage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    const p = this.page;
    const link = p.getByText('Scheduled Jobs', { exact: true }).locator('visible=true').first();
    if (!(await link.isVisible().catch(() => false))) {
      await p.getByText('Loans', { exact: true }).first().click();
      await p.getByText('Jobs', { exact: true }).locator('visible=true').first().click();
    }
    await link.click();
    await p.waitForURL(/ScheduledJobs/, { timeout: 30_000 });
    await expect(p.getByText('Accrued Interest Job', { exact: true })).toBeVisible();
  }

  // Cards always appear in this order, each with exactly one Date box and one Run Job button
  static ORDER = ['Accrued Interest Job', 'Penality', 'Instalment Receivables', 'Advance Paid', 'Inter Branch Job'];

  // Set the card's date, optional selects ({ Type: 'Non EMI', pJobRunMode: 'Instalment Date' }), click Run Job,
  // confirm if asked, and return the app's message.
  async run(title, date, selects = {}) {
    const i = ScheduledJobsPage.ORDER.indexOf(title);
    if (i < 0) throw new Error(`Unknown job "${title}"`);
    await dates.pickDate(this.page, this.page.locator('input[formcontrolname=pDate]').nth(i), date, `${title} Date`);
    // Type first; Job Run Mode only exists for EMI (Non EMI hides it: "Month-end date only")
    for (const [fc, label] of Object.entries(selects)) {
      const sel = this.page.locator(`select[formcontrolname=${fc}]`);
      if (await sel.isVisible().catch(() => false)) await sel.selectOption({ label });
    }
    await expect(this.page.locator('.toast-message')).toHaveCount(0, { timeout: 15_000 }).catch(() => {});
    await this.page.getByText('Run Job', { exact: true }).locator('visible=true').nth(i).click(); // not a <button>
    const confirm = this.page.locator('.swal2-confirm:visible, .modal.show button:has-text("Yes"), .modal.show button:has-text("Confirm"), .modal.show button:has-text("Ok")').first();
    if (await confirm.isVisible({ timeout: 2500 }).catch(() => false)) await confirm.click();
    const msg = this.page.locator('.toast-message, .swal2-html-container, .swal2-title').first();
    await expect(msg).toBeVisible({ timeout: 120_000 }); // jobs can take a while
    return (await this.page.locator('.toast-message, .swal2-html-container, .swal2-title').allInnerTexts()).join(' | ');
  }
}

module.exports = { ScheduledJobsPage };
